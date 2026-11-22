# 雨夜 · 个人主页（rain-home）

以一张雨夜街头插画为背景的个人主页。Three.js 负责背景视差、霓虹呼吸光、湿地面倒影、空中雨丝、伞沿滴水和地面水花；
`raindrop-fx` 负责屏幕玻璃上的水滴与雾气；页面 UI 采用 iOS 26 / visionOS 风格的 Liquid Glass。

纯静态站点，**不需要构建、不需要 npm 安装**。Three.js（r180）与 raindrop-fx 都已放在 `vendor/` 中，运行时不依赖 CDN。

## 本地预览

ES modules 必须通过 HTTP 访问，不能直接双击 `index.html`：

```powershell
node tools/serve.mjs        # 打开 http://127.0.0.1:4173/
```

也可以用任何静态服务器（VS Code Live Server、`npx serve` 等）。

## 部署到 GitHub Pages

1. 把 `rain-home` 目录的内容推送到仓库（根目录或 `docs/` 均可）。`tools/` 只用于本地预览，上传与否都不影响页面。
2. 仓库 **Settings → Pages → Build and deployment**，Source 选 *Deploy from a branch*，选择分支和对应目录。
3. 所有资源都使用相对路径，`https://用户名.github.io/仓库名/` 这样的子路径也能正常加载。

## 替换个人信息

只需要编辑 [`js/data.js`](js/data.js)：名字、头像、简介、作品、技能、经历、联系方式都在这里。
头像放到 `assets/` 下，再把 `PROFILE.avatar` 改成对应路径。作品卡片的封面颜色由 `accent` 两个颜色决定。

## 替换背景素材

| 文件 | 内容 | 要求 |
|---|---|---|
| `assets/bg/full.jpg` | 完整背景 | 建议 2560×1440 及以上，16:9 |
| `assets/bg/layer-far.png` | 远景城市和霓虹 | 与 full 同尺寸，不需要透明 |
| `assets/bg/layer-mid.png` | 中景人群和湿地面 | 透明 PNG，被前景遮挡的区域要补绘 |
| `assets/bg/layer-near.png` | 人物和伞 | 透明 PNG |
| `assets/bg/neon-mask.png`（可选） | 霓虹发光区域 | 灰度图，白色表示会发光 |

拆层素材到位后，修改 [`js/config.js`](js/config.js)：

```js
layers: [
  { src: "assets/bg/layer-far.png",  depth: 0.25 },
  { src: "assets/bg/layer-mid.png",  depth: 0.55 },
  { src: "assets/bg/layer-near.png", depth: 1.0, isForeground: true }
],
neonMask: "assets/bg/neon-mask.png",   // 没有就留空，自动按亮度估算
```

> 如果新素材的构图和当前图片不同，还需要调整 `config.js` 里用图片比例坐标描述的几处位置：
> `umbrellaDrips.points`（伞沿滴落点）、`splashes.region`（水花区域）、
> `background.reflectionRegion`（倒影波动区域）、`background.neonRegion`（自动估算霓虹的区域）。
> 坐标都是 0~1 的比例，原点在图片左上角。

## 效果参数

全部集中在 [`js/config.js`](js/config.js)，每一项都有注释。常用的：

- `rain.far / rain.near`：雨丝数量、速度、长度、粗细、倾斜、透明度（与 `personal/js/config.js` 含义相同）。
- `drops`：玻璃水滴密度、雾气浓度 `mistOpacity`、雾气重新累积时间 `mistTime`、鼠标擦雾半径 `wipeRadius`。
- `background.parallax`：鼠标视差强度；`scrollZoom / scrollBlur / scrollDarken`：滚动时镜头推近、景深模糊、压暗。

## 性能分级

| 条件 | 表现 |
|---|---|
| 桌面端 | 全部效果 |
| 触屏 / 窄屏，或桌面端帧率持续低于 45 | 关闭玻璃水滴与拆层视差，雨丝减半，像素比上限 1.5 |
| 系统开启「减少动态效果」 | 静态背景 + 少量雨丝，没有视差、涟漪、倾斜动画 |
| 浏览器不支持 WebGL2 | 静态背景图 + CSS 雨 |

右下角的「雨效」开关可以手动关闭/开启动态效果，选择会保存在浏览器里。

## 文件结构

```
index.html            页面骨架、import map
css/style.css         Liquid Glass 样式、各分区、响应式
js/config.js          视觉效果参数
js/data.js            个人信息（占位）
js/main.js            启动、性能分级、渲染循环、特效开关
js/scene/view.js      图片 ↔ 屏幕映射（cover 铺满、视差、推近），各特效共享
js/scene/background.js 背景合成、霓虹、倒影、景深、点击涟漪
js/scene/rain.js      空中雨丝（移植自 personal/js/rain.js）
js/scene/splash.js    伞沿滴水、地面水花
js/scene/drops.js     玻璃水滴与雾气、鼠标擦雾（改写自 personal/js/drops.js）
js/ui/*.js            光标、玻璃卡片反馈、导航胶囊、分区渲染与弹层
vendor/               three.js r180、raindrop-fx（含许可证）
tools/serve.mjs       本地预览服务（部署不需要）
```

## 第三方许可

- [three.js](https://github.com/mrdoob/three.js)：MIT，见 `vendor/THREE-LICENSE.txt`
- [raindrop-fx](https://github.com/SardineFish/raindrop-fx)：MIT，见 `vendor/raindrop-fx.LICENSE`。
  使用的是 `personal/js/vendor` 中打过补丁的版本（补丁说明见 `personal/js/vendor/README.md`）。
