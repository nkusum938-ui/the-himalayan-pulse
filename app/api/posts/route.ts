import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor");

  try {
    const posts = await prisma.post.findMany({
      where: { isDraft: false },
      orderBy: { publishedAt: "desc" },
      take: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        entities: true,
        authorName: true,
        publishedAt: true,
        articleDate: true,
        imageUrl: true,
      },
    });

    const hasMore = posts.length > PAGE_SIZE;
    const data = hasMore ? posts.slice(0, PAGE_SIZE) : posts;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({ posts: data, nextCursor });
  } catch (err) {
    console.error("[Posts API Error]", err);
    return NextResponse.json({ posts: [], nextCursor: null }, { status: 500 });
  }
}
