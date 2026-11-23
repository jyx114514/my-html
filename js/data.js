// data.js — 页面上所有个人信息都在这里。替换成真实内容即可，不需要改其他文件。

export const PROFILE = {
  name: "天繁",
  nameEn: "Tianfan Yunxiang Jiang",
  role: "生物学在读，做的方向很杂，什么都会点",
  tagline: "何处是我们寻找的彼岸？",
  email: "2944007545@qq.com"
};

export const ABOUT = {
  paragraphs: [
    {text: "人们渴望彼岸，却选择先实现通往彼岸的血海",indent:true},
    {text: "中国农业大学在读，生物学和数据科学双修，预计2027年6月毕业，研究生就读于华西生物治疗全国重点实验室。",indent:true},
    {text: "目前在清华大学做毕业设计，最近已经忙的起飞",indent:true},
    {text: "其他的想到再写吧",indent:true}
  ],
  facts: [
    { label: "方向", value: "生物学什么都做，计算机主要是深度学习" },
    { label: "状态", value: "本科在读，欢迎学术讨论，可以通过下面的联系方式联系我" },
    { label: "爱好", value: "折腾软件，尝试新想法，偶尔去吃点好吃的" }
  ]
};

// accent 是没有封面图时的渐变主色；想用图片时加上 image（封面图）和可选的 images（详情配图数组）
export const PROJECTS = [
  {
    title: "Token Paid ",
    subtitle: "OPEN PROJECT",
    year: "2026",
    tags: ["python包"],
    image: "assets/project/1.png",              // 卡片和弹层顶部的封面图
    //images: ["assets/projects/detail1.png"],           可选：点开弹层后在介绍下方展示的配图
    accent: ["#ff7eb3", "#7a8cff"],               // 不填 image 时自动退回这个渐变封面
    summary: "读取codex，workbuddy本地文件，计算详细的token消耗，模型调用",
    detail: "支持详细的输入输出统计，每个session及之下的Threads，同会话下每次已识别模型的调用都可以单独统计",
    link: "https://github.com/jyx114514/token-paid"
  },
  {
    title: "personal-html",
    subtitle: "OPEN PROJECT",
    year: "2026",
    tags: ["Agent工具"],
    image: "assets/project/2.png",
    accent: ["#ffb36b", "#ff6f91"],
    summary: "把 ChatGPT 对话、科学笔记和本地计算流程整理成结构清晰、可阅读和探索的交互式 HTML 教材或笔记。",
    detail: "比ChatGPT的Chat模式更全面的交互组件，可记笔记的交互式 HTML。Agent 负责组织内容、检索与核查资料、补充解释和制作交互；仓库提供制作规范、共享样式、组件及构建检查工具。默认每个主题交付一个可离线打开的 HTML 文件，也支持可选的 VitePress 网站模式。默认只有一套html样式，可以让自己的Agent添加，修改",
    link: "https://github.com/jyx114514/personal-html-book",
    link2: "https://jyx114514.github.io/personal-html-book/example.html",                 // 第二个按钮（毛玻璃次按钮）
    link2Label: "样例示例"                // 可选，不填默认显示「更多链接」
  },
  {
    title: "深度学习在生物学上的应用",
    subtitle: "OPEN PROJECT",
    year: "2026",
    tags: ["生物学", "深度学习"],
    image: "assets/project/3.png",
    accent: ["#6be3ff", "#5b6cff"],
    summary: "参考一些已出版的书籍和文章，编写的深度学习在生物学上的应用方向的HTML",
    detail: "这个仓库会更新一些深度学习在生物学上的应用的讲解html，会参考一些已出版的书籍和文章，html中的所有代码均已经在本地验证，复现请参考里面提供的数据集链接和环境. 需要一定的生物学和计算机科学的基础知识",
    link: "https://github.com/jyx114514/deeplearn-for-biology"
  },
  {
    title: "FASTA UniProt → NCBI Taxonomy 映射工具",
    subtitle: "OPEN PROJECT",
    year: "2026",
    tags: ["Python", "数据处理"],
    accent: ["#6be3ff", "#5b6cff"],
    summary: "解析 FASTA，通过 UniProt 官方 REST API 建立 accession 到当前数据库物种的映射",
    detail: "fasta_taxonomy_mapper.py 使用 Biopython 解析 FASTA，通过 UniProt 官方 REST API 建立 accession 到当前数据库物种的映射。只查询唯一 accession，同时输出每条原始 FASTA 记录，保留重复项和顺序。",
    link: "https://github.com/jyx114514/fasta-taxonomy-mapper/tree/main"
  },
  /*
  {
    title: "项目三 · 占位",
    subtitle: "Project Three",
    year: "2025",
    tags: ["Python", "数据"],
    accent: ["#6be3ff", "#5b6cff"],
    summary: "一句话介绍这个项目解决了什么问题。",
    detail: "这里是项目详情的占位文字：背景、你的角色、关键难点、最终效果。",
    link: "#"
    link: "https://github.com/...",       // 第一个按钮（白色主按钮）
    linkLabel: "GitHub 仓库",             // 可选，不填默认显示「查看项目」
    link2: "https://...",                 // 第二个按钮（毛玻璃次按钮）
    link2Label: "在线体验"                // 可选，不填默认显示「更多链接」
  },
  */
];

export const EXPERIENCE = [
  { period: "2027/9 —", title: "研究生", org: "华西生物治疗全国重点实验室", desc: "已保送" },
  { period: "2026/9 — 至今", title: "毕业设计", org: "清华大学", desc: "所做具体方向应实验室要求保密" },
  { period: "2025/7 — 2025/9", title: "暑研", org: "北京大学", desc: "参与神经递质荧光探针的开发" },
  { period: "2023 — 2027", title: "本科", org: "中国农业大学", desc: "生物，计算机双修，曾在URP和竞赛中做过植物激酶，显微技术方向的研究" }
];

export const CONTACTS = [
  { label: "GitHub", icon: "github", href: "https://github.com/jyx114514" },
  { label: "Discord：tianfan0001", icon: "discord", copy: "tianfan0001" },
  { label: "Discord 群", icon: "discord", href: "https://x.com/Pyuyi233/status/2108064975139094774", note: "Discord 群的群主是学姐，我只是平时经常在里面聊。" }
];


