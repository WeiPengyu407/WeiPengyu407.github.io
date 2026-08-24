// z 必须从 astro/zod 导入。Astro 6 起 astro:content 不再转出 z，
// 也不要走 astro:schema（同样已弃用）。
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    // 一句话结论，先给答案、规格往后放。列表页、文章顶部、RSS 摘要共用这一句。
    // 字段名叫 saves 是给写的人看的：想清楚这篇替读者省掉什么，才写得出这句。
    // 页面上显示的标签是「结论」——写的人和读的人需要的提示不一样。
    saves: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    // 精选会上首页，一屏一篇
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
