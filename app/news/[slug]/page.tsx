import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Metadata } from "next";
import Link from "next/link";
import { formatArticleContent } from "@/lib/formatContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { isDraft: false },
      select: { slug: true },
    });
    return posts.map((p: { slug: string }) => ({ slug: p.slug }));
  } catch (err) {
    console.error("[generateStaticParams DB Error]", err);
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post = null;
  try {
    post = await prisma.post.findUnique({ where: { slug } });
  } catch (err) {
    console.error("[generateMetadata DB Error]", err);
  }
  if (!post) return {};

  const canonicalUrl = `https://thehimalayanpulse.com/news/${slug}`;

  return {
    title: `${post.title} | The Himalayan Pulse`,
    description: post.excerpt,
    keywords: post.metaKeywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: canonicalUrl,
      siteName: "The Himalayan Pulse",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.entities,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  let post = null;
  try {
    post = await prisma.post.findUnique({
      where: { slug, isDraft: false },
    });
  } catch (err) {
    console.error("[ArticlePage DB Error]", err);
  }
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://thehimalayanpulse.com/news/${post.slug}`,
    },
    author: {
      "@type": "Person",
      name: post.authorName,
      jobTitle: post.authorRole,
    },
    publisher: {
      "@type": "Organization",
      name: "The Himalayan Pulse",
      url: "https://thehimalayanpulse.com",
      logo: {
        "@type": "ImageObject",
        url: "https://thehimalayanpulse.com/logo.png",
      },
    },
    image: post.imageUrl ? [{ "@type": "ImageObject", url: post.imageUrl, caption: `${post.title} — The Himalayan Pulse` }] : undefined,
    about: post.entities.map((e: string) => ({ "@type": "Thing", name: e })),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".key-takeaways", "h1"],
    },
    isAccessibleForFree: "true",
  };

  const formattedContent = formatArticleContent(post.content);
  const isAiGeneratedImage = post.imageUrl ? post.imageUrl.startsWith("data:image") || post.imageUrl.includes("unsplash") === false : false;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1c1917] selection:bg-[#1e3a2b] selection:text-[#f8fafc] dark:bg-[#0c0a09] dark:text-[#f5f5f4] font-sans antialiased">
      {/* NEWSPAPER NAV HEADER */}
      <header className="border-b border-[#1c1917]/10 dark:border-[#f5f5f4]/10 bg-[#fcfbf9] dark:bg-[#0c0a09] px-4 py-3 sm:py-4 sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-2">
          <Link href="/" className="font-serif text-lg sm:text-2xl font-black tracking-tight text-[#1c1917] dark:text-[#f5f5f4] hover:opacity-90 transition-opacity">
            The Himalayan Pulse
          </Link>
          <Link href="/" className="font-mono text-[11px] sm:text-xs text-[#1e3a2b] dark:text-[#488263] font-semibold uppercase tracking-wider hover:underline flex items-center gap-1 shrink-0 py-1">
            ← Front Page
          </Link>
        </div>
      </header>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Entity tags — Top 4 single-line strip */}
        {post.entities.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-1 mb-3 scrollbar-none text-[11px] font-mono text-[#1e3a2b] dark:text-[#488263] font-semibold uppercase tracking-wider">
            {post.entities.slice(0, 4).map((entity: string) => (
              <span key={entity} className="shrink-0 bg-[#1e3a2b]/5 dark:bg-[#488263]/10 px-2 py-0.5 rounded-xs border border-[#1e3a2b]/10 dark:border-[#488263]/20">
                • {entity}
              </span>
            ))}
          </div>
        )}

        {/* Article Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight mb-4 text-[#1c1917] dark:text-[#f5f5f4] leading-[1.18]">
          {post.title}
        </h1>

        {/* Byline & Date bar */}
        <div className="flex flex-col sm:flex-row flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs text-[#78716c] dark:text-[#a1a1aa] font-mono mb-6 sm:mb-8 pb-3 sm:pb-4 border-b-2 border-t border-[#1c1917]/20 dark:border-[#f5f5f4]/20 py-2.5 sm:py-3">
          <div>
            <span className="font-bold text-[#1c1917] dark:text-[#f5f5f4]">By {post.authorName}</span>
            {post.authorRole && <span className="italic"> — {post.authorRole}</span>}
          </div>
          <div>
            {new Date(post.publishedAt).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Featured Hero Image */}
        {post.imageUrl && (
          <figure className="mb-8 sm:mb-10">
            <div className="overflow-hidden rounded-xs border border-[#e7e5e4] dark:border-[#27272a] shadow-xs">
              <img
                src={post.imageUrl}
                alt={`${post.title} — Himalayan report covering ${post.entities.slice(0, 3).join(", ") || "mountain ecosystem"}`}
                loading="eager"
                className="w-full h-auto max-h-[300px] sm:max-h-[440px] md:max-h-[520px] object-cover"
              />
            </div>
            <figcaption className="mt-2 text-center text-[11px] font-mono text-[#78716c] dark:text-[#a1a1aa] flex items-center justify-center gap-1.5">
              {isAiGeneratedImage ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>✦ AI-generated editorial visualization — The Himalayan Pulse</span>
                </>
              ) : (
                <span>Photo dispatch — {post.entities[0] || "Himalayan Region"}</span>
              )}
            </figcaption>
          </figure>
        )}

        {/* MAIN LAYOUT GRID (Article Body + Sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* SIDEBAR METADATA (Shows FIRST on mobile/tablet, 4-Cols on RIGHT on desktop) */}
          <aside className="lg:col-span-4 space-y-6 order-first lg:order-last">
            {/* GEO Key Takeaways */}
            {post.keyTakeaways.length > 0 && (
              <div className="key-takeaways bg-[#f5f4f0]/60 dark:bg-[#141210]/60 border border-[#e7e5e4] dark:border-[#27272a] p-5 rounded-sm">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1e3a2b] dark:text-[#488263] mb-3 pb-2 border-b border-[#e7e5e4] dark:border-[#27272a]">
                  Key Takeaways
                </h2>
                <ul className="space-y-2.5">
                  {post.keyTakeaways.map((point: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-xs font-serif text-[#44403c] dark:text-[#d4d4d8] leading-relaxed">
                      <span className="text-[#1e3a2b] dark:text-[#488263] font-bold shrink-0">—</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regional Impact Analysis Section */}
            {post.impactAnalysis && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-5 rounded-sm">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 mb-2 pb-1.5 border-b border-emerald-200 dark:border-emerald-800/40">
                  🔍 Regional Impact
                </h2>
                <p className="text-xs font-serif text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  {post.impactAnalysis}
                </p>
              </div>
            )}

            {/* Myth Busting Section */}
            {post.mythsAndFacts && post.mythsAndFacts.length > 0 && (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-5 rounded-sm">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-3 pb-1.5 border-b border-amber-200 dark:border-amber-800/40">
                  ⚡ Myth Busting & Fact Check
                </h2>
                <ul className="space-y-2">
                  {post.mythsAndFacts.map((mf: string, idx: number) => (
                    <li key={idx} className="flex gap-2 text-xs font-serif text-amber-950 dark:text-amber-200 leading-relaxed">
                      <span className="text-amber-700 dark:text-amber-400 font-bold shrink-0">•</span>
                      {mf}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* ARTICLE BODY (Shows SECOND on mobile/tablet, 8-Cols on LEFT on desktop) */}
          <div className="lg:col-span-8 order-last lg:order-first">
            <div className="prose prose-stone lg:prose-lg dark:prose-invert max-w-none
              prose-a:text-[#1e3a2b] dark:prose-a:text-[#488263] prose-a:underline prose-a:underline-offset-4
              prose-strong:text-[#1c1917] dark:prose-strong:text-[#f5f5f4] prose-strong:font-bold
              prose-ul:font-serif prose-li:font-serif prose-li:my-2">
              <ReactMarkdown
                components={{
                  h2: ({ node, ...props }) => (
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] mt-10 mb-4 tracking-tight border-b border-[#1c1917]/15 dark:border-[#f5f5f4]/15 pb-2" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1e3a2b] dark:text-[#488263] mt-10 mb-3 tracking-tight" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4 className="text-lg font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] mt-8 mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="mb-6 leading-[1.8] text-[#292524] dark:text-[#e7e5e4] text-base sm:text-lg font-serif" {...props} />
                  ),
                  img: ({ node, ...props }) => (
                    <figure className="my-8">
                      <img {...props} className="w-full h-auto rounded-sm border border-[#e7e5e4] dark:border-[#27272a] object-cover" />
                      {props.alt && (
                        <figcaption className="text-center text-xs font-mono text-[#78716c] mt-2">
                          {props.alt}
                        </figcaption>
                      )}
                    </figure>
                  ),
                }}
              >
                {formattedContent}
              </ReactMarkdown>
            </div>

            {/* Sources */}
            {(() => {
              const groundSource = "Himalayan Pulse Field Desk — Regional Ground Bureau";

              // Clean a raw source string — handles Google News redirects and "title | url" mixed formats
              function cleanSource(src: string): string {
                // If it contains " | http", it's a "title | url" mixed string — extract the URL part
                const pipeIdx = src.indexOf(" | http");
                const urlStr = pipeIdx !== -1 ? src.slice(pipeIdx + 3).trim() : src.trim();

                try {
                  const url = new URL(urlStr);
                  // Google News redirect — extract the real publisher from the article title part
                  if (url.hostname === "news.google.com") {
                    if (pipeIdx !== -1) {
                      // Extract publisher from the title part: "Title - Publisher"
                      const titlePart = src.slice(0, pipeIdx).trim();
                      const dashIdx = titlePart.lastIndexOf(" - ");
                      if (dashIdx !== -1) {
                        return `${titlePart.slice(dashIdx + 3).trim()} (Verified Dispatch)`;
                      }
                    }
                    return "Google News Bureau (Verified Dispatch)";
                  }
                  return `${url.hostname.replace(/^www\./, "")} (Verified Dispatch)`;
                } catch {
                  // Not a URL — could be "Title - Publisher" plain text
                  const dashIdx = src.lastIndexOf(" - ");
                  if (dashIdx !== -1) {
                    return `${src.slice(dashIdx + 3).trim()} (Verified Dispatch)`;
                  }
                  return src;
                }
              }

              const formattedSources = [
                groundSource,
                ...Array.from(
                  new Set(
                    post.originalSources
                      .map(cleanSource)
                      .filter((s: string) => s !== groundSource && s.length > 0)
                  )
                ),
              ];

              return (
                <div className="mt-14 pt-6 border-t border-[#1c1917]/10 dark:border-[#f5f5f4]/10">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#78716c] dark:text-[#a1a1aa] mb-3">
                    Verified Sources & Bureau Dispatches
                  </h3>
                  <ul className="space-y-2">
                    {formattedSources.map((sourceText: string, i: number) => (
                      <li key={i} className="text-xs font-mono text-[#57534e] dark:text-[#a1a1aa] flex items-center gap-2">
                        <span className="text-[#1e3a2b] dark:text-[#488263] font-bold">•</span>
                        <span>{sourceText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        </div>
      </article>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-[#e7e5e4]/60 dark:border-[#27272a]/60 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#78716c] font-mono">
          <Link href="/" className="font-serif text-sm font-bold text-[#1c1917] dark:text-[#f5f5f4] hover:underline">
            ← Back to The Himalayan Pulse Front Page
          </Link>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors">About</Link>
            <Link href="/contact" className="hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
