// sections.js — 把 data.js 渲染成页面分区，并处理滚动渐显、作品详情弹层、复制邮箱提示。

import { PROFILE, ABOUT, PROJECTS, EXPERIENCE, CONTACTS } from "../data.js";

const ICONS = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
  discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.3 18.3 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.89 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.08.08 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.08.08 0 0 1 .08.01c.12.1.25.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6-3.03.08.08 0 0 0 .03-.06c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.2h1.7L7.4 4.7H5.58l11.1 14.5Z"/></svg>',
  bilibili: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3.5"/><path d="m8 3 3 3M16 3l-3 3M9 12v1.5M15 12v1.5"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>'
};

// data.js 里的文字可能包含 < & 等字符，插入 HTML 前先转义
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHero() {
  const container = document.querySelector("[data-hero]");
  const nameChars = Array.from(PROFILE.name)
    .map((char, index) => `<span class="hero__name-char" style="--c:${index}">${escapeHtml(char)}</span>`)
    .join("");
  container.innerHTML = `
    <h1 class="hero__name" style="--i:0" aria-label="${escapeHtml(PROFILE.name)}">${nameChars}</h1>
    <p class="hero__name-en" style="--i:1">${escapeHtml(PROFILE.nameEn)}</p>
    <p class="hero__tagline" style="--i:2">${escapeHtml(PROFILE.tagline)}</p>
    <p class="hero__role" style="--i:3">${escapeHtml(PROFILE.role)}</p>
    <div class="hero__actions" style="--i:4">
      <a class="button button--primary" href="#projects" data-magnetic>查看作品 ${ICONS.arrow}</a>
      <a class="button button--glass glass" href="#contact" data-magnetic>联系我</a>
    </div>`;
  document.title = `天繁的个人web`;
}

function renderAbout() {
  const container = document.querySelector("[data-about]");
  const paragraphs = ABOUT.paragraphs.map((item) => {
    const text = typeof item === "string" ? item : item.text;
    const indent = typeof item === "object" && item ? item.indent : false;
    if (indent === true) return `<p class="is-indent">${escapeHtml(text)}</p>`;
    if (typeof indent === "number" && indent > 0) {
      return `<p style="text-indent:${indent}em">${escapeHtml(text)}</p>`;
    }
    if (typeof indent === "string" && indent) {
      return `<p style="text-indent:${escapeHtml(indent)}">${escapeHtml(text)}</p>`;
    }
    return `<p>${escapeHtml(text)}</p>`;
  }).join("");
  const facts = ABOUT.facts.map((fact, index) => `
    <div class="fact glass tilt" data-reveal style="--delay:${0.08 * (index + 1)}s">
      <span class="fact__label">${escapeHtml(fact.label)}</span>
      <span class="fact__value">${escapeHtml(fact.value)}</span>
    </div>`).join("");
  container.innerHTML = `
    <div class="about__text glass" data-reveal>${paragraphs}</div>
    <div class="about__facts">${facts}</div>`;
}

function coverStyle(project) {
  const accent = project.accent || ["#ff7eb3", "#7a8cff"];
  return `--c1:${accent[0]};--c2:${accent[1]}`;
}

function renderCover(project, extraClass = "") {
  const hasImage = Boolean(project.image);
  const imageTag = hasImage
    ? `<img class="project__img" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" loading="lazy">`
    : "";
  return `
    <span class="project__cover ${extraClass} ${hasImage ? "has-image" : ""}" style="${coverStyle(project)}">
      ${imageTag}
    </span>`;
}

function renderProjects() {
  const container = document.querySelector("[data-projects]");
  container.innerHTML = PROJECTS.map((project, index) => `
    <button class="project glass tilt" type="button" data-project="${index}" data-reveal style="--delay:${0.06 * (index % 3)}s">
      ${renderCover(project)}
      <span class="project__body">
        <span class="project__meta"><span>${escapeHtml(project.subtitle)}</span><span>${escapeHtml(project.year)}</span></span>
        <span class="project__title">${escapeHtml(project.title)}</span>
        <span class="project__summary">${escapeHtml(project.summary)}</span>
        <span class="tags">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</span>
      </span>
    </button>`).join("");
}

function renderTimeline() {
  const container = document.querySelector("[data-timeline]");
  container.innerHTML = EXPERIENCE.map((item, index) => `
    <li class="timeline__item" data-reveal style="--delay:${0.08 * index}s">
      <span class="timeline__dot" aria-hidden="true"></span>
      <div class="timeline__card glass tilt">
        <div class="timeline__period">${escapeHtml(item.period)}</div>
        <h3 class="timeline__title">${escapeHtml(item.title)}</h3>
        <div class="timeline__org">${escapeHtml(item.org)}</div>
        <p class="timeline__desc">${escapeHtml(item.desc)}</p>
      </div>
    </li>`).join("");
}

function renderContact() {
  const container = document.querySelector("[data-contact]");
  const links = CONTACTS.map((contact) => {
    const icon = ICONS[contact.icon] || ICONS.link;
    if (contact.copy) {
      return `<button class="button button--glass glass" type="button" data-copy="${escapeHtml(contact.copy)}" data-magnetic>${icon} <span>${escapeHtml(contact.label)}</span></button>`;
    }
    return `<a class="button button--glass glass" href="${escapeHtml(contact.href)}" target="_blank" rel="noopener" data-magnetic>${icon} ${escapeHtml(contact.label)}</a>`;
  }).join("");
  const notes = CONTACTS.filter((contact) => contact.note)
    .map((contact) => `<p class="contact__note">${escapeHtml(contact.note)}</p>`)
    .join("");
  container.innerHTML = `
    <h2 class="contact__title">聊聊过去，现在，和未来？</h2>
    <p class="contact__text">无论是合作、交流还是单纯打个招呼，都欢迎来信。</p>
    <div class="contact__actions">
      <button class="button button--primary" type="button" data-copy="${escapeHtml(PROFILE.email)}" data-magnetic>${ICONS.copy} <span>复制邮箱</span></button>
      ${links}
    </div>
    ${notes}`;
  document.querySelector("[data-footer]").textContent =
    `© ${new Date().getFullYear()} ${PROFILE.name} · Made with rain & Three.js`;
}

// ---------------------------------------------------------------------------
// 提示条
// ---------------------------------------------------------------------------
let toastTimer = 0;
export function showToast(message) {
  const toast = document.querySelector("[data-toast]");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("copy failed");
}

function initCopyEmail() {
  const timers = new WeakMap();
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const text = button.dataset.copy;
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    try {
      await copyText(text);
      button.classList.add("is-copied");
      button.innerHTML = `${ICONS.check} <span>已复制</span>`;
      showToast(`已复制：${text}`);
      clearTimeout(timers.get(button));
      timers.set(button, setTimeout(() => {
        button.classList.remove("is-copied");
        button.innerHTML = button.dataset.originalHtml;
      }, 2000));
    } catch {
      showToast(text);
    }
  });
}

// ---------------------------------------------------------------------------
// 滚动渐显：进入视口后播放一次；播放完移除 data-reveal，交还给 .tilt 控制 transform
// ---------------------------------------------------------------------------
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      element.classList.add("is-visible");
      observer.unobserve(element);
      const delay = parseFloat(element.style.getPropertyValue("--delay")) || 0;
      setTimeout(() => element.removeAttribute("data-reveal"), (delay + 1.2) * 1000);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
}

// ---------------------------------------------------------------------------
// 作品详情弹层：卡片放大成详情（FLIP 动画），关闭时缩回原卡片
// ---------------------------------------------------------------------------
function initModal({ reducedMotion }) {
  const modal = document.querySelector("[data-modal]");
  const card = document.querySelector("[data-modal-card]");
  let sourceCard = null;
  let lastFocus = null;
  const easing = "cubic-bezier(0.2, 0.9, 0.25, 1.05)";

  // 从卡片位置到弹层位置的反向变换（FLIP 中的 Invert）
  function invertTransform(from, to) {
    const scaleX = from.width / to.width;
    const scaleY = from.height / to.height;
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${scaleX}, ${scaleY})`;
  }

  function open(index, trigger) {
    const project = PROJECTS[index];
    sourceCard = trigger;
    lastFocus = document.activeElement;
    const gallery = Array.isArray(project.images) && project.images.length
      ? `<div class="modal__gallery">${project.images.map((src) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(project.title)}" loading="lazy">`).join("")}</div>`
      : "";
    card.innerHTML = `
      <button class="modal__close" type="button" data-modal-close data-magnetic aria-label="关闭">${ICONS.close}</button>
      ${renderCover(project, "modal__cover")}
      <div class="modal__body modal__content-fade">
        <div class="project__meta"><span>${escapeHtml(project.subtitle)}</span><span>${escapeHtml(project.year)}</span></div>
        <h3 class="modal__title" id="modal-title">${escapeHtml(project.title)}</h3>
        <p class="modal__detail">${escapeHtml(project.detail)}</p>
        ${gallery}
        <div class="tags" style="margin-bottom:24px">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <a class="button button--primary" href="${escapeHtml(project.link)}" target="_blank" rel="noopener" data-magnetic>查看项目 ${ICONS.arrow}</a>
      </div>`;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    // 强制布局后再加 is-open，让背景淡入过渡生效
    card.getBoundingClientRect();
    modal.classList.add("is-open");
    if (!reducedMotion) {
      const from = trigger.getBoundingClientRect();
      const to = card.getBoundingClientRect();
      card.animate(
        [{ transform: invertTransform(from, to), opacity: 0.6 }, { transform: "none", opacity: 1 }],
        { duration: 620, easing }
      );
      trigger.style.visibility = "hidden";
    }
    card.querySelector(".modal__close").focus({ preventScroll: true });
  }

  async function close() {
    if (modal.hidden) return;
    modal.classList.remove("is-open");
    if (!reducedMotion && sourceCard) {
      const from = sourceCard.getBoundingClientRect();
      const to = card.getBoundingClientRect();
      const animation = card.animate(
        [{ transform: "none", opacity: 1 }, { transform: invertTransform(from, to), opacity: 0.4 }],
        { duration: 460, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
      );
      await animation.finished;
      animation.cancel();
    }
    if (sourceCard) sourceCard.style.visibility = "";
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-project]");
    if (trigger) {
      open(Number(trigger.dataset.project), trigger);
      return;
    }
    if (event.target.closest("[data-modal-close]")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });
}

/** 渲染全部分区并启用交互 */
export function initSections({ reducedMotion }) {
  renderHero();
  renderAbout();
  renderProjects();
  renderTimeline();
  renderContact();
  initReveal();
  initModal({ reducedMotion });
  initCopyEmail();
}
