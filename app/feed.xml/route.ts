import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const baseUrl = "https://thehimalayanpulse.com";

  let posts: Array<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    publishedAt: Date;
    authorName: string;
  }> = [];

  try {
    posts = await prisma.post.findMany({
      where: { isDraft: false },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        authorName: true,
      },
    });
  } catch (err) {
    console.error("[RSS Feed DB Error]", err);
  }

  const rssItemsXml = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/news/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/news/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author><![CDATA[${post.authorName}]]></author>
      <description><![CDATA[${post.excerpt}]]></description>
    </item>`
    )
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Himalayan Pulse — Mountain Ecology &amp; Community Journalism</title>
    <link>${baseUrl}</link>
    <description>Independent reporting on Himalayan environment, culture, and community life across Uttarakhand, Himachal, Ladakh, Sikkim, Nepal, Bhutan, and Arunachal Pradesh.</description>
    <language>en-in</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
