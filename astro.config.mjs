import { defineConfig } from "astro/config";

export default defineConfig({
  // RSS 里的绝对链接靠 site 拼，填错了订阅者点不开。
  //
  // 这个配置对应 GitHub Pages 的「用户站」模式，前提是仓库必须叫：
  //     WeiPengyu407.github.io
  // 换成别的仓库名（比如 homepage），站点就会落在 /homepage/ 子路径下，
  // 必须同时补一行 base: "/homepage"。少了 base 的表现很坑：首页看着完全正常，
  // 但样式和所有文章链接全部 404——因为首页的相对路径恰好能撞对。
  //
  // 以后买了自己的域名：site 换成域名，base 删掉。
  site: "https://weipengyu407.github.io",
  prefetch: {
    // 悬停即预取：点下去之前内容已经在手上了。
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: false,
    },
  },
});
