// 全站文案集中在这里，改字不用翻组件。

export const SITE = {
  name: "pengyu",
  tagline: "Linux 桌面与 AI agent 的调试笔记",
  description:
    "软件工程师。在 openSUSE + KDE Plasma 上折腾底层，搭自己的多 agent 工作流，并把定位问题的过程写清楚。",
  // 留空则不渲染任何邮箱链接（不留假地址：能点但点了是死的，比没有更糟）。
  email: "weipengyufirst@outlook.com",
  links: [
    { label: "GitHub", href: "https://github.com/WeiPengyu407" },
    { label: "RSS", href: "/rss.xml" },
  ],
};

// 小字先给方位，大字才表态。少了小字这一层，大字就成了没有着落的口号。
//
// 标题写法上有两条硬规矩，都是「读起来突兀」的解药：
// 1. 每个分句自带主谓，不靠上一行小字借主语——残句一定突兀。
// 2. 落点要是判断（这是什么），不是动作流水（我做 A 然后做 B）。
//    悬空的叙述句读着像段落的第二句，缺掉的那个「第一句」就是突兀感的来源。
export const HERO = {
  eyebrow: "调试笔记",
  title: "我在 Linux 桌面上折腾底层，踩过的坑都写在这里。",
  lede: "KDE Plasma、Wayland、多个 AI agent 协作。最难查的从来不是报错，而是那些日志里一个字都不报、但行为就是不对的失败——我写的主要就是这一类。",
};

export const ABOUT = [
  "软件工程师。日常在 openSUSE Tumbleweed + KDE Plasma Wayland 上折腾。",
  "业余在搭一套自己的 AI 工作流：让多个 agent 共享一份持久记忆，并且互相验收对方的活。",
  "写作原则：每篇都是自己踩完才写的，会写清楚怎么定位到原因，不写「理论上应该可以」。",
];

// href 为空是最终状态，不是待填的占位符：pengyu 至今只正式发布过 music-unlock 一个项目，
// 其余都只在本机跑，没有公开仓库可指。模板遇到空 href 会渲染成纯文本而不是死链。
export const PROJECTS = [
  {
    name: "picture-lock",
    blurb: "把 Windows 的图片密码锁屏搬到 KDE Plasma Wayland。",
    finding: "最难查的是几个日志里零报错的静默回退，绕了很久才找到。",
    href: "",
  },
  {
    name: "双 agent 外置大脑",
    blurb:
      "让 Kimi Code 和 Cursor 共用一个 Obsidian vault 当记忆，配异步信箱协议和回写纪律。",
    finding: "真正难的不是共享，是验收：agent 标了「已完成」的东西可能根本没生效。",
    href: "",
  },
  {
    name: "女娲造人",
    blurb: "输入一个人名，自动调研并产出一套可运行的人物思维框架 skill。",
    finding: "要捕捉的是这个人怎么想，不是他说过什么——否则产出的只是一堆语录。",
    href: "",
  },
  {
    name: "music-unlock",
    blurb:
      "加密音乐转普通音频的桌面工具：网易云 .ncm、QQ 音乐 .qmc/.mflac/.mgg、Apple Music。拖进去就行。",
    finding: "",
    href: "https://github.com/WeiPengyu407/music-unlock",
  },
  {
    name: "kimi-webui-ctrl-s-fix",
    blurb:
      "一个用户脚本：Kimi Code Web UI 把「插嘴」绑在 Ctrl+S 上，和浏览器的「保存页面」撞了，按下去只会弹保存对话框。",
    finding:
      "在捕获阶段 preventDefault，只掐掉浏览器的默认行为，事件继续往下传，页面自己的处理器照常收到。",
    href: "https://github.com/WeiPengyu407/kimi-webui-ctrl-s-fix",
  },
  {
    name: "wx-remote",
    blurb: "用手机微信远程指挥自己电脑上的 AI 编程助手，常驻守护进程，现在还在跑。",
    finding: "",
    href: "",
  },
  {
    name: "deskpet",
    // finding 留空是故意的：我不知道它踩过什么坑，编一条比空着糟。
    blurb:
      "Wayland 上的桌面宠物。GTK3 + gtk-layer-shell 做透明置顶窗口，木偶式肢体动画，点了会冒气泡说话。",
    finding: "",
    href: "",
  },
];
