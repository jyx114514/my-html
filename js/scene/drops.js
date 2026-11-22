// drops.js — 屏幕玻璃上的水滴与雾气。
//
// 改写自 personal/js/drops.js，继续使用打过补丁的 SardineFish/raindrop-fx（vendor/raindrop-fx.js，MIT）。
// 与原版的区别：
//   1. 折射源改成 Three.js 渲染出的整幅画面（背景 + 雨丝 + 水花）。
//   2. 新增鼠标擦雾 / 推开水滴：raindrop-fx 本身没有这个功能，这里在它合成画面之前，
//      直接在它自己的 WebGL2 上下文里对「雾气纹理」和「细小水珠纹理」做一次乘法擦除。
//      雾气纹理会按 mistTime 自动重新累积，所以擦过的地方会慢慢重新起雾。
//   3. 鼠标附近和点击处的大水滴会被推开。

const MAX_BRUSHES = 8;

const WIPE_VERTEX = `#version 300 es
void main() {
  // 不需要顶点缓冲的全屏三角形
  vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const WIPE_FRAGMENT = `#version 300 es
precision highp float;
uniform vec4 uBrushes[${MAX_BRUSHES}];   // xy: 纹理像素坐标（y 向上），z: 半径，w: 擦除强度
uniform int uBrushCount;
out vec4 fragColor;
void main() {
  float keep = 1.0;
  for (int i = 0; i < ${MAX_BRUSHES}; i++) {
    if (i >= uBrushCount) break;
    vec4 brush = uBrushes[i];
    float d = distance(gl_FragCoord.xy, brush.xy);
    float k = 1.0 - smoothstep(brush.z * 0.35, brush.z, d);
    keep *= 1.0 - k * brush.w;
  }
  fragColor = vec4(keep);
}`;

function compileProgram(gl) {
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error("擦雾着色器编译失败：" + gl.getShaderInfoLog(shader));
    }
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, WIPE_VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, WIPE_FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("擦雾着色器链接失败：" + gl.getProgramInfoLog(program));
  }
  return program;
}

/**
 * 在 raindrop-fx 的 WebGL2 上下文里擦除指定纹理。
 * 会完整保存并恢复它依赖的 GL 状态，避免影响 raindrop-fx 后续的绘制。
 */
function createWipePass(gl) {
  const program = compileProgram(gl);
  const brushLocation = gl.getUniformLocation(program, "uBrushes");
  const countLocation = gl.getUniformLocation(program, "uBrushCount");
  const framebuffer = gl.createFramebuffer();
  const emptyVertexArray = gl.createVertexArray();
  const brushData = new Float32Array(MAX_BRUSHES * 4);

  // targets: [{ texture, width, height, alphaOnly }]
  function run(targets, brushes) {
    if (!brushes.length) return;
    const count = Math.min(MAX_BRUSHES, brushes.length);
    brushData.fill(0);
    for (let i = 0; i < count; i++) brushData.set(brushes[i], i * 4);

    const saved = {
      framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
      program: gl.getParameter(gl.CURRENT_PROGRAM),
      vertexArray: gl.getParameter(gl.VERTEX_ARRAY_BINDING),
      viewport: gl.getParameter(gl.VIEWPORT),
      blend: gl.isEnabled(gl.BLEND),
      scissor: gl.isEnabled(gl.SCISSOR_TEST),
      depth: gl.isEnabled(gl.DEPTH_TEST),
      cull: gl.isEnabled(gl.CULL_FACE),
      blendSrcRgb: gl.getParameter(gl.BLEND_SRC_RGB),
      blendDstRgb: gl.getParameter(gl.BLEND_DST_RGB),
      blendSrcAlpha: gl.getParameter(gl.BLEND_SRC_ALPHA),
      blendDstAlpha: gl.getParameter(gl.BLEND_DST_ALPHA),
      blendEquationRgb: gl.getParameter(gl.BLEND_EQUATION_RGB),
      blendEquationAlpha: gl.getParameter(gl.BLEND_EQUATION_ALPHA),
      colorMask: gl.getParameter(gl.COLOR_WRITEMASK)
    };

    gl.useProgram(program);
    gl.bindVertexArray(emptyVertexArray);
    gl.uniform4fv(brushLocation, brushData);
    gl.uniform1i(countLocation, count);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    targets.forEach((target) => {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
      gl.viewport(0, 0, target.width, target.height);
      if (target.alphaOnly) {
        // 细小水珠纹理：RGB 是法线，保持不变；只按比例减少覆盖度（alpha）
        gl.blendFuncSeparate(gl.ZERO, gl.ONE, gl.ZERO, gl.SRC_ALPHA);
      } else {
        // 雾气纹理：直接乘以保留比例
        gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.SRC_ALPHA);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, saved.framebuffer);
    gl.useProgram(saved.program);
    gl.bindVertexArray(saved.vertexArray);
    gl.viewport(saved.viewport[0], saved.viewport[1], saved.viewport[2], saved.viewport[3]);
    gl.blendFuncSeparate(saved.blendSrcRgb, saved.blendDstRgb, saved.blendSrcAlpha, saved.blendDstAlpha);
    gl.blendEquationSeparate(saved.blendEquationRgb, saved.blendEquationAlpha);
    gl.colorMask(saved.colorMask[0], saved.colorMask[1], saved.colorMask[2], saved.colorMask[3]);
    if (!saved.blend) gl.disable(gl.BLEND);
    if (saved.scissor) gl.enable(gl.SCISSOR_TEST);
    if (saved.depth) gl.enable(gl.DEPTH_TEST);
    if (saved.cull) gl.enable(gl.CULL_FACE);
  }

  return { run };
}

/**
 * canvas：水滴画布（透明，覆盖在 Three.js 画布上方）
 * sourceCanvas：Three.js 画布，作为折射源
 * 返回 null 表示浏览器不支持（调用方据此跳过水滴效果）。
 */
export function createGlassDrops(canvas, sourceCanvas, cfg) {
  if (typeof window.RaindropFX !== "function") return null;
  const gl = canvas.getContext("webgl2");
  if (!gl) return null;

  // 模拟在 CSS 像素尺度上进行，与 personal 原版一致，水滴大小和速度不随 DPR 变化
  let width = Math.max(2, window.innerWidth);
  let height = Math.max(2, window.innerHeight);
  const sourceCopy = document.createElement("canvas");
  const sourceContext = sourceCopy.getContext("2d");
  canvas.width = sourceCopy.width = width;
  canvas.height = sourceCopy.height = height;

  let ready = false;
  let failed = false;
  let lastTime = null;
  let simulatedTotal = 0;

  const fx = new window.RaindropFX({
    canvas,
    background: sourceCopy,
    backgroundBlurSteps: 0,
    spawnInterval: cfg.spawnInterval,
    spawnLimit: cfg.spawnLimit,
    dropletsPerSeconds: cfg.dropletsPerSeconds,
    dropletLifetime: cfg.dropletLifetime,
    mist: cfg.mist,
    mistColor: [cfg.mistColor[0], cfg.mistColor[1], cfg.mistColor[2], cfg.mistOpacity],
    mistTime: cfg.mistTime,
    mistBlurStep: cfg.mistBlurStep
  });

  // ---- 下滑方向：沿用原版适配，让水滴整体略向左下滑 ----
  function adaptDrop(drop) {
    if (drop.glassSlantAdapted) return drop;
    drop.glassSlantAdapted = true;
    const originalMotion = drop.randomMotion;
    drop.randomMotion = function () {
      originalMotion.call(this);
      this.shifting = cfg.slant + (Math.random() * 2 - 1) * cfg.slantJitter;
    };
    return drop;
  }
  const spawner = fx.simulator.spawner;
  const originalTrySpawn = spawner.trySpawn;
  spawner.trySpawn = function* () {
    for (const drop of originalTrySpawn.call(this)) yield adaptDrop(drop);
  };
  const originalSpawn = spawner.spawn;
  spawner.spawn = function () { return adaptDrop(originalSpawn.apply(this, arguments)); };

  // ---- 鼠标擦雾：在 raindrop-fx 合成最终画面之前插入擦除 ----
  const wipePass = createWipePass(fx.renderer.renderer.gl);
  let pendingBrushes = [];
  const originalDrawBackground = fx.renderer.drawBackground.bind(fx.renderer);
  fx.renderer.drawBackground = function () {
    if (pendingBrushes.length) {
      const renderer = fx.renderer;
      const targets = [
        { texture: renderer.dropletTexture.glTex(), width: renderer.dropletTexture.width, height: renderer.dropletTexture.height, alphaOnly: true }
      ];
      if (renderer.options.mist) {
        targets.push({ texture: renderer.mistTexture.glTex(), width: renderer.mistTexture.width, height: renderer.mistTexture.height, alphaOnly: false });
      }
      wipePass.run(targets, pendingBrushes);
      pendingBrushes = [];
    }
    originalDrawBackground();
  };

  // 鼠标轨迹：上一帧到这一帧之间按间距插入多个笔刷，快速划过也是连续的一道
  let lastPointer = null;
  function addWipeStroke(x, y, radius, strength) {
    const glY = height - y;
    if (lastPointer) {
      const dx = x - lastPointer.x;
      const dy = glY - lastPointer.y;
      const length = Math.hypot(dx, dy);
      const steps = Math.min(MAX_BRUSHES - pendingBrushes.length, Math.max(1, Math.ceil(length / (radius * 0.5))));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        pendingBrushes.push([lastPointer.x + dx * t, lastPointer.y + dy * t, radius, strength]);
      }
    } else {
      pendingBrushes.push([x, glY, radius, strength]);
    }
    lastPointer = { x, y: glY };
    if (pendingBrushes.length > MAX_BRUSHES) pendingBrushes = pendingBrushes.slice(-MAX_BRUSHES);
  }

  // 把半径内的大水滴往外推。raindrop-fx 的坐标 y 向上
  function pushDrops(x, y, radius, force) {
    const simY = height - y;
    for (const drop of fx.simulator.raindrops) {
      if (drop.destroied) continue;
      const dx = drop.pos.x - x;
      const dy = drop.pos.y - simY;
      const distance = Math.hypot(dx, dy);
      const reach = radius + Math.max(drop.size.x, drop.size.y) * 0.5;
      if (distance >= reach || distance < 0.001) continue;
      const amount = (1 - distance / reach) * force;
      drop.pos.x += (dx / distance) * amount;
      drop.pos.y += (dy / distance) * amount;
    }
  }

  // ---- 折射源：把 Three.js 画面缩放到模拟尺寸后上传 ----
  function updateBackground() {
    sourceContext.drawImage(sourceCanvas, 0, 0, width, height);
    const renderer = fx.renderer;
    if (renderer.originalBackground.width !== width || renderer.originalBackground.height !== height) {
      renderer.originalBackground.resize(width, height);
    }
    renderer.originalBackground.setData(sourceCopy);
    renderer.renderer.blit(renderer.originalBackground, renderer.background);
    renderer.background.generateMipmap();
    renderer.blurBackground();
    // 上游 backgroundBlurSteps = 0 时不会写入折射纹理，这里手动提供清晰画面（同 personal 原版）
    renderer.renderer.blit(renderer.background, renderer.blurryBackground);
    if (renderer.options.mist && renderer.options.mistBlurStep === 0) {
      renderer.renderer.blit(renderer.background, renderer.mistBackground);
    }
  }

  const loaded = fx.renderer.loadAssets().then(() => {
    fx.resize(width, height);
    fx.simulator.resize();
    ready = true;
  }).catch((error) => {
    failed = true;
    canvas.style.display = "none";
    console.error("raindrop-fx 初始化失败", error);
  });

  function clear() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function resize(cssWidth, cssHeight) {
    width = Math.max(2, Math.round(cssWidth));
    height = Math.max(2, Math.round(cssHeight));
    sourceCopy.width = width;
    sourceCopy.height = height;
    if (ready) {
      fx.resize(width, height);
      fx.simulator.resize();
    }
  }

  /** 每帧调用，必须紧跟在 Three.js 渲染之后（同一帧内读取它的画面）。 */
  function render(timeSeconds, pointer) {
    const elapsed = lastTime == null ? 0 : Math.max(0, Math.min(0.1, timeSeconds - lastTime));
    lastTime = timeSeconds;
    if (!ready || failed) return;

    if (pointer && pointer.active) {
      addWipeStroke(pointer.x, pointer.y, cfg.wipeRadius, 0.55);
      pushDrops(pointer.x, pointer.y, cfg.pushRadius, 2.5);
    } else {
      lastPointer = null;
    }

    updateBackground();
    // 原演示每个动画帧固定推进 dt = 0.03，保持这个节奏
    if (elapsed > 0) {
      simulatedTotal += 0.03;
      fx.update({ dt: 0.03, total: simulatedTotal, evaporationDt: elapsed });
    } else {
      fx.renderer.render(fx.simulator.raindrops, { dt: 0, total: simulatedTotal });
    }
  }

  /** 点击：擦出一个圆，并把附近水滴向外推开 */
  function splashAt(x, y) {
    if (!ready || failed) return;
    pendingBrushes.push([x, height - y, cfg.wipeRadius * 1.8, 0.9]);
    pushDrops(x, y, cfg.pushRadius * 2.2, 18);
  }

  function destroy() {
    failed = true;
    clear();
    canvas.style.display = "none";
  }

  return { loaded, resize, render, splashAt, clear, destroy };
}
