// splash.js — 伞沿滴水 + 地面水花。
// 两者都用 THREE.Points 实现，生命周期完全由时间和随机种子在顶点着色器里算出，CPU 不做逐帧更新。
// 位置用图片坐标定义，通过共享的映射函数跟随背景的视差和镜头推近。

import * as THREE from "three";
import { VIEW_GLSL, imagePointToUv, imageRectToUv } from "./view.js";

// ---------------------------------------------------------------------------
// 伞沿滴水：每个滴落点轮流长出一颗水珠，挂住、变大、拉长后坠落
// ---------------------------------------------------------------------------
const DRIP_VERTEX = /* glsl */ `
${VIEW_GLSL}
uniform vec2 uForegroundOffset;
uniform float uFallDistance;   // 图片高度比例
attribute vec2 aAnchor;        // 滴落点（图片 uv，y 向上）
attribute vec3 aSeed;          // x: 周期系数，y: 相位，z: 大小系数
varying float vStretch;
varying float vAlpha;
varying float vRadius;
varying float vSpriteSize;

void main() {
  float period = 1.8 + aSeed.x * 2.6;
  float cycleTime = uTime + aSeed.y * period;
  float phase = fract(cycleTime / period);
  float cycle = floor(cycleTime / period);

  vec2 anchorPx = imageToScreenPx(aAnchor, uForegroundOffset);
  anchorPx.x += (hash11(cycle + aSeed.y * 31.0) - 0.5) * 4.0;
  float scale = uZoom * uViewport.y / 900.0;   // 让水珠大小随屏幕高度变化
  float radius = (2.2 + aSeed.z * 1.6) * clamp(scale, 0.7, 1.6);

  float hangPortion = 0.55;
  vec2 position = anchorPx;
  float stretch = 1.0;
  float alpha = 1.0;
  if (phase < hangPortion) {
    // 挂在伞沿上慢慢变大，末尾略微下坠
    float grow = phase / hangPortion;
    radius *= mix(0.35, 1.0, grow);
    position.y += radius * (0.4 + grow * grow * 0.9);
    stretch = 1.0 + grow * grow * 0.5;
  } else {
    // 自由落体，速度越快拉得越长，接近下落距离时淡出
    float t = (phase - hangPortion) * period;
    float fall = 0.5 * 2200.0 * t * t;
    float limit = imageHeightToPx(uFallDistance);
    float speed = 2200.0 * t;
    position.y += radius * 1.3 + fall;
    stretch = 1.4 + min(speed / 500.0, 2.6);
    alpha = 1.0 - smoothstep(limit * 0.6, limit, fall);
  }

  vStretch = stretch;
  vAlpha = alpha;
  vRadius = radius;
  vSpriteSize = radius * stretch * 2.0 + 3.0;
  gl_PointSize = vSpriteSize * uDpr;
  gl_Position = screenPxToClip(position);
}
`;

const DRIP_FRAGMENT = /* glsl */ `
uniform float uAlpha;
varying float vStretch;
varying float vAlpha;
varying float vRadius;
varying float vSpriteSize;

void main() {
  vec2 p = (gl_PointCoord - 0.5) * vSpriteSize;   // CSS 像素，y 向下
  float radiusY = vRadius * vStretch;
  // 上窄下圆的泪滴形
  float taper = mix(0.45, 1.0, smoothstep(-radiusY, radiusY * 0.35, p.y));
  vec2 q = p / vec2(vRadius * taper, radiusY);
  float d = length(q);
  if (d > 1.0) discard;
  float edge = 1.0 - smoothstep(0.75, 1.0, d);
  // 简单的水珠明暗：边缘偏暗、左上高光
  float rim = smoothstep(0.4, 1.0, d);
  float highlight = 1.0 - smoothstep(0.0, 0.35, length(q - vec2(-0.3, -0.35)));
  vec3 color = mix(vec3(0.78, 0.84, 0.95), vec3(0.35, 0.42, 0.58), rim * 0.6) + highlight * 0.6;
  gl_FragColor = vec4(color, edge * vAlpha * uAlpha);
}
`;

// ---------------------------------------------------------------------------
// 地面水花：一圈扁椭圆的涟漪 + 几颗向上溅起的小水珠
// ---------------------------------------------------------------------------
const SPRAY_PER_SPLASH = 4;

const SPLASH_VERTEX = /* glsl */ `
${VIEW_GLSL}
uniform vec2 uGroundOffset;
uniform vec4 uRegion;          // 图片 uv（y 向上）：x0, y0, x1, y1
attribute vec4 aSeed;          // x: 位置种子，y: 周期系数，z: 大小系数，w: 相位
attribute float aKind;         // 0 = 涟漪圈，1..N = 溅起的水珠
varying float vKind;
varying float vLife;
varying float vRadius;
varying float vSpriteSize;

void main() {
  float period = 0.8 + aSeed.y * 1.4;
  float cycleTime = uTime + aSeed.w * period;
  float phase = fract(cycleTime / period);
  float cycle = floor(cycleTime / period);
  float activePortion = 0.45;
  float life = phase / activePortion;

  // 每个周期换一个随机落点
  vec2 random = vec2(hash11(cycle * 1.37 + aSeed.x * 91.0), hash11(cycle * 2.11 + aSeed.x * 53.0));
  vec2 originUv = mix(uRegion.xy, uRegion.zw, random);
  vec2 originPx = imageToScreenPx(originUv, uGroundOffset);
  // 离镜头越近（越靠下）水花越大
  float nearness = 1.0 - random.y;
  float scale = mix(0.45, 1.25, nearness) * clamp(uZoom * uViewport.y / 900.0, 0.7, 1.6);

  vKind = aKind;
  vLife = life;
  vRadius = 1.0;
  vec2 position = originPx;
  float spriteSize;
  if (life > 1.0) {
    spriteSize = 0.0;
  } else if (aKind < 0.5) {
    float grow = 1.0 - pow(1.0 - life, 3.0);
    vRadius = mix(1.5, 10.0 + aSeed.z * 9.0, grow) * scale;
    spriteSize = vRadius * 2.0 + 4.0;
  } else {
    float t = life * activePortion * period;
    float spread = (aKind - 1.0) / ${SPRAY_PER_SPLASH - 1}.0 - 0.5;
    float angle = spread * 2.0 + (hash11(cycle + aKind * 7.0 + aSeed.x) - 0.5) * 0.5;
    float launch = (80.0 + hash11(cycle * 3.0 + aKind) * 90.0) * scale;
    float rise = cos(angle) * launch * t - 0.5 * 900.0 * scale * t * t;
    position += vec2(sin(angle) * launch * t * 0.8, -max(rise, 0.0));
    vRadius = (0.9 + aSeed.z * 0.6) * scale;
    spriteSize = rise < 0.0 ? 0.0 : vRadius * 2.0 + 2.0;
  }
  vSpriteSize = spriteSize;
  gl_PointSize = spriteSize * uDpr;
  gl_Position = screenPxToClip(position);
}
`;

const SPLASH_FRAGMENT = /* glsl */ `
uniform float uAlpha;
varying float vKind;
varying float vLife;
varying float vRadius;
varying float vSpriteSize;

void main() {
  vec2 p = (gl_PointCoord - 0.5) * vSpriteSize;
  float fade = pow(1.0 - clamp(vLife, 0.0, 1.0), 1.5);
  float alpha;
  if (vKind < 0.5) {
    // 扁椭圆圆环：地面透视下的涟漪
    float flatten = 0.32;
    float d = length(p / vec2(vRadius, vRadius * flatten));
    float bandPx = abs(d - 1.0) * vRadius * flatten;
    alpha = (1.0 - smoothstep(0.3, 1.3, bandPx)) * fade;
  } else {
    float d = length(p) / vRadius;
    alpha = (1.0 - smoothstep(0.6, 1.0, d)) * fade;
  }
  if (alpha <= 0.002) discard;
  gl_FragColor = vec4(0.86, 0.9, 1.0, alpha * uAlpha);
}
`;

function createDrips(viewUniforms, dripConfig) {
  const dropsPerAnchor = 2;
  const count = dripConfig.points.length * dropsPerAnchor;
  const anchors = new Float32Array(count * 2);
  const seeds = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  dripConfig.points.forEach((point, pointIndex) => {
    const anchor = imagePointToUv(point);
    for (let k = 0; k < dropsPerAnchor; k++) {
      const index = pointIndex * dropsPerAnchor + k;
      anchors.set([anchor.x, anchor.y], index * 2);
      seeds.set([Math.random(), (k + Math.random() * 0.6) / dropsPerAnchor, Math.random()], index * 3);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aAnchor", new THREE.BufferAttribute(anchors, 2));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
  const material = new THREE.ShaderMaterial({
    vertexShader: DRIP_VERTEX,
    fragmentShader: DRIP_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      ...viewUniforms,
      uFallDistance: { value: dripConfig.fallDistance },
      uAlpha: { value: dripConfig.alpha }
    }
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 20;
  return points;
}

function createSplashes(viewUniforms, splashConfig) {
  const pointsPerSplash = 1 + SPRAY_PER_SPLASH;
  const count = splashConfig.count * pointsPerSplash;
  const seeds = new Float32Array(count * 4);
  const kinds = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  for (let splash = 0; splash < splashConfig.count; splash++) {
    const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
    for (let kind = 0; kind < pointsPerSplash; kind++) {
      const index = splash * pointsPerSplash + kind;
      seeds.set(seed, index * 4);
      kinds[index] = kind;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  geometry.setAttribute("aKind", new THREE.BufferAttribute(kinds, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: SPLASH_VERTEX,
    fragmentShader: SPLASH_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      ...viewUniforms,
      uRegion: { value: imageRectToUv(splashConfig.region) },
      uAlpha: { value: splashConfig.alpha }
    }
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 5;   // 在雨丝下面，贴着地面
  return points;
}

/** 返回 { group }，包含伞沿滴水与地面水花 */
export function createWaterDetails(viewUniforms, config) {
  const group = new THREE.Group();
  group.add(createSplashes(viewUniforms, config.splashes));
  group.add(createDrips(viewUniforms, config.umbrellaDrips));
  return { group };
}
