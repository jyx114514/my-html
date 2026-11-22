// background.js — 背景图层：视差合成、霓虹呼吸光、湿地面倒影波动、滚动景深、点击涟漪折射。
// 整个背景是一张铺满屏幕的平面，所有效果都在片元着色器里完成。

import * as THREE from "three";
import { MAX_LAYERS, imageRectToUv } from "./view.js";

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
uniform sampler2D uLayer0;
uniform sampler2D uLayer1;
uniform sampler2D uLayer2;
uniform int uLayerCount;
uniform int uForegroundIndex;
uniform vec2 uLayerOffsets[${MAX_LAYERS}];

uniform sampler2D uNeonMask;
uniform float uHasNeonMask;

uniform vec2 uCenter;
uniform vec2 uScaleVec;
uniform float uZoom;
uniform vec2 uViewport;
uniform float uTime;
uniform float uScroll;

uniform float uScrollBlur;
uniform float uScrollDarken;
uniform float uNeonStrength;
uniform vec4 uNeonRegion;
uniform vec4 uReflectionRegion;
uniform float uReflectionStrength;

uniform vec4 uRipples[RIPPLE_COUNT];   // xy: 屏幕 uv，z: 开始时间，w: 强度
uniform float uRippleDuration;
uniform float uRippleStrength;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// 区域遮罩：rect 内为 1，边缘羽化
float regionMask(vec2 uv, vec4 rect, float feather) {
  vec2 inside = smoothstep(rect.xy - feather, rect.xy + feather, uv)
              * (1.0 - smoothstep(rect.zw - feather, rect.zw + feather, uv));
  return inside.x * inside.y;
}

vec4 sampleLayer(int index, vec2 uv, float bias) {
  vec4 result = texture2D(uLayer2, uv, bias);
  if (index == 0) result = texture2D(uLayer0, uv, bias);
  else if (index == 1) result = texture2D(uLayer1, uv, bias);
  return result;
}

void main() {
  // ---- 点击涟漪：扰动屏幕 uv，并记录高光 ----
  vec2 screenUv = vUv;
  float aspect = uViewport.x / uViewport.y;
  float rippleLight = 0.0;
  for (int i = 0; i < RIPPLE_COUNT; i++) {
    vec4 ripple = uRipples[i];
    float age = uTime - ripple.z;
    if (ripple.w <= 0.0 || age < 0.0 || age > uRippleDuration) continue;
    float life = age / uRippleDuration;
    vec2 delta = (screenUv - ripple.xy) * vec2(aspect, 1.0);
    float dist = length(delta);
    float radius = age * 0.42;
    float band = dist - radius;
    float envelope = exp(-band * band * 900.0) * (1.0 - life) * (1.0 - life);
    float wave = sin(band * 120.0) * envelope;
    vec2 direction = dist > 0.0001 ? delta / dist : vec2(0.0);
    screenUv += direction / vec2(aspect, 1.0) * wave * uRippleStrength * ripple.w;
    rippleLight += max(wave, 0.0) * ripple.w;
  }

  vec2 baseUv = uCenter + (screenUv - 0.5) * uScaleVec / uZoom;

  // ---- 湿地面倒影：细腻的横向流动波纹；单层模式自动避开左侧人物 ----
  vec4 refRect = uReflectionRegion;
  if (uLayerCount == 1) refRect.x = max(refRect.x, 0.56);
  float reflectionMask = regionMask(baseUv, refRect, 0.08);
  vec2 wobble = vec2(
    sin(baseUv.y * 180.0 + uTime * 2.0) * 0.65 + sin(baseUv.y * 74.0 - uTime * 1.2 + baseUv.x * 7.0) * 0.35,
    sin(baseUv.x * 36.0 + uTime * 1.5) * 0.2
  ) * uReflectionStrength * reflectionMask;

  // ---- 霓虹呼吸光参数（连续平滑波，避免出现网格方块边界） ----
  vec2 farUv = baseUv - uLayerOffsets[0];
  float breathe = 0.55
    + 0.28 * sin(uTime * 1.15 + farUv.x * 9.0 + farUv.y * 4.0)
    + 0.17 * sin(uTime * 1.85 - farUv.x * 15.0 + farUv.y * 7.0);
  vec3 halo = texture2D(uLayer0, farUv, 4.5).rgb;
  vec3 glow = max(halo - 0.52, 0.0) * 1.25;

  // ---- 图层合成（远 → 近），滚动越深景深越浅 ----
  // 底色设为雨雾蓝灰，避免 far/mid 羽化交界处透出黑色
  vec3 color = vec3(0.76, 0.80, 0.88);
  for (int i = 0; i < ${MAX_LAYERS}; i++) {
    if (i >= uLayerCount) break;
    bool isForeground = i == uForegroundIndex;
    vec2 layerUv = baseUv - uLayerOffsets[i];
    // 湿地面倒影波动：多层时只作用于中景地面，单层占位时作用于整图的地面区域
    if ((!isForeground && i > 0) || uLayerCount == 1) layerUv += wobble;
    float bias = uScroll * uScrollBlur * (isForeground ? 0.65 : 1.0);
    vec4 layerColor = sampleLayer(i, layerUv, bias);

    // 霓虹呼吸光加在远景层（i == 0）上，再被中景人群和前景人物自然遮挡
    if (i == 0) {
      vec3 unpremul = layerColor.a > 0.001 ? layerColor.rgb / layerColor.a : vec3(0.0);
      float neon;
      if (uHasNeonMask > 0.5) {
        neon = texture2D(uNeonMask, farUv).r;
      } else {
        float luminance = dot(unpremul, vec3(0.299, 0.587, 0.114));
        float saturation = max(unpremul.r, max(unpremul.g, unpremul.b)) - min(unpremul.r, min(unpremul.g, unpremul.b));
        neon = smoothstep(0.62, 0.94, luminance + saturation * 0.35) * regionMask(layerUv, uNeonRegion, 0.08);
      }
      layerColor.rgb += (layerColor.rgb * 0.28 + glow * layerColor.a) * neon * breathe * uNeonStrength;
      // 远处光晕：模拟雨夜空气中的柔光散射
      layerColor.rgb += max(halo - 0.65, 0.0) * 0.32 * uNeonStrength * layerColor.a;
    }

    // 纹理已开启 premultiplyAlpha，采用预乘合成，避免景深 mipmap 模糊时人物边缘发黑
    color = color * (1.0 - layerColor.a) + layerColor.rgb;
  }

  // ---- 调色：偏冷的蓝灰，暗部提一点蓝 ----
  color = mix(color, color * vec3(0.92, 0.97, 1.08), 0.5);
  color += vec3(0.01, 0.015, 0.03);

  // 涟漪高光
  color += vec3(0.75, 0.85, 1.0) * rippleLight * 0.12;

  // 滚动压暗 + 暗角
  color *= 1.0 - uScroll * uScrollDarken;
  vec2 centered = vUv - 0.5;
  float vignette = smoothstep(0.95, 0.25, length(centered * vec2(aspect * 0.75, 1.0)));
  color *= mix(0.72, 1.0, vignette);

  // 胶片颗粒
  float grain = hash21(vUv * uViewport + fract(uTime * 13.0) * 100.0) - 0.5;
  color += grain * 0.025;

  gl_FragColor = vec4(color, 1.0);
}
`;

function loadTexture(loader, src) {
  return new Promise((resolve, reject) => {
    loader.load(src, (texture) => {
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.premultiplyAlpha = true;
      texture.anisotropy = 4;
      resolve(texture);
    }, undefined, () => reject(new Error("背景素材加载失败：" + src)));
  });
}

/**
 * 创建背景平面。layers 是 config.layers（已按性能等级挑选），返回 { mesh, imageAspect, addRipple }。
 */
export async function createBackground(viewUniforms, layers, config) {
  const loader = new THREE.TextureLoader();
  const textures = await Promise.all(layers.map((layer) => loadTexture(loader, layer.src)));
  const neonMask = config.neonMask ? await loadTexture(loader, config.neonMask) : null;

  const firstImage = textures[0].image;
  const imageAspect = firstImage.width / firstImage.height;
  // 不足 3 层时，用第一层占位，保证每个 sampler 都绑定了有效纹理
  const placeholder = textures[0];

  const rippleCount = config.ripple.maxRipples;
  const ripples = Array.from({ length: rippleCount }, () => new THREE.Vector4(0, 0, -100, 0));
  let nextRipple = 0;

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    defines: { RIPPLE_COUNT: rippleCount },
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uCenter: viewUniforms.uCenter,
      uScaleVec: viewUniforms.uScaleVec,
      uZoom: viewUniforms.uZoom,
      uViewport: viewUniforms.uViewport,
      uTime: viewUniforms.uTime,
      uScroll: viewUniforms.uScroll,
      uLayerOffsets: viewUniforms.uLayerOffsets,
      uLayer0: { value: textures[0] },
      uLayer1: { value: textures[1] || placeholder },
      uLayer2: { value: textures[2] || placeholder },
      uLayerCount: { value: textures.length },
      uForegroundIndex: { value: Math.max(0, layers.findIndex((layer) => layer.isForeground)) },
      uNeonMask: { value: neonMask || placeholder },
      uHasNeonMask: { value: neonMask ? 1 : 0 },
      uScrollBlur: { value: config.background.scrollBlur },
      uScrollDarken: { value: config.background.scrollDarken },
      uNeonStrength: { value: config.background.neonStrength },
      uNeonRegion: { value: imageRectToUv(config.background.neonRegion) },
      uReflectionRegion: { value: imageRectToUv(config.background.reflectionRegion) },
      uReflectionStrength: { value: config.background.reflectionStrength },
      uRipples: { value: ripples },
      uRippleDuration: { value: config.ripple.duration },
      uRippleStrength: { value: config.ripple.strength }
    }
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 0;

  // 点击涟漪：x、y 为 CSS 像素（y 向下），轮流覆盖最旧的一个
  function addRipple(x, y, strength = 1) {
    const viewport = viewUniforms.uViewport.value;
    ripples[nextRipple].set(x / viewport.x, 1 - y / viewport.y, viewUniforms.uTime.value, strength);
    nextRipple = (nextRipple + 1) % rippleCount;
  }

  return { mesh, imageAspect, addRipple, sourceImage: firstImage };
}
