// nav.js — 顶部导航胶囊：高亮滑块平滑移动到当前分区对应的链接。

export function initNav() {
  const links = Array.from(document.querySelectorAll(".nav__links a"));
  const slider = document.querySelector(".nav__slider");
  const container = document.querySelector(".nav__links");
  const sections = links.map((link) => document.querySelector(link.getAttribute("href")));
  let activeIndex = 0;

  function moveSlider() {
    const link = links[activeIndex];
    // 用 offsetLeft/offsetWidth（不受磁吸 translate 影响）
    slider.style.width = `${link.offsetWidth}px`;
    slider.style.transform = `translateX(${link.offsetLeft}px)`;
    links.forEach((item, index) => item.classList.toggle("is-active", index === activeIndex));
    // 窄屏时导航可横向滚动，保证当前项可见
    if (container.scrollWidth > container.clientWidth) {
      container.scrollTo({ left: link.offsetLeft - (container.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
    }
  }

  // 以视口 40% 高度处的那条线为准：哪个分区跨过这条线，哪个就是当前分区
  function updateActive() {
    const probe = window.innerHeight * 0.4;
    let index = 0;
    sections.forEach((section, sectionIndex) => {
      if (section && section.getBoundingClientRect().top <= probe) index = sectionIndex;
    });
    if (index !== activeIndex) {
      activeIndex = index;
      moveSlider();
    }
  }

  window.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", moveSlider);
  // 字体加载后宽度可能变化
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveSlider);
  updateActive();
  moveSlider();
}
