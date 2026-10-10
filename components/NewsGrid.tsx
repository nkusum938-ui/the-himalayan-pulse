"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  entities: string[];
  authorName: string;
  publishedAt: string;
  articleDate: string;
  imageUrl: string | null;
}

interface Props {
  initialPosts: PostSummary[];
  initialCursor: string | null;
}

export function NewsGrid({ initialPosts, initialCursor }: Props) {
  const [posts, setPosts] = useState<PostSummary[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialCursor);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?cursor=${cursor}`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // silently fail — user can scroll again
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  // IntersectionObserver watches the sentinel div at the bottom
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/news/${post.slug}`}
            className="group flex flex-col justify-between bg-white dark:bg-[#141210] border border-[#e7e5e4] dark:border-[#27272a] p-5 sm:p-6 rounded-sm hover:border-[#1e3a2b] dark:hover:border-[#488263] transition-colors"
          >
            <div>
              {post.entities.length > 0 && (
                <div className="text-xs font-mono text-[#1e3a2b] dark:text-[#488263] font-semibold uppercase mb-2 tracking-wider">
                  {post.entities[0]}
                </div>
              )}
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] group-hover:text-[#1e3a2b] dark:group-hover:text-[#488263] transition-colors mb-2 leading-snug">
                {post.title}
              </h3>
              {post.imageUrl && (
                <div className="my-3 overflow-hidden rounded-xs border border-[#e7e5e4] dark:border-[#27272a]">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-36 object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              )}
              <p className="text-xs text-[#57534e] dark:text-[#a1a1aa] font-serif leading-relaxed line-clamp-3 mb-4">
                {post.excerpt}
              </p>
            </div>
            <div className="text-xs font-mono text-[#78716c] dark:text-[#a1a1aa] pt-3 border-t border-[#f5f4f0] dark:border-[#27272a]/60 flex items-center justify-between">
              <span className="truncate max-w-[140px]">{post.authorName}</span>
              <span className="shrink-0">
                {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Sentinel + loader */}
      <div ref={sentinelRef} className="mt-10 flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
            <div className="w-4 h-4 border-2 border-[#1e3a2b] border-t-transparent rounded-full animate-spin" />
            Loading more stories...
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-xs font-mono text-[#78716c] dark:text-[#a1a1aa] py-4">
            — End of archive —
          </p>
        )}
      </div>
    </>
  );
}
