// 构建后自检。只查一类问题：在页面上看不出来、但内容是错的。
//
// 目前只有一条规则：产物 HTML 里不该出现字面的 **。出现了说明某处加粗没被解析，
// 页面上显示的是一对星号。这个失败没有任何报错，构建照样成功，肉眼扫也容易漏，
// 所以必须让构建替我盯着。
//
// 触发原因见 README「中文加粗」一节：闭合的 ** 前面是中文标点、后面又紧跟汉字时，
// CommonMark 判定它不构成合法闭合，整对星号退化成普通字符。

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

const problems = [];

for (const file of await htmlFiles(DIST)) {
  const html = await readFile(file, "utf8");
  // 只看正文区，避开 <pre>/<code>：代码块里的 ** 是合法内容（比如 C 的指针、glob）。
  const prose = html.replace(/<pre[\s\S]*?<\/pre>/g, "").replace(/<code[\s\S]*?<\/code>/g, "");
  for (const m of prose.matchAll(/\*\*[^*\n]{0,30}/g)) {
    problems.push(`${file.replace(DIST, "")}: ${m[0].trim()}`);
  }
}

if (problems.length) {
  console.error(`\n✗ 产物里有 ${problems.length} 处未解析的加粗：\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error("\n把闭合 ** 前的中文标点移到 ** 外面，例如 「…生效**。下一句」。\n");
  process.exit(1);
}

console.log("✓ 产物自检通过：没有未解析的加粗");
