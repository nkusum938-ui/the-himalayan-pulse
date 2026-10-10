import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewsletterSubscribe } from "@/components/NewsletterSubscribe";
import { NewsGrid } from "@/components/NewsGrid";

export const revalidate = 60;

const PAGE_SIZE = 12;

interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  entities: string[];
  keyTakeaways: string[];
  authorName: string;
  publishedAt: Date;
  articleDate: string;
  imageUrl: string | null;
}

async function getInitialPosts(): Promise<{ posts: PostSummary[]; nextCursor: string | null }> {
  try {
    const posts = await prisma.post.findMany({
      where: { isDraft: false },
      orderBy: { publishedAt: "desc" },
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        entities: true,
        keyTakeaways: true,
        authorName: true,
        publishedAt: true,
        articleDate: true,
        imageUrl: true,
      },
    });
    const hasMore = posts.length > PAGE_SIZE;
    const data = hasMore ? posts.slice(0, PAGE_SIZE) : posts;
    return { posts: data, nextCursor: hasMore ? data[data.length - 1].id : null };
  } catch (err) {
    console.error("[getInitialPosts DB Error]", err);
    return { posts: [], nextCursor: null };
  }
}

export default async function Home() {
  const { posts, nextCursor } = await getInitialPosts();

  const leadPost = posts[0] ?? null;
  const restPosts = posts.slice(1);

  const formattedToday = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1c1917] selection:bg-[#1e3a2b] selection:text-[#f8fafc] dark:bg-[#0c0a09] dark:text-[#f5f5f4] font-sans antialiased">
      {/* NEWSPAPER MASTHEAD */}
      <header className="max-w-5xl mx-auto pt-4 sm:pt-6 pb-2 px-4">
        {/* Top Date & Action Strip */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 py-2 text-[11px] font-mono text-[#78716c] dark:text-[#a1a1aa] border-b border-[#1c1917]/10 dark:border-[#f5f5f4]/10">
          <div className="capitalize text-center sm:text-left">{formattedToday}</div>
          <div className="tracking-widest uppercase text-[10px] font-semibold text-[#1e3a2b] dark:text-[#488263] text-center">
            Vol. I • Himalayan Ecology & Society
          </div>
          <a
            href="#newsletter"
            className="hover:underline text-[#1e3a2b] dark:text-[#488263] font-semibold uppercase tracking-wider text-[11px] sm:text-[10px] py-1 inline-flex items-center min-h-[36px]"
          >
            Subscribe to Dispatch ↓
          </a>
        </div>

        {/* Classic Print Newspaper Title Banner */}
        <div className="border-y-4 border-double border-[#1c1917]/70 dark:border-[#f5f5f4]/70 py-4 sm:py-8 my-3 text-center">
          <h1 className="text-3xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-[#1c1917] dark:text-[#f5f5f4]">
            <Link href="/" className="hover:opacity-95 transition-opacity">
              The Himalayan Pulse
            </Link>
          </h1>
        </div>

        {/* Region Edition Bar */}
        <div className="text-[10px] font-mono text-[#78716c] dark:text-[#a1a1aa] uppercase tracking-widest text-center py-1.5 border-b border-[#1c1917]/10 dark:border-[#f5f5f4]/10 overflow-x-auto whitespace-nowrap scrollbar-none">
          Uttarakhand • Himachal • Ladakh • Sikkim • Nepal • Bhutan • Arunachal
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {posts.length === 0 ? (
          <div className="py-20 sm:py-24 text-center text-sm font-mono text-[#78716c]">
            <p className="mb-2">No articles published yet.</p>
            <p>Check back after the first daily ingest runs.</p>
          </div>
        ) : (
          <>
            {/* FEATURED STORY */}
            {leadPost && (
              <section className="mb-10 sm:mb-14">
                <Link
                  href={`/news/${leadPost.slug}`}
                  className="group block bg-white dark:bg-[#141210] border border-[#e7e5e4] dark:border-[#27272a] p-5 sm:p-8 md:p-10 rounded-sm hover:border-[#1e3a2b] dark:hover:border-[#488263] transition-all duration-200"
                >
                  {leadPost.entities.length > 0 && (
                    <div className="text-xs font-mono text-[#1e3a2b] dark:text-[#488263] font-semibold mb-2 sm:mb-3 uppercase tracking-wider">
                      {leadPost.entities[0]}
                    </div>
                  )}

                  <h2 className="text-xl sm:text-3xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] group-hover:text-[#1e3a2b] dark:group-hover:text-[#488263] transition-colors leading-tight mb-3 sm:mb-4">
                    {leadPost.title}
                  </h2>

                  {leadPost.imageUrl && (
                    <div className="mb-4 sm:mb-6 overflow-hidden rounded-xs border border-[#e7e5e4] dark:border-[#27272a]">
                      <img
                        src={leadPost.imageUrl}
                        alt={leadPost.title}
                        className="w-full h-48 sm:h-72 md:h-96 object-cover group-hover:scale-[1.01] transition-transform duration-300"
                      />
                    </div>
                  )}

                  <p className="text-sm sm:text-lg text-[#57534e] dark:text-[#a1a1aa] font-serif leading-relaxed max-w-3xl mb-5 sm:mb-6">
                    {leadPost.excerpt}
                  </p>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs font-mono text-[#78716c] dark:text-[#a1a1aa] pt-4 border-t border-[#f5f4f0] dark:border-[#27272a]/60">
                    <span>{leadPost.authorName} • {new Date(leadPost.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span className="text-[#1e3a2b] dark:text-[#488263] font-medium group-hover:translate-x-0.5 transition-transform">
                      Read story →
                    </span>
                  </div>
                </Link>
              </section>
            )}

            {/* ARTICLE GRID — infinite scroll */}
            {restPosts.length > 0 && (
              <section>
                <NewsGrid
                  initialPosts={restPosts.map((p) => ({
                    ...p,
                    publishedAt: p.publishedAt.toISOString(),
                  }))}
                  initialCursor={nextCursor}
                />
              </section>
            )}
          </>
        )}

        {/* NEWSLETTER SECTION — Always rendered */}
        <NewsletterSubscribe />
      </main>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-[#e7e5e4]/60 dark:border-[#27272a]/60 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#78716c] font-mono">
          <div>© {new Date().getFullYear()} The Himalayan Pulse</div>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors">About</Link>
            <Link href="/contact" className="hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
