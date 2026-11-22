// view.js — 背景图片与屏幕之间的映射关系（cover 铺满 + 视差 + 镜头推近）。
//
// 背景、雨丝、伞沿滴水、地面水花都要知道「图片上某一点此刻在屏幕哪里」，
// 所以映射参数放在一组共享 uniform 里，每帧由 updateView() 更新一次，各个材质直接引用同一个对象。
//
// 坐标约定（着色器内）：
//   图片 uv：0~1，y 轴向上（与 Three.js 纹理一致）
//   屏幕 uv：0~1，y 轴向上
//   屏幕像素：CSS 像素，y 轴向下（与 DOM 事件一致）
//
// 映射公式：imageUv = center + (screenUv - 0.5) * scaleVec / zoom - layerOffset

import * as THREE from "three";

export const MAX_LAYERS = 3;

export function createViewUniforms() {
  return {
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uScaleVec: { value: new THREE.Vector2(1, 1) },
    uZoom: { value: 1 },
    uViewport: { value: new THREE.Vector2(1, 1) },   // CSS 像素
    uDpr: { value: 1 },
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointerPx: { value: new THREE.Vector2(-9999, -9999) }, // CSS 像素，y 向下
    // 每个图层的视差位移（图片 uv）
    uLayerOffsets: { value: [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()] },
    // 前景层（人物 + 伞）与地面层的位移，供伞沿滴水 / 地面水花使用
    uForegroundOffset: { value: new THREE.Vector2() },
    uGroundOffset: { value: new THREE.Vector2() }
  };
}

// 所有叠加特效共用的映射函数
export const VIEW_GLSL = /* glsl */ `
uniform vec2 uCenter;
uniform vec2 uScaleVec;
uniform float uZoom;
uniform vec2 uViewport;
uniform float uDpr;
uniform float uTime;
uniform float uScroll;
uniform vec2 uPointerPx;

// 图片 uv（y 向上）→ 屏幕 CSS 像素（y 向下）
vec2 imageToScreenPx(vec2 imageUv, vec2 layerOffset) {
  vec2 screenUv = 0.5 + (imageUv - uCenter + layerOffset) * uZoom / uScaleVec;
  return vec2(screenUv.x * uViewport.x, (1.0 - screenUv.y) * uViewport.y);
}

// 屏幕 CSS 像素 → 裁剪空间
vec4 screenPxToClip(vec2 px) {
  return vec4(px.x / uViewport.x * 2.0 - 1.0, 1.0 - px.y / uViewport.y * 2.0, 0.0, 1.0);
}

// 图片上的长度（图片高度比例）→ 屏幕 CSS 像素
float imageHeightToPx(float h) {
  return h * uZoom / uScaleVec.y * uViewport.y;
}

float hash11(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
`;

// 图片坐标（左上角原点，y 向下）→ 着色器图片 uv（y 向上）
export function imagePointToUv(point) {
  return new THREE.Vector2(point[0], 1 - point[1]);
}

// 区域 [x0, y0, x1, y1]（左上角原点）→ 着色器用 vec4（y 向上，x0 < x1，y0 < y1）
export function imageRectToUv(rect) {
  return new THREE.Vector4(rect[0], 1 - rect[3], rect[2], 1 - rect[1]);
}

/**
 * 每帧更新映射参数。
 * state: { width, height, dpr, imageAspect, pointer:{x,y}(-1~1), pointerPx:{x,y}, scroll(0~1), time }
 */
export function updateView(uniforms, state, layers, config) {
  const bg = config.background;
  const screenAspect = state.width / state.height;
  const imageAspect = state.imageAspect;

  // 缩放 1 时屏幕能看到的图片比例（cover 铺满）
  const scaleVec = uniforms.uScaleVec.value;
  if (screenAspect > imageAspect) scaleVec.set(1, imageAspect / screenAspect);
  else scaleVec.set(screenAspect / imageAspect, 1);

  const zoom = bg.overscan * (1 + bg.scrollZoom * state.scroll);
  uniforms.uZoom.value = zoom;

  // 视差位移：画面朝鼠标反方向移动，像镜头往鼠标方向转；近处的层移动更多。
  // pointer.y 向下为正，屏幕 uv 的 y 向上为正，所以 y 方向不取反就已经是反向移动。
  // y 方向乘以图片宽高比，让横竖位移在屏幕上等量。
  const maxDepth = layers.reduce((max, layer) => Math.max(max, layer.depth), 0);
  layers.forEach((layer, index) => {
    uniforms.uLayerOffsets.value[index].set(
      -state.pointer.x * bg.parallax * layer.depth,
      state.pointer.y * bg.parallax * layer.depth * imageAspect
    );
  });

  // 画面中心：横屏居中，竖屏偏向人物；再限制在图片范围内，避免露出边缘
  const marginX = bg.parallax * maxDepth;
  const marginY = bg.parallax * maxDepth * imageAspect;
  const halfX = scaleVec.x / (2 * zoom) + marginX;
  const halfY = scaleVec.y / (2 * zoom) + marginY;
  const focusX = screenAspect < 1 ? bg.portraitFocusX : 0.5;
  uniforms.uCenter.value.set(
    THREE.MathUtils.clamp(focusX, Math.min(halfX, 0.5), Math.max(1 - halfX, 0.5)),
    THREE.MathUtils.clamp(0.5, Math.min(halfY, 0.5), Math.max(1 - halfY, 0.5))
  );

  uniforms.uViewport.value.set(state.width, state.height);
  uniforms.uDpr.value = state.dpr;
  uniforms.uTime.value = state.time;
  uniforms.uScroll.value = state.scroll;
  uniforms.uPointerPx.value.set(state.pointerPx.x, state.pointerPx.y);

  const foregroundIndex = Math.max(0, layers.findIndex((layer) => layer.isForeground));
  const groundIndex = layers.length > 1 ? Math.min(1, layers.length - 1) : 0;
  uniforms.uForegroundOffset.value.copy(uniforms.uLayerOffsets.value[foregroundIndex]);
  uniforms.uGroundOffset.value.copy(uniforms.uLayerOffsets.value[groundIndex]);
}
