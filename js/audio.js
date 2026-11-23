function prepareLoop(buffer, config) {
  const frames = (seconds = 0) => Math.round(Math.max(0, seconds) * buffer.sampleRate);
  const start = frames(config.loopTrimStart);
  const end = buffer.length - frames(config.loopTrimEnd);
  if (end <= start) return { start: 0, end: buffer.duration };

  const overlap = Math.min(frames(config.loopCrossfade), Math.floor((end - start) / 2));
  // 在曲尾混入曲首，循环回跳时从已经混入的部分之后继续，避免重复播放。
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < overlap; i++) {
      const angle = ((i + 1) / (overlap + 1)) * Math.PI / 2;
      const tail = end - overlap + i;
      samples[tail] = samples[tail] * Math.cos(angle) + samples[start + i] * Math.sin(angle);
    }
  }
  return { start: (start + overlap) / buffer.sampleRate, end: end / buffer.sampleRate };
}

export function createRainAudio(config) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!config?.src || !AudioContext) return { setEnabled() {} };

  const volume = Math.max(0, Math.min(1, config.volume ?? 0.16));
  const fadeSeconds = Math.max(0, config.fadeMs ?? 600) / 1000;
  let wanted = false;
  let context;
  let gain;
  let source;
  let loadPromise;
  let hasRun = false;
  let pauseTimer;

  function fadeTo(target) {
    const now = context.currentTime;
    const current = gain.gain.value;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(current, now);
    gain.gain.linearRampToValueAtTime(target, now + fadeSeconds);
  }

  function resume() {
    if (wanted && context.state !== "running") {
      context.resume().catch(() => {
        // 系统中断或浏览器拦截后，等页面恢复或下一次用户操作再试。
      });
    }
  }

  function syncGestureListeners() {
    // click 同时覆盖鼠标、触屏和辅助技术，keydown 支持直接按键启动。
    const waiting = wanted && context.state !== "running";
    for (const event of ["click", "keydown"]) {
      if (waiting) window.addEventListener(event, resume);
      else window.removeEventListener(event, resume);
    }
  }

  function recoverOnReturn() {
    if (!document.hidden && hasRun) resume();
  }

  async function load() {
    const response = await fetch(config.src);
    if (!response.ok) throw new Error(`音频请求失败 (${response.status})`);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    const loop = prepareLoop(buffer, config);
    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = loop.start;
    source.loopEnd = loop.end;
    source.connect(gain);
    source.start();
    if (wanted) fadeTo(volume);
  }

  function setEnabled(enabled) {
    wanted = enabled;
    clearTimeout(pauseTimer);
    if (!context) {
      if (!wanted) return;
      context = new AudioContext();
      gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);
      hasRun = context.state === "running";
      context.addEventListener("statechange", () => {
        if (context.state === "running") hasRun = true;
        syncGestureListeners();
      });
      document.addEventListener("visibilitychange", recoverOnReturn);
      window.addEventListener("pageshow", recoverOnReturn);
    }

    syncGestureListeners();
    if (wanted) {
      if (hasRun || navigator.userActivation?.isActive) resume();
      if (source) fadeTo(volume);
      else loadPromise ??= load().catch((error) => {
        loadPromise = null;
        console.warn("背景音频加载失败", error);
      });
    } else {
      fadeTo(0);
      pauseTimer = setTimeout(() => {
        if (!wanted) context.suspend().catch(() => {});
      }, fadeSeconds * 1000);
    }
  }

  return { setEnabled };
}
