// rain.js — 空中雨丝：远近两层带柔边的窄四边形。
// 移植自 personal/js/rain.js：每根雨丝的位置完全在顶点着色器里由时间计算，CPU 不需要逐帧更新。
// 新增：鼠标附近的雨丝被横向推开；滚动越深雨越密。

import * as THREE from "three";
import { VIEW_GLSL } from "./view.js";

const VERTEX = /* glsl */ `
${VIEW_GLSL}
attribute vec4 aSeed;      // x: 横向位置(0~1)，y: 速度系数，z: 长度系数，w: 相位
uniform vec4 uParams;      // 基础速度(px/s)，基础长度(px)，斜率，透明度
uniform float uWidth;      // CSS 像素
uniform float uRepelRadius;
varying float vAlpha;
varying float vAcross;

void main() {
  // position.x: 0 = 头，1 = 尾；position.y: -1 / +1 两侧
  float W = uViewport.x;
  float H = uViewport.y;
  float speed = uParams.x * (0.7 + aSeed.y * 0.6);
  float len = uParams.y * (0.6 + aSeed.z * 0.8);
  float travel = H + len * 2.0;
  float y = mod(aSeed.w * travel + uTime * speed, travel) - len;
  float slant = uParams.z;
  float ey = y + len * position.x;
  float ex = (aSeed.x * (W + 80.0) - 40.0) + slant * ey;

  // 鼠标推开：离鼠标越近，横向位移越大
  vec2 toStreak = vec2(ex, ey) - uPointerPx;
  float pointerDistance = length(toStreak);
  float push = 1.0 - smoothstep(0.0, uRepelRadius, pointerDistance);
  ex += sign(toStreak.x) * push * push * uRepelRadius * 0.55;

  float pixel = 1.0 / uDpr;
  vec2 normal = normalize(vec2(1.0, -slant));
  vAcross = position.y * (uWidth + pixel) * 0.5;
  ex += normal.x * vAcross;
  ey += normal.y * vAcross;
  gl_Position = screenPxToClip(vec2(ex, ey));
  vAlpha = uParams.w * (1.0 - position.x * 0.75) * (1.0 - push * 0.6);
}
`;

const FRAGMENT = /* glsl */ `
uniform float uWidth;
uniform float uDpr;
varying float vAlpha;
varying float vAcross;
void main() {
  float pixel = 1.0 / uDpr;
  float edge = 1.0 - smoothstep(max(0.0, (uWidth - pixel) * 0.5), (uWidth + pixel) * 0.5, abs(vAcross));
  gl_FragColor = vec4(0.85, 0.9, 1.0, vAlpha * edge);
}
`;

function seededRandom(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeGeometry(count, seedBase) {
  const corners = [[0, -1], [1, -1], [0, 1], [0, 1], [1, -1], [1, 1]];
  const positions = new Float32Array(count * 6 * 3);
  const seeds = new Float32Array(count * 6 * 4);
  for (let i = 0; i < count; i++) {
    const seed = [
      seededRandom(seedBase + i + 1),
      seededRandom(seedBase + i + 101),
      seededRandom(seedBase + i + 201),
      seededRandom(seedBase + i + 301)
    ];
    for (let corner = 0; corner < 6; corner++) {
      const vertex = i * 6 + corner;
      positions.set([corners[corner][0], corners[corner][1], 0], vertex * 3);
      seeds.set(seed, vertex * 4);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  return geometry;
}

/** 创建远近两层雨丝。返回 { group, setDensity(scale) }。 */
export function createRain(viewUniforms, rainConfig) {
  const group = new THREE.Group();
  const layers = [rainConfig.far, rainConfig.near].map((layerConfig, index) => {
    // 预留滚动加密所需的最大数量，平时用 drawRange 只画一部分
    const maxCount = Math.ceil(layerConfig.count * (1 + rainConfig.scrollBoost));
    const geometry = makeGeometry(maxCount, index * 10000);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        ...viewUniforms,
        uParams: { value: new THREE.Vector4(layerConfig.speed, layerConfig.len, layerConfig.slant, layerConfig.alpha) },
        uWidth: { value: Math.max(0.25, layerConfig.width) },
        uRepelRadius: { value: rainConfig.pointerRepel * (index === 0 ? 0.7 : 1) }
      }
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 10 + index;
    group.add(mesh);
    return { mesh, baseCount: layerConfig.count, maxCount };
  });

  // scale：性能等级带来的数量比例；scroll：0~1 的滚动进度
  function update(scale, scroll) {
    layers.forEach((layer) => {
      const wanted = layer.baseCount * scale * (1 + rainConfig.scrollBoost * scroll);
      const count = Math.max(0, Math.min(layer.maxCount, Math.floor(wanted)));
      layer.mesh.geometry.setDrawRange(0, count * 6);
    });
  }

  return { group, update };
}
