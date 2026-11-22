// data.js — 页面上所有个人信息都在这里。替换成真实内容即可，不需要改其他文件。

export const PROFILE = {
  name: "天繁",
  nameEn: "Tianfan Yunxiang Jiang",
  role: "生物学在读，同时参与小模型微调，部分技术路线探索等深度学习工作",
  tagline: "何处是我们寻找的彼岸？",
  email: "2944007545@qq.com"
};

export const ABOUT = {
  paragraphs: [
    {text: "中国农业大学在读，生物学和数据科学双修，预计2027年6月毕业，研究生就读于华西生物治疗全国重点实验室。",indent:true},
    {text: "目前在清华大学做毕业设计，最近已经忙的起飞",indent:true}
  ],
  facts: [
    { label: "方向", value: "生物学什么都做，计算机主要是深度学习" },
    { label: "状态", value: "本科在读，欢迎学术讨论，通过下面的联系方式联系我" },
    { label: "爱好", value: "折腾软件，尝试新想法，偶尔去吃点好吃的" }
  ]
};

// accent 是卡片封面的渐变主色，取自背景里的霓虹色
export const PROJECTS = [
  {
    title: "项目一 · 占位",
    subtitle: "Project One",
    year: "2026",
    tags: ["Three.js", "WebGL"],
    accent: ["#ff7eb3", "#7a8cff"],
    summary: "一句话介绍这个项目解决了什么问题。",
    detail: "这里是项目详情的占位文字：背景、你的角色、关键难点、最终效果。可以放 2~3 段。",
    link: "#"
  },
  {
    title: "项目二 · 占位",
    subtitle: "Project Two",
    year: "2026",
    tags: ["设计", "交互"],
    accent: ["#ffb36b", "#ff6f91"],
    summary: "一句话介绍这个项目解决了什么问题。",
    detail: "这里是项目详情的占位文字：背景、你的角色、关键难点、最终效果。",
    link: "#"
  },
  {
    title: "项目三 · 占位",
    subtitle: "Project Three",
    year: "2025",
    tags: ["Python", "数据"],
    accent: ["#6be3ff", "#5b6cff"],
    summary: "一句话介绍这个项目解决了什么问题。",
    detail: "这里是项目详情的占位文字：背景、你的角色、关键难点、最终效果。",
    link: "#"
  },
  
];

export const EXPERIENCE = [
  { period: "2027/9 —", title: "研究生", org: "华西生物治疗全国重点实验室", desc: "研究生已保送" },
  { period: "2026/9 — 至今", title: "毕业设计", org: "清华大学", desc: "所做项目具体方向暂时保密" },
  { period: "2025/7 — 2025/9", title: "暑研", org: "北京大学", desc: "参与神经递质荧光探针的开发" },
  { period: "2023 — 2027", title: "本科", org: "中国农业大学", desc: "生物，计算机双修，URP和竞赛做过植物激酶，显微技术的研究" }
];

export const CONTACTS = [
  { label: "GitHub", icon: "github", href: "https://github.com/jyx114514" }
];


