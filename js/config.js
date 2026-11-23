// config.js — 全站视觉效果的集中配置。改这里即可调整效果，不需要动其他代码。
//
// 坐标约定：凡是「图片坐标」都用 0~1 的比例表示，原点在图片左上角，
// 例如 [0.5, 0.25] 表示图片宽度一半、高度四分之一处。这样换成更高分辨率的素材时不用改数字。

export const CONFIG = {
  // ---------------------------------------------------------------------------
  // 背景图层（从远到近）。
  // 素材到位前只放 full.jpg 一张；拆层素材到了以后改成：
  //   { src: "assets/bg/layer-far.png",  depth: 0.25 },
  //   { src: "assets/bg/layer-mid.png",  depth: 0.55 },
  //   { src: "assets/bg/layer-near.png", depth: 1.0, isForeground: true },
  // depth 越大，鼠标移动时位移越明显（最多 3 层）。
  // isForeground 标记人物 + 伞所在的层：地面倒影波动不会作用到这一层，伞沿滴水跟随这一层移动。
  // ---------------------------------------------------------------------------
  layers: [
    { src: "assets/bg/layer-far.png",  depth: 0.18 },
    { src: "assets/bg/layer-mid.png",  depth: 0.36 },
    { src: "assets/bg/layer-near.png", depth: 0.58, isForeground: true }
  ],
  // 完整背景图：轻量档（手机 / 低帧率）只加载这一张；不支持 WebGL 时 CSS 也用它（见 css/style.css）
  fullImage: "assets/bg/full.jpg",
  // 可选：霓虹发光遮罩（灰度图，白色 = 会呼吸闪烁的灯光）。为空时根据画面亮度自动估算。
  neonMask: "",

  background: {
    parallax: 0.014,        // 鼠标视差强度（相对屏幕宽度的比例）
    overscan: 1.04,         // 画面预留放大量，避免视差时露出边缘
    scrollZoom: 0.14,       // 滚动到底时镜头额外推近的比例
    scrollBlur: 3.2,        // 滚动到底时背景模糊程度（mipmap 级别）
    scrollDarken: 0.38,     // 滚动到底时背景压暗比例，保证文字可读
    // 竖屏时画面中心（图片坐标 x），让人物留在画面内
    portraitFocusX: 0.36,
    neonStrength: 0.42,     // 霓虹呼吸光强度
    neonRegion: [0.0, 0.0, 1.0, 0.60],     // 自动估算霓虹时的区域 [x0, y0, x1, y1]
    reflectionRegion: [0.0, 0.67, 1.0, 1.0], // 湿地面倒影波动区域（避开中景人群上半身）
    reflectionStrength: 0.0018
  },

  // 空中雨丝：移植自 personal/js/rain.js，参数含义相同（width 为 CSS 像素）
  rain: {
    far:  { count: 900, speed: 520, len: 16, width: 1.2, slant: -0.10, alpha: 0.18 },
    near: { count: 320, speed: 900, len: 34, width: 2.0, slant: -0.13, alpha: 0.32 },
    scrollBoost: 0.6,       // 滚动到底时雨丝数量额外增加的比例
    pointerRepel: 70        // 鼠标附近雨丝被推开的半径（CSS 像素）
  },

  // 伞沿滴水：沿伞边缘的滴落点（图片坐标），跟随前景层移动
  umbrellaDrips: {
    points: [
      [0.015, 0.427], [0.068, 0.405], [0.122, 0.382], [0.176, 0.358],
      [0.229, 0.335], [0.283, 0.312], [0.337, 0.289], [0.391, 0.266],
      [0.444, 0.243], [0.498, 0.219], [0.547, 0.198], [0.596, 0.177], [0.640, 0.158]
    ],
    fallDistance: 0.30,     // 下落距离（图片高度比例）
    alpha: 0.75
  },

  // 地面水花：在湿地面区域随机溅起
  splashes: {
    region: [0.56, 0.66, 1.0, 0.99],
    count: 70,
    alpha: 0.55
  },

  // 点击涟漪
  ripple: {
    maxRipples: 8,
    duration: 1.6,          // 秒
    strength: 0.018
  },

  // 玻璃水滴：raindrop-fx 原版参数（见 personal/水滴参数说明.md）
  drops: {
    spawnInterval: [0.15, 0.6],
    spawnLimit: 220,
    dropletsPerSeconds: 120,
    dropletLifetime: 12,
    mist: true,
    mistColor: [0.06, 0.07, 0.10], // 雾气在模糊背景上的提亮颜色
    mistOpacity: 0.32,
    mistTime: 9,
    mistBlurStep: 3,
    slant: -0.115,
    slantJitter: 0.025,
    wipeRadius: 70,         // 鼠标擦雾半径（CSS 像素）
    pushRadius: 60          // 鼠标推开大水滴的半径（CSS 像素）
  },

  // 雨声环境音：与右下角「雨效」开关绑定
  audio: {
    src: "rain.mp3",
    volume: 0.25,           // 柔和的背景音量（0~1）
    fadeMs: 650,            // 开关时的淡入淡出时长（毫秒）
    loopTrimStart: 1.4,     // 循环时跳过曲首的低音量段（秒）
    loopTrimEnd: 1.5,       // 循环时跳过曲尾的低音量段（秒）
    loopCrossfade: 1        // 曲尾与曲首的重叠时长（秒）
  },

  // 性能分级
  perf: {
    maxDPR: 2,
    liteMaxDPR: 1.5,
    degradeFPS: 45,         // 持续低于此帧率时自动降级
    liteRainScale: 0.5      // 降级后雨丝数量比例
  }
};
