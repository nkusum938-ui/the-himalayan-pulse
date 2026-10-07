import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://thehimalayanpulse.com";

  const posts = await prisma.post.findMany({
    where: { isDraft: false },
    select: { slug: true, updatedAt: true, publishedAt: true },
  });

  const articleUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/news/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  return [...staticUrls, ...articleUrls];
}
