# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15+ (App Router, Server Actions, React Server Components), Tailwind CSS v4, Supabase (PostgreSQL) via Prisma ORM v7, Google Gen AI SDK (`@google/genai` with Gemini 3.8 Flash & Gemini 3.8 Pro), Vercel edge deployment.

## Users

Environment-conscious readers, climate researchers, Himalayan locals, mountain policy enthusiasts, and cultural preservationists seeking verified regional news without noise or clickbait clutter.

## Product Purpose

Deliver lightweight, high-leverage, SEO & GEO-optimized news coverage dedicated exclusively to the Himalayan region (Uttarakhand, Himachal Pradesh, Ladakh, Sikkim, Arunachal Pradesh, Nepal, Bhutan, and the Hindu Kush belt). Amplify environmental, cultural, and community stories using an automated RSS ingest pipeline paired with human-in-the-loop editorial curation.

## Positioning

Strict regional mandate focused exclusively on Himalayan ecology, climate impact, local community livelihoods, and cultural heritage. Zero tolerance for national politics, Bollywood/entertainment, sports, finance, or viral internet clickbait.

## Operating Context

Daily automated RSS ingestion at 8 PM IST (14:30 UTC), AI-driven topic clustering/synthesis via Gemini 3.8, hidden admin editorial curation interface, automated GEO/SEO markdown article generation, static/ISR public web rendering for sub-100ms response times.

## Capabilities and Constraints

- Daily RSS pre-filtering & URL deduplication (zero LLM token waste).
- Native structured JSON output via `@google/genai` `responseSchema` (Gemini 3.8 Flash & Gemini 3.8 Pro).
- Hidden human-in-the-loop admin draft queue for personal angle injection.
- Public static/ISR pages with automatic Next.js metadata, Schema.org `NewsArticle` + `Speakable` JSON-LD, Open Graph cards, and IndexNow pings.
- Strict content boundary excluding non-Himalayan topics, national politics, celebrity gossip, and generic viral trends.

## Brand Commitments

- **Name:** Himalayan Pulse
- **Voice/Tone:** Objective, factual, respectful of mountain communities, authoritative on ecology.
- **Visual Identity:** Clean, high-performance, accessible, distraction-free reading experience.

## Evidence on Hand

- Technical Architecture Roadmap: `context.md`

## Product Principles

1. **Authentic Mountain Focus:** Preserve and amplify original Himalayan voices and ecological reality without dilution.
2. **High Information Density:** Zero clickbait, zero fluff — structured facts and direct takeaways.
3. **Speed & Accessibility:** Sub-100ms static load times, lightweight client footprint, fully crawlable by search engines and AI answer engines.
4. **Human-in-the-Loop Curation:** AI powers ingest and drafting; humans retain editorial control.

## Accessibility & Inclusion

- Semantic HTML heading hierarchy (single H1 per page, strict H2/H3 article flow).
- High contrast, legible typography optimized for mobile skimmers and long-form reading.
- Full server-rendered HTML for zero-JS accessibility.
- `Speakable` schema configuration for screen readers and voice search engines.
