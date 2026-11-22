// data.js — 页面上所有个人信息都在这里。替换成真实内容即可，不需要改其他文件。

export const PROFILE = {
  name: "天繁",
  nameEn: "Tianfan Yunxiang Jiang",
  role: "生物学在读，同时参与小模型微调等深度学习工作",
  tagline: "何处是我们寻找的彼岸？",
  email: "2944007545@qq.com"
};

export const ABOUT = {
  paragraphs: [
    "这里是一段自我介绍的占位文字。可以写你是谁、正在做什么、关心什么问题，以及你希望别人记住你的哪一点。",
    "第二段可以写你的工作方式或兴趣爱好。比如喜欢在下雨天散步、听着耳机里的歌，把路上看到的光影记下来。"
  ],
  facts: [
    { label: "方向", value: "前端 / 设计 / 研究" },
    { label: "状态", value: "开放合作" },
    { label: "爱好", value: "雨天 · 音乐 · 摄影" }
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
  {
    title: "项目四 · 占位",
    subtitle: "Project Four",
    year: "2025",
    tags: ["研究", "可视化"],
    accent: ["#c8a6ff", "#ff8fc7"],
    summary: "一句话介绍这个项目解决了什么问题。",
    detail: "这里是项目详情的占位文字：背景、你的角色、关键难点、最终效果。",
    link: "#"
  },
  {
    title: "项目五 · 占位",
    subtitle: "Project Five",
    year: "2024",
    tags: ["移动端"],
    accent: ["#8fffd2", "#4f9dff"],
    summary: "一句话介绍这个项目解决了什么问题。",
    detail: "这里是项目详情的占位文字：背景、你的角色、关键难点、最终效果。",
    link: "#"
  },
  {
    title: "项目六 · 占位",
    subtitle: "Project Six",
    year: "2024",
    tags: ["开源"],
    accent: ["#ffd36b", "#ff7a7a"],
    summary: "一句话介绍这个项目解决了什么问题。",
    detail: "这里是项目详情的占位文字：背景、你的角色、关键难点、最终效果。",
    link: "#"
  }
];

// level 取 0~100，用于技能环形进度
export const SKILLS = [
  {
    group: "开发",
    groupEn: "Engineering",
    items: [
      { name: "技能 A", level: 90 },
      { name: "技能 B", level: 80 },
      { name: "技能 C", level: 70 }
    ]
  },
  {
    group: "设计",
    groupEn: "Design",
    items: [
      { name: "技能 D", level: 85 },
      { name: "技能 E", level: 65 },
      { name: "技能 F", level: 60 }
    ]
  },
  {
    group: "其他",
    groupEn: "Others",
    items: [
      { name: "技能 G", level: 75 },
      { name: "技能 H", level: 55 },
      { name: "技能 I", level: 50 }
    ]
  }
];

export const EXPERIENCE = [
  { period: "2025 — 至今", title: "职位 / 角色占位", org: "机构名称占位", desc: "一句话描述主要工作和成果。" },
  { period: "2023 — 2025", title: "职位 / 角色占位", org: "机构名称占位", desc: "一句话描述主要工作和成果。" },
  { period: "2020 — 2023", title: "学历 / 学校占位", org: "学校名称占位", desc: "一句话描述专业方向或代表性经历。" }
];

// icon 可选：github / mail / x / bilibili / link
export const CONTACTS = [
  { label: "GitHub", icon: "github", href: "https://github.com/" },
  { label: "邮箱", icon: "mail", href: "mailto:hello@example.com" },
  { label: "Bilibili", icon: "bilibili", href: "https://www.bilibili.com/" },
  { label: "博客", icon: "link", href: "#" }
];
