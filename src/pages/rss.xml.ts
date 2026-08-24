import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { SITE } from "../site";

export async function GET(context: APIContext) {
  const articles = (await getCollection("articles", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site!,
    items: articles.map((entry) => ({
      title: entry.data.title,
      // 摘要就用「省你什么」，订阅者在阅读器里也是先看结论。
      description: entry.data.saves,
      pubDate: entry.data.date,
      link: `/articles/${entry.id}/`,
      categories: entry.data.tags,
    })),
    customData: "<language>zh-CN</language>",
  });
}
