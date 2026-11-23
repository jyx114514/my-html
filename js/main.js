// main.js — 启动入口：能力检测与性能分级、Three.js 场景、玻璃水滴、交互状态、渲染循环、特效开关。

import * as THREE from "three";
import { CONFIG } from "./config.js";
import { createRainAudio } from "./audio.js";
import { createViewUniforms, updateView } from "./scene/view.js";
import { createBackground } from "./scene/background.js";
import { createRain } from "./scene/rain.js";
import { createWaterDetails } from "./scene/splash.js";
import { createGlassDrops } from "./scene/drops.js";
import { initSections, showToast } from "./ui/sections.js";
import { initNav } from "./ui/nav.js";
import { initCursor } from "./ui/cursor.js";
import { initGlass } from "./ui/glass.js";

const FX_STORAGE_KEY = "rain-home:fx-enabled";

// ---------------------------------------------------------------------------
// 能力检测与性能分级
//   full    桌面端：全部效果
//   lite    触屏 / 小屏 / 运行中帧率过低：关闭玻璃水滴与拆层视差，雨丝减半
//   reduced 系统开启「减少动态效果」：静态背景 + 少量雨丝，无视差、无涟漪
//   static  不支持 WebGL2：静态背景图 + CSS 雨
// ---------------------------------------------------------------------------
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600 || window.innerWidth < 820;

function supportsWebGL2() {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

function chooseTier() {
  if (!supportsWebGL2()) return "static";
  if (reducedMotion) return "reduced";
  if (!finePointer || smallScreen) return "lite";
  return "full";
}

const TIER_LABELS = { full: "全效", lite: "轻量", reduced: "简洁", static: "静态" };

// ---------------------------------------------------------------------------
// 页面内容与 UI（不依赖 WebGL，先渲染，保证任何情况下页面都能用）
// ---------------------------------------------------------------------------
initSections({ reducedMotion });
initNav();
initGlass({ enableTilt: finePointer && !reducedMotion });
if (finePointer && !reducedMotion) initCursor();

let tier = chooseTier();
let effectsEnabled = true;
try {
  effectsEnabled = localStorage.getItem(FX_STORAGE_KEY) !== "false";
} catch {
  // 浏览器禁用存储时，雨效开关仍可在本次访问中使用。
}

const fxToggle = document.querySelector("[data-fx-toggle]");
const fxState = document.querySelector("[data-fx-state]");

const rainAudio = createRainAudio(CONFIG.audio);

function renderToggle() {
  fxToggle.setAttribute("aria-pressed", String(effectsEnabled));
  fxState.textContent = effectsEnabled ? TIER_LABELS[tier] : "已关闭";
  document.body.classList.toggle("fx-off", !effectsEnabled);
}

function markReady() {
  document.body.classList.remove("is-loading");
  // 等一帧再加 is-ready，让首屏文字的过渡从初始状态开始
  requestAnimationFrame(() => document.body.classList.add("is-ready"));
}

fxToggle.addEventListener("click", () => {
  effectsEnabled = !effectsEnabled;
  try {
    localStorage.setItem(FX_STORAGE_KEY, String(effectsEnabled));
  } catch {
    // 存储被禁用时仍更新当前页面。
  }
  renderToggle();
  rainAudio.setEnabled(effectsEnabled);
});

function showStaticScene() {
  tier = "static";
  document.body.classList.add("no-webgl");
  renderToggle();
  markReady();
}

renderToggle();
rainAudio.setEnabled(effectsEnabled);
if (tier === "static") {
  showStaticScene();
} else {
  startScene().catch((error) => {
    console.error("场景初始化失败，切换为静态背景", error);
    showStaticScene();
  });
}

// ---------------------------------------------------------------------------
// Three.js 场景
// ---------------------------------------------------------------------------
async function startScene() {
  const sceneCanvas = document.getElementById("scene");
  const glassCanvas = document.getElementById("glass");

  const renderer = new THREE.WebGLRenderer({
    canvas: sceneCanvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance"
  });
  // 着色器里直接输出 sRGB 数值（纹理也不做解码），保持与原图一致的颜色
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x1a2236, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const viewUniforms = createViewUniforms();

  // 轻量档只用整图，不加载拆层素材
  const fullImageLayer = { src: CONFIG.fullImage, depth: 0.45, isForeground: true };
  const layers = tier === "full" ? CONFIG.layers : [fullImageLayer];

  const background = await createBackground(viewUniforms, layers, CONFIG);
  scene.add(background.mesh);

  const rain = createRain(viewUniforms, CONFIG.rain);
  scene.add(rain.group);
  const water = createWaterDetails(viewUniforms, CONFIG);
  scene.add(water.group);

  let drops = null;
  if (tier === "full") {
    drops = createGlassDrops(glassCanvas, sceneCanvas, CONFIG.drops);
    if (!drops) glassCanvas.style.display = "none";
  } else {
    glassCanvas.style.display = "none";
  }

  // ---- 交互状态 ----
  const state = {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: 1,
    imageAspect: background.imageAspect,
    pointer: { x: 0, y: 0 },          // 平滑后的 -1~1
    pointerPx: { x: -9999, y: -9999 },
    scroll: 0,
    time: 0
  };
  const pointerTarget = { x: 0, y: 0 };
  const pointerPx = { x: -9999, y: -9999, movedThisFrame: false };
  let scrollTarget = 0;

  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = max > 0 ? Math.min(1, window.scrollY / max) : 0;
  }

  function resize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    const maxDpr = tier === "full" ? CONFIG.perf.maxDPR : CONFIG.perf.liteMaxDPR;
    state.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(state.dpr);
    renderer.setSize(state.width, state.height, false);
    if (drops) drops.resize(state.width, state.height);
    readScroll();
  }

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointerPx.x = event.clientX;
    pointerPx.y = event.clientY;
    pointerPx.movedThisFrame = true;
    if (event.pointerType === "mouse") {
      pointerTarget.x = (event.clientX / state.width) * 2 - 1;
      pointerTarget.y = (event.clientY / state.height) * 2 - 1;
    }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => {
    pointerTarget.x = 0;
    pointerTarget.y = 0;
    pointerPx.x = -9999;
    pointerPx.y = -9999;
  });
  window.addEventListener("pointerdown", (event) => {
    if (!effectsEnabled || tier === "reduced") return;
    // 弹层打开时不在背景上产生涟漪
    if (!document.querySelector("[data-modal]").hidden) return;
    background.addRipple(event.clientX, event.clientY, 1);
    if (drops) drops.splashAt(event.clientX, event.clientY);
  });

  // 触屏设备用陀螺仪做轻微视差（无需权限的浏览器才启用）
  if (!finePointer && !reducedMotion && "DeviceOrientationEvent" in window
      && typeof DeviceOrientationEvent.requestPermission !== "function") {
    window.addEventListener("deviceorientation", (event) => {
      if (event.gamma == null || event.beta == null) return;
      pointerTarget.x = Math.max(-1, Math.min(1, event.gamma / 30));
      pointerTarget.y = Math.max(-1, Math.min(1, (event.beta - 45) / 30));
    });
  }

  fxToggle.addEventListener("click", () => {
    if (!effectsEnabled) drops?.clear();
  });

  // ---- 运行中降级：桌面端帧率持续偏低时切换到轻量档 ----
  const fpsMonitor = { frames: 0, elapsed: 0, warmup: 3, lowWindows: 0 };
  function monitorFps(delta) {
    if (tier !== "full" || !effectsEnabled) return;
    if (fpsMonitor.warmup > 0) {
      fpsMonitor.warmup -= delta;
      return;
    }
    fpsMonitor.frames += 1;
    fpsMonitor.elapsed += delta;
    if (fpsMonitor.elapsed < 2) return;
    const fps = fpsMonitor.frames / fpsMonitor.elapsed;
    fpsMonitor.frames = 0;
    fpsMonitor.elapsed = 0;
    fpsMonitor.lowWindows = fps < CONFIG.perf.degradeFPS ? fpsMonitor.lowWindows + 1 : 0;
    if (fpsMonitor.lowWindows >= 2) {
      tier = "lite";
      if (drops) drops.destroy();
      drops = null;
      resize();
      renderToggle();
      showToast("已切换为轻量特效，保持流畅");
    }
  }

  // ---- 渲染循环 ----
  const clock = new THREE.Clock();
  let animatedTime = 0;   // 关闭特效或「减少动态效果」时背景时间暂停

  function rainScale() {
    if (tier === "reduced") return 0.3;
    if (tier === "lite") return CONFIG.perf.liteRainScale;
    return 1;
  }

  function frame() {
    const delta = Math.min(clock.getDelta(), 0.1);
    const animate = effectsEnabled && tier !== "reduced";
    if (animate) animatedTime += delta;
    monitorFps(delta);

    // 平滑插值：鼠标视差与滚动都带一点惯性
    const follow = 1 - Math.pow(0.001, delta);       // 约 0.1 秒追上一半
    const scrollFollow = 1 - Math.pow(0.0005, delta);
    const parallaxOn = tier !== "reduced";
    state.pointer.x += ((parallaxOn ? pointerTarget.x : 0) - state.pointer.x) * follow * 0.35;
    state.pointer.y += ((parallaxOn ? pointerTarget.y : 0) - state.pointer.y) * follow * 0.35;
    state.scroll += (scrollTarget - state.scroll) * scrollFollow;
    state.pointerPx.x = pointerPx.x;
    state.pointerPx.y = pointerPx.y;
    state.time = animatedTime;

    updateView(viewUniforms, state, layers, CONFIG);
    rain.group.visible = effectsEnabled;
    water.group.visible = effectsEnabled && tier !== "reduced";
    rain.update(rainScale(), state.scroll);

    renderer.render(scene, camera);

    // 玻璃水滴必须紧跟 Three.js 渲染，在同一帧里读取它的画面作为折射源
    if (drops && effectsEnabled) {
      drops.render(clock.elapsedTime, {
        active: pointerPx.movedThisFrame && pointerPx.x > -9999,
        x: pointerPx.x,
        y: pointerPx.y
      });
    }
    pointerPx.movedThisFrame = false;
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
  markReady();
}
