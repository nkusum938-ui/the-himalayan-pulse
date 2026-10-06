# Product Requirement Document (PRD) & Architecture Blueprint
## Project Name: Himalayan Pulse (Custom Next.js News Platform)

This document serves as the comprehensive codebase context and technical roadmap for building a lightweight, high-leverage, SEO & GEO-optimized news portal dedicated to the entire Himalayan region — spanning all Himalayan territories including Uttarakhand, Himachal Pradesh, Ladakh, Sikkim, Arunachal Pradesh, Nepal, Bhutan, and the broader Hindu Kush–Himalayan belt.

The mission of Himalayan Pulse is to preserve and amplify stories about Himalayan environment, culture, people, and region. We strictly cover:
- Environmental news: glaciers, rivers, forests, climate impact, natural disasters, wildlife
- Cultural news: indigenous traditions, festivals, heritage, language preservation
- People-centric stories: local communities, mountain livelihoods, migration, education
- Regional developments: infrastructure, policy, or events that directly affect Himalayan people and ecology

We strictly DO NOT cover:
- National or state-level politics unrelated to the Himalayan region
- Bollywood, entertainment, or celebrity news
- Viral internet trends or social media stories
- Sports, finance, or any topic not directly connected to the Himalayan region and its people

The system features a public frontend and a secure, hidden human-in-the-loop admin pipeline using modern Gemini 3.8 models and AI orchestration.

---

## 1. System Architecture Overview

The application is a single unified **Next.js 15+** application using the **App Router**, utilizing Server Actions, Tailwind CSS v4, Supabase (PostgreSQL) via Prisma, and official `@google/genai` SDK powering Gemini 3.8 models.

```
                        [ VERCEL CRON JOB — 8 PM IST daily ]
                                       │
                                       ▼
                           [ Ingest & Pre-filter Engine ]
                      Fetches Google News RSS for all Himalayan regions
                      Deduplicates by URL hash (in-memory, free)
                      Negative keyword filter: drops politics, Bollywood,
                      sports, finance, viral — does NOT require Himalayan
                      keywords to be present (avoids false negatives)
                                       │
                                       ▼
                      [ Gemini 3.8 Clustering & Synthesis Pipeline ]
                      Pass 1: Send titles to gemini-3.8-flash (with responseSchema)
                              → returns structured Top 3 topic clusters
                      Pass 2: Per-cluster synthesis via gemini-3.8-flash
                              → returns concise factual summaries
                                       │
                                       ▼
                           [ Supabase DB — DraftQueue table ]
                         Stores today's Top 3 as draft entries (isDraft=true)
                                       │
                                       ▼
                              [ ADMIN PANEL (hidden route) ]
                      Admin views Top 3 draft cards with synthesized context
                      Selects 1 → writes rough personal notes/angle
                      Clicks "Generate & Preview" → calls generateArticle action
                                       │
                                       ▼
                     [ gemini-3.8-pro / gemini-3.8-flash Article Generator ]
                      Combines admin notes + cluster context
                      Outputs structured JSON (Markdown content + GEO/SEO metadata)
                      Uses native responseSchema & systemInstruction API
                                       │
                                       ▼
                      Admin previews rendered article → clicks "Publish"
                      Post saved to DB (isDraft=false) + tag revalidation
                                       │
                                       ▼
                             [ PUBLIC FRONTEND ]
                        /app/page.tsx (Static/ISR News Feed)
                       /app/news/[slug]/page.tsx (GEO & SEO Optimized Article)
```

---

## 2. Technical Stack Specifications

* **Framework:** Next.js 15+ (App Router, React Server Components, Server Actions, Dynamic Tag Revalidation)
* **Styling:** Tailwind CSS v4 (Shadcn/ui for UI components)
* **Database:** Supabase (PostgreSQL) via Prisma ORM v7
* **LLM:** Google Gen AI SDK `@google/genai` (official modern SDK):
    - `gemini-3.8-flash` — latest ultra-fast model for RSS ingestion, topic clustering, and synthesis with native `responseSchema` structured JSON support.
    - `gemini-3.8-pro` — advanced reasoning model for final article drafting, structured GEO optimization, and entity mapping.
* **RSS Parsing:** `rss-parser` (Node.js)
* **Cron Jobs:** Vercel Cron (defined in `vercel.json`, hits `/api/cron/ingest` at 8 PM IST = 14:30 UTC)
* **Deployment:** Vercel Edge / Serverless Functions
* **SEO & GEO Engine:** `next-sitemap`, Schema.org JSON-LD (`NewsArticle`, `Organization`, `Speakable`), Open Graph, Twitter Cards, IndexNow API, dynamic `@vercel/og` social cards.

---

## 3. Database Schema (Prisma + Supabase)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Stores Top 3 AI-clustered drafts from daily cron job.
model DraftQueue {
  id                 String   @id @default(cuid())
  topic              String
  synthesizedContext String   // AI-generated cross-source summary
  sources            String[] // Original article URLs used in synthesis
  runDate            DateTime @default(now())
  isUsed             Boolean  @default(false)
}

// Final published articles shown on public site.
model Post {
  id               String   @id @default(cuid())
  title            String
  slug             String   @unique
  content          String   // Full Markdown article body (with TL;DR block)
  excerpt          String   // 2-sentence SEO meta description
  metaKeywords     String   // Comma-separated long-tail keywords
  keyTakeaways     String[] // Structured bullet points for GEO (Google AI Overviews / SearchGPT)
  entities         String[] // Recognized entities (regions, glaciers, organizations) for semantic indexing
  publishedAt      DateTime @default(now())
  updatedAt        DateTime @updatedAt
  originalSources  String[] // Source compliance & attribution links
  isDraft          Boolean  @default(false)
}
```

---

## 4. Cron Job Configuration (Vercel)

Daily ingestion pipeline triggered automatically by Vercel Cron at 8 PM IST (14:30 UTC).

#### `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/ingest",
      "schedule": "30 14 * * *"
    }
  ]
}
```

Protected route verified via `CRON_SECRET` authorization header.

---

## 5. Feature Workflows & Implementation Blueprint

### Step 1: Ingest & Pre-filter (Zero LLM Cost) -> Gemini 3.8 Structured Clustering

Runs inside cron API route using `@google/genai` with native JSON schemas (`responseSchema`) and `systemInstruction`.

#### API Route File: `app/api/cron/ingest/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const REGIONS = [
  "Uttarakhand", "Himachal Pradesh", "Ladakh", "Sikkim",
  "Arunachal Pradesh", "Nepal Himalayas", "Bhutan Himalayas",
  "Hindu Kush Himalayas", "Himalayan environment", "Himalayan glacier",
  "Himalayan culture", "Himalayan tribe", "Himalayan wildlife"
];

const NEGATIVE_KEYWORDS = [
  "election", "parliament", "minister", "BJP", "Congress", "Modi", "MLA", "MP",
  "vote", "rally", "campaign", "cabinet", "Bollywood", "actor", "actress",
  "film", "movie", "box office", "celebrity", "OTT", "Netflix", "web series",
  "IPL", "cricket", "FIFA", "Olympics", "match", "tournament", "stock",
  "Sensex", "Nifty", "rupee", "budget", "GDP", "inflation", "viral", "meme",
  "trending", "reel"
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return !NEGATIVE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Stage 1: Fetch & Pre-filter ---
  const seen = new Set<string>();
  let rawArticles: Array<{ title: string; link: string }> = [];

  for (const region of REGIONS) {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(region + " news")}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
      const feed = await parser.parseURL(rssUrl);
      for (const item of feed.items.slice(0, 15)) {
        const link = item.link || "";
        const title = item.title || "";
        if (seen.has(link)) continue;
        seen.add(link);
        if (!isRelevant(title)) continue;
        rawArticles.push({ title, link });
      }
    } catch (err) {
      console.error(`RSS fetch failed for ${region}:`, err);
    }
  }

  // --- Stage 2: Gemini 3.8 Structured Clustering ---
  const titlesOnly = rawArticles.map((a, i) => `${i + 1}. ${a.title} | ${a.link}`).join("\n");

  const clusterResult = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `Article list:\n${titlesOnly}`,
    config: {
      systemInstruction: `You are a news editor for "Himalayan Pulse" — a publication focused strictly on Himalayan environment, culture, people, and regional issues across Uttarakhand, Himachal Pradesh, Ladakh, Sikkim, Arunachal Pradesh, Nepal, Bhutan, and the Hindu Kush range.
Tasks:
1. Group articles covering the same underlying event.
2. Select TOP 3 most impactful, mission-aligned story clusters.
3. Return strict JSON.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        description: "Top 3 article clusters",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            topic: { type: Type.STRING, description: "Descriptive topic headline" },
            sources: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Source article URLs"
            }
          },
          required: ["id", "topic", "sources"]
        }
      }
    }
  });

  const top3Clusters = JSON.parse(clusterResult.text || "[]");

  // --- Stage 3: Gemini 3.8 Synthesis ---
  const synthesizedDrafts = [];

  for (const cluster of top3Clusters) {
    const clusterArticles = rawArticles.filter(a => cluster.sources.includes(a.link));
    const clusterTitles = clusterArticles.map(a => `- ${a.title} (${a.link})`).join("\n");

    const synthesisResult = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Topic: ${cluster.topic}\nArticles:\n${clusterTitles}`,
      config: {
        systemInstruction: "You are a senior researcher for Himalayan Pulse. Synthesize news articles about the same topic into a balanced, factual 3-4 sentence summary. Include key facts and source names."
      }
    });

    synthesizedDrafts.push({
      topic: cluster.topic,
      synthesizedContext: synthesisResult.text?.trim() || "",
      sources: cluster.sources
    });
  }

  // --- Stage 4: Database Save ---
  await prisma.draftQueue.createMany({
    data: synthesizedDrafts.map(d => ({
      topic: d.topic,
      synthesizedContext: d.synthesizedContext,
      sources: d.sources
    }))
  });

  return NextResponse.json({ success: true, draftsCreated: synthesizedDrafts.length });
}
```

---

### Step 2: Admin Generation & Preview with Gemini 3.8 Pro Structured Output

Admin reviews draft, provides local perspective notes, and generates GEO & SEO optimized post via native JSON output.

#### Server Action File: `app/actions/generateArticle.ts`
```typescript
"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateArticlePreview({
  draftId,
  topic,
  synthesizedContext,
  sources,
  adminRoughNotes
}: {
  draftId: string;
  topic: string;
  synthesizedContext: string;
  sources: string[];
  adminRoughNotes: string;
}) {
  const result = await ai.models.generateContent({
    model: "gemini-3.8-pro",
    contents: `Topic: ${topic}
Factual Context: ${synthesizedContext}
Sources: ${JSON.stringify(sources)}
Admin Notes: ${adminRoughNotes}`,
    config: {
      systemInstruction: `You are a senior editor and GEO/SEO specialist for "Himalayan Pulse". Write a production-ready news article in clean Markdown optimized for both search engines (SEO) and AI Answer Engines / LLMs (Generative Engine Optimization / GEO).

Strict Content Rules:
1. Headline: Compelling, keyword-rich, reflects the Himalayan perspective.
2. First Section: Include a concise 3-bullet point "Key Takeaways" block at the top for instant AI Overview extraction.
3. Formatting: Use 3 clean sections with ### headers. Bold critical entities, numbers, and dates.
4. Citations: Weave Markdown inline hyperlinks for sources with descriptive anchor text.
5. Voice: Natural blend of admin's local notes and factual synthesis.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 concise factual key takeaway bullet points for GEO"
          },
          content: { type: Type.STRING, description: "Full Markdown article body" },
          excerpt: { type: Type.STRING, description: "150-160 character meta description" },
          metaKeywords: { type: Type.STRING, description: "5 comma-separated long-tail keywords" },
          entities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Named entities (regions, glaciers, communities, orgs)"
          }
        },
        required: ["title", "keyTakeaways", "content", "excerpt", "metaKeywords", "entities"]
      }
    }
  });

  const articleData = JSON.parse(result.text || "{}");
  const slug = articleData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const post = await prisma.post.create({
    data: {
      title: articleData.title,
      slug,
      content: articleData.content,
      excerpt: articleData.excerpt,
      metaKeywords: articleData.metaKeywords,
      keyTakeaways: articleData.keyTakeaways,
      entities: articleData.entities,
      originalSources: sources,
      isDraft: true
    }
  });

  await prisma.draftQueue.update({
    where: { id: draftId },
    data: { isUsed: true }
  });

  return { postId: post.id, slug };
}

export async function publishPost(postId: string, slug: string) {
  await prisma.post.update({
    where: { id: postId },
    data: { isDraft: false }
  });

  revalidatePath("/");
  revalidatePath(`/news/${slug}`);
  revalidateTag("news-feed");

  return { success: true };
}
```

---

### Step 3: Public Route Implementation (SEO & GEO Engine)

Static HTML generation, ISR, Structured Schema (`NewsArticle`, `Speakable`, `Organization`), and Key Takeaways for AI Engine Indexing.

#### `app/news/[slug]/page.tsx`
```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!post) return {};

  const canonicalUrl = `https://himalayan-pulse.com/news/${params.slug}`;

  return {
    title: `${post.title} | Himalayan Pulse`,
    description: post.excerpt,
    keywords: post.metaKeywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: canonicalUrl,
      siteName: "Himalayan Pulse",
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      tags: post.entities
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt
    }
  };
}

export default async function ArticlePage({ params }: Props) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, isDraft: false }
  });
  if (!post) notFound();

  // Modern NewsArticle + Speakable JSON-LD schema for Google & AI Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.publishedAt.toISOString(),
    "dateModified": post.updatedAt.toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://himalayan-pulse.com/news/${post.slug}`
    },
    "author": {
      "@type": "Organization",
      "name": "Himalayan Pulse",
      "url": "https://himalayan-pulse.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Himalayan Pulse",
      "url": "https://himalayan-pulse.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://himalayan-pulse.com/logo.png"
      }
    },
    "about": post.entities.map(e => ({ "@type": "Thing", "name": e })),
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".key-takeaways", "h1"]
    },
    "isAccessibleForFree": "true"
  };

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-4xl font-extrabold tracking-tight mb-4">{post.title}</h1>
      <p className="text-sm text-slate-500 mb-6">
        Published on: {new Date(post.publishedAt).toLocaleDateString("en-IN")}
      </p>

      {/* GEO Key Takeaways Box (Optimized for AI Search Engines & Mobile Readers) */}
      {post.keyTakeaways && post.keyTakeaways.length > 0 && (
        <div className="key-takeaways bg-slate-50 dark:bg-slate-900 border-l-4 border-emerald-500 p-4 rounded-r-lg mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            Key Takeaways
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:slate-300">
            {post.keyTakeaways.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="prose prose-slate lg:prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
```

---

## 6. Gemini Token & Performance Optimization Strategy

| Pipeline Stage | Model Used | API Configuration | Purpose | Cost/Latency |
|---|---|---|---|---|
| Ingest & Deduplication | None (rss-parser) | In-memory Set & string filter | Zero-cost reduction | Free |
| Pass 1: Clustering | `gemini-3.8-flash` | `responseSchema` (ARRAY of OBJECTs) | Group raw titles into Top 3 topics | Extremely Low |
| Pass 2: Synthesis | `gemini-3.8-flash` | Focused text generation | Synthesize 3 cluster summaries | Very Low |
| Final Article Generation | `gemini-3.8-pro` | `responseSchema` (OBJECT with GEO metadata) | Produce SEO/GEO article + schema | Moderate |

Key Improvements with Gemini 3.8:
- **Native JSON Schemas (`responseSchema`):** Eliminates string splitting, broken regex, and retry loops.
- **`systemInstruction`:** Scopes model behavior strictly to domain rules without prompt bleed.
- **Default Temperature (1.0):** Preserves native Gemini 3 reasoning flow without hallucination loops.

---

## 7. Security Strategy

1. **Obscured Admin Route:** Non-predictable path e.g. `app/backend-portal-x9712/page.tsx`.
2. **Environment Passphrase Gating:** `ADMIN_ACCESS_PASSPHRASE` server-side check.
3. **Cron Bearer Authentication:** `CRON_SECRET` verified on every trigger to `/api/cron/ingest`.

---

## 8. Environment Variables

```env
DATABASE_URL=            # Supabase PostgreSQL connection string
GEMINI_API_KEY=          # Google AI Studio API key (Gemini 3.8 models)
CRON_SECRET=             # Secret bearer token for Vercel Cron
ADMIN_ACCESS_PASSPHRASE= # Passphrase for admin action validation
```

---

## 9. Comprehensive SEO & GEO (Generative Engine Optimization) Strategy

### SEO vs. GEO: Dual-Optimization Architecture

Modern news consumption relies both on traditional Search Engines (Google, Bing) and AI Search Engines / Generative AI (Google AI Overviews, Perplexity, ChatGPT/SearchGPT, Gemini). Himalayan Pulse implements dual-layer optimization:

#### 1. Generative Engine Optimization (GEO) Standards
- **Direct Fact Summaries (TL;DR Block):** Featured top bullet points marked with clear CSS selectors (`.key-takeaways`) allow AI crawlers to parse facts directly.
- **Semantic Entity Markup:** Explicit `entities` field saved in database and declared in Schema.org `about` array to anchor articles to recognized geographic and ecological nodes (e.g. *Gangotri Glacier*, *Uttarakhand*, *Char Dham*).
- **Source Transparency & E-E-A-T:** Every article links directly to original reporting sources with descriptive inline anchor text, establishing Experience, Expertise, Authoritativeness, and Trustworthiness.
- **Speakable Schema:** Configured `speakable` property in `NewsArticle` schema enables voice search engines (Google Assistant, Siri, Alexa) to read key takeaways accurately.

#### 2. Technical & Traditional SEO Standards
- **Server Component Rendering (RSC):** Pure HTML delivered instantly without client JS execution delays.
- **Core Web Vitals Excellence:** Sub-100ms LCP via ISR on Vercel Edge; zero CLS with fixed-dimension images.
- **Canonical URL Integrity:** Self-referencing canonical tags on every route to prevent content scrapers from hurting domain authority.
- **Structured Schema (`NewsArticle`):** Complete Schema.org implementation including `headline`, `datePublished`, `dateModified`, `author`, `publisher`, and `mainEntityOfPage`.
- **Automated Sitemap & IndexNow:** `next-sitemap` auto-generates `sitemap.xml` and `robots.txt`. Instant indexing ping triggered upon post publication.
