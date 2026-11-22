// cursor.js — iPadOS 风格指针：小圆点 + 跟随的玻璃光圈。
// 悬停在按钮、链接等小元素上时，光圈吸附并变成元素的形状，元素本身也轻微被「吸」向指针。
// 点击时光圈收缩，并在点击处放出一圈光环。

const SNAP_PADDING = 4;          // 吸附时光圈比元素大出的距离（px）
const SNAP_MAX_SIZE = 320;       // 超过这个尺寸的元素（例如作品卡片）不吸附，只放大光圈
const MAGNET_STRENGTH = 0.06;    // 元素被吸向指针的比例（轻微反馈，避免过度拉扯）
const MAGNET_LIMIT = 3;          // 元素最大位移（px）
const RING_FOLLOW = 0.24;        // 光圈跟随速度（每帧插值比例）
const RING_SIZE = 38;
const RING_HOVER_SIZE = 64;

export function initCursor() {
  const root = document.querySelector(".cursor");
  const ring = root.querySelector(".cursor__ring");
  const dot = root.querySelector(".cursor__dot");
  document.body.classList.add("has-cursor");

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringState = { x: pointer.x, y: pointer.y, width: RING_SIZE, height: RING_SIZE };
  let snapTarget = null;
  let hoverLarge = false;
  let visible = false;

  function clearMagnet(element) {
    element.style.setProperty("--magnet-x", "0px");
    element.style.setProperty("--magnet-y", "0px");
  }

  function setSnapTarget(element) {
    if (snapTarget === element) return;
    if (snapTarget) clearMagnet(snapTarget);
    snapTarget = element;
    root.classList.toggle("is-snapped", Boolean(element));
  }

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!visible) {
      visible = true;
      ringState.x = pointer.x;
      ringState.y = pointer.y;
      root.classList.remove("is-hidden");
    }

    const interactive = event.target.closest("[data-magnetic], a, button");
    if (interactive) {
      const rect = interactive.getBoundingClientRect();
      const isSmall = rect.width <= SNAP_MAX_SIZE && rect.height <= SNAP_MAX_SIZE;
      setSnapTarget(isSmall ? interactive : null);
      hoverLarge = !isSmall;
    } else {
      setSnapTarget(null);
      hoverLarge = false;
    }
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", () => {
    visible = false;
    root.classList.add("is-hidden");
    setSnapTarget(null);
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") return;
    root.classList.add("is-pressed");
    const pulse = document.createElement("span");
    pulse.className = "click-pulse";
    pulse.style.left = `${event.clientX}px`;
    pulse.style.top = `${event.clientY}px`;
    document.body.appendChild(pulse);
    pulse.addEventListener("animationend", () => pulse.remove());
  });
  document.addEventListener("pointerup", () => root.classList.remove("is-pressed"));

  function frame() {
    let targetX = pointer.x;
    let targetY = pointer.y;
    let targetWidth = hoverLarge ? RING_HOVER_SIZE : RING_SIZE;
    let targetHeight = targetWidth;
    let radius = "999px";

    if (snapTarget && snapTarget.isConnected) {
      // 元素当前带着磁吸位移，先减掉它，得到元素原本的位置
      const rect = snapTarget.getBoundingClientRect();
      const magnetX = parseFloat(snapTarget.style.getPropertyValue("--magnet-x")) || 0;
      const magnetY = parseFloat(snapTarget.style.getPropertyValue("--magnet-y")) || 0;
      const centerX = rect.left + rect.width / 2 - magnetX;
      const centerY = rect.top + rect.height / 2 - magnetY;
      const pullX = Math.max(-MAGNET_LIMIT, Math.min(MAGNET_LIMIT, (pointer.x - centerX) * MAGNET_STRENGTH));
      const pullY = Math.max(-MAGNET_LIMIT, Math.min(MAGNET_LIMIT, (pointer.y - centerY) * MAGNET_STRENGTH));
      snapTarget.style.setProperty("--magnet-x", `${pullX.toFixed(2)}px`);
      snapTarget.style.setProperty("--magnet-y", `${pullY.toFixed(2)}px`);

      targetX = centerX + pullX;
      targetY = centerY + pullY;
      targetWidth = rect.width + SNAP_PADDING * 2;
      targetHeight = rect.height + SNAP_PADDING * 2;
      const elementRadius = parseFloat(getComputedStyle(snapTarget).borderTopLeftRadius) || 12;
      radius = `${Math.min(elementRadius + SNAP_PADDING, targetHeight / 2)}px`;
    }

    ringState.x += (targetX - ringState.x) * RING_FOLLOW;
    ringState.y += (targetY - ringState.y) * RING_FOLLOW;
    // 宽高也在这里插值（而不是交给 CSS 过渡），保证变形过程中光圈始终居中
    ringState.width += (targetWidth - ringState.width) * RING_FOLLOW;
    ringState.height += (targetHeight - ringState.height) * RING_FOLLOW;
    ring.style.width = `${ringState.width}px`;
    ring.style.height = `${ringState.height}px`;
    ring.style.borderRadius = radius;
    ring.style.transform = `translate3d(${ringState.x - ringState.width / 2}px, ${ringState.y - ringState.height / 2}px, 0)`;
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    requestAnimationFrame(frame);
  }
  root.classList.add("is-hidden");
  requestAnimationFrame(frame);
}
