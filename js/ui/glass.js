// glass.js — 玻璃卡片的鼠标反馈：跟随高光、3D 倾斜、悬停抬起、按压回弹。
// 所有数值写进 CSS 变量，具体样式在 css/style.css 的 .glass / .tilt 里。

const MAX_TILT_DEG = 6;

function updateHighlight(element, event) {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  element.style.setProperty("--mx", `${x}px`);
  element.style.setProperty("--my", `${y}px`);
  return { rect, x, y };
}

/**
 * 给页面上的 .glass 启用跟随高光，给 .tilt 启用倾斜与按压。
 * enableTilt = false（减少动态效果 / 触屏）时只保留高光。
 * 使用事件委托，后续动态插入的卡片也会生效。
 */
export function initGlass({ enableTilt }) {
  let activeTilt = null;

  function resetTilt(element) {
    element.classList.remove("is-tracking", "is-pressed");
    element.style.setProperty("--rx", "0deg");
    element.style.setProperty("--ry", "0deg");
    element.style.setProperty("--lift", "0px");
    element.style.setProperty("--press", "1");
  }

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const glass = event.target.closest(".glass");
    if (glass) updateHighlight(glass, event);

    const tilt = enableTilt ? event.target.closest(".tilt") : null;
    if (activeTilt && activeTilt !== tilt) resetTilt(activeTilt);
    activeTilt = tilt;
    if (!tilt) return;

    const rect = tilt.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    // 大卡片倾斜角度小一些，避免看起来晃得厉害
    const sizeFactor = Math.min(1, 420 / Math.max(rect.width, rect.height));
    tilt.classList.add("is-tracking");
    tilt.style.setProperty("--rx", `${(-relativeY * MAX_TILT_DEG * 2 * sizeFactor).toFixed(2)}deg`);
    tilt.style.setProperty("--ry", `${(relativeX * MAX_TILT_DEG * 2 * sizeFactor).toFixed(2)}deg`);
    tilt.style.setProperty("--lift", "-6px");
  }, { passive: true });

  // 鼠标离开浏览器窗口时复位
  document.documentElement.addEventListener("pointerleave", () => {
    if (activeTilt) resetTilt(activeTilt);
    activeTilt = null;
  });

  if (!enableTilt) return;

  document.addEventListener("pointerdown", (event) => {
    const tilt = event.target.closest(".tilt");
    if (!tilt) return;
    tilt.classList.add("is-pressed");
    tilt.style.setProperty("--press", "0.97");
  });

  function release() {
    document.querySelectorAll(".tilt.is-pressed").forEach((tilt) => {
      tilt.classList.remove("is-pressed");
      tilt.style.setProperty("--press", "1");
    });
  }
  document.addEventListener("pointerup", release);
  document.addEventListener("pointercancel", release);
}
