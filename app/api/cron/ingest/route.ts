import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { ensureGoogleCredentials } from "@/lib/google-auth";

const parser = new Parser();

const REGIONS = [
  "Uttarakhand",
  "Himachal Pradesh",
  "Ladakh",
  "Sikkim",
  "Arunachal Pradesh",
  "Nepal Himalayas",
  "Bhutan Himalayas",
  "Hindu Kush Himalayas",
  "Himalayan environment",
  "Himalayan glacier",
  "Himalayan culture",
  "Himalayan tribe",
  "Himalayan wildlife",
];

const NEGATIVE_KEYWORDS = [
  "election",
  "parliament",
  "minister",
  "BJP",
  "Congress",
  "Modi",
  "MLA",
  "vote",
  "rally",
  "campaign",
  "cabinet",
  "Bollywood",
  "actor",
  "actress",
  "film",
  "movie",
  "box office",
  "celebrity",
  "OTT",
  "Netflix",
  "IPL",
  "cricket",
  "FIFA",
  "Olympics",
  "match",
  "tournament",
  "stock",
  "Sensex",
  "Nifty",
  "rupee",
  "budget",
  "GDP",
  "inflation",
  "viral",
  "meme",
  "trending",
  "reel",
];

function isRelevant(title: string): boolean {
  const lower = title.toLowerCase();
  return !NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// Accepts both Vercel cron (GET with CRON_SECRET) and manual trigger (POST with admin passphrase)
export async function GET(req: NextRequest) {
  return runIngest(req, "cron");
}

export async function POST(req: NextRequest) {
  return runIngest(req, "manual");
}

async function runIngest(req: NextRequest, runType: "cron" | "manual") {
  // Parse body once for manual requests
  let body: { passphrase?: string; date?: string } = {};
  if (runType === "manual") {
    body = await req.json().catch(() => ({}));
    if (body.passphrase !== process.env.ADMIN_ACCESS_PASSPHRASE) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Determine target date
  let targetDate: string;
  if (runType === "manual") {
    targetDate = body.date ?? new Date().toISOString().split("T")[0];
  } else {
    // Cron always runs for today (IST = UTC+5:30)
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    targetDate = ist.toISOString().split("T")[0];
  }

  // Block future dates
  const todayIST = (() => {
    const now = new Date();
    return new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0];
  })();
  if (targetDate > todayIST) {
    return NextResponse.json({ error: "Cannot ingest for a future date" }, { status: 400 });
  }

  // Check mutual exclusion: if a run already happened for this date, block the other type
  const existingRun = await prisma.ingestRun.findUnique({ where: { runDate: targetDate } });
  if (existingRun) {
    if (existingRun.runType !== runType) {
      return NextResponse.json(
        {
          error: `A ${existingRun.runType} ingest already ran for ${targetDate}. Cannot run a ${runType} ingest.`,
          alreadyRan: true,
          existingRunType: existingRun.runType,
        },
        { status: 409 }
      );
    }
    // Same type re-run: wipe existing drafts and re-ingest
    await prisma.draftQueue.deleteMany({
      where: { runDate: targetDate, status: "draft" },
    });
  }

  ensureGoogleCredentials();

  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.VERTEX_PROJECT_ID!,
    location: process.env.VERTEX_REGION || "global",
  });

  // Stage 1: Fetch & pre-filter RSS
  const seen = new Set<string>();
  const rawArticles: Array<{ title: string; link: string; imageUrl?: string; images?: string[] }> = [];

  // Build date-filtered RSS query for past dates
  const isToday = targetDate === todayIST;
  let dateQuery = "";
  if (!isToday) {
    const targetD = new Date(targetDate + "T00:00:00Z");
    const prevD = new Date(targetD.getTime() - 24 * 60 * 60 * 1000);
    const nextD = new Date(targetD.getTime() + 24 * 60 * 60 * 1000);
    const prevStr = prevD.toISOString().split("T")[0];
    const nextStr = nextD.toISOString().split("T")[0];
    dateQuery = ` after:${prevStr} before:${nextStr}`;
  }

  console.log(`[Ingest] Starting ingest for ${targetDate} (isToday: ${isToday}, dateQuery: "${dateQuery}")`);

  let totalFetchedCount = 0;
  let totalFilteredOutCount = 0;

  for (const region of REGIONS) {
    const query = `${region} news${dateQuery}`;
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
    try {
      const feed = await parser.parseURL(rssUrl);
      const items = feed.items.slice(0, 15);
      totalFetchedCount += items.length;

      for (const item of items) {
        const link = item.link ?? "";
        const title = item.title ?? "";
        if (!link || seen.has(link)) continue;
        seen.add(link);
        if (!isRelevant(title)) {
          totalFilteredOutCount++;
          console.log(`[Ingest Filtered Out] ${title}`);
          continue;
        }

        // Strict pubDate verification (allow +/- 1 day for timezone variance)
        const itemDateRaw = item.isoDate || item.pubDate;
        if (itemDateRaw) {
          try {
            const parsedItemDateStr = new Date(itemDateRaw).toISOString().split("T")[0];
            const targetTime = new Date(targetDate + "T00:00:00Z").getTime();
            const itemTime = new Date(parsedItemDateStr + "T00:00:00Z").getTime();
            const diffDays = Math.abs((targetTime - itemTime) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
              totalFilteredOutCount++;
              console.log(`[Ingest Filtered Out Stale Date: ${parsedItemDateStr}] ${title}`);
              continue;
            }
          } catch {
            // keep if date parse fails
          }
        }
        // Extract images from enclosure, media:content, media:thumbnail, and content html
        const itemImages: string[] = [];
        const encUrl = (item.enclosure as { url?: string } | undefined)?.url;
        if (encUrl && encUrl.startsWith("http")) itemImages.push(encUrl);

        const mediaUrl = (item["media:content"] as { $?: { url?: string } } | undefined)?.$?.url;
        if (mediaUrl && mediaUrl.startsWith("http") && !itemImages.includes(mediaUrl)) itemImages.push(mediaUrl);

        const thumbUrl = (item["media:thumbnail"] as { $?: { url?: string } } | undefined)?.$?.url;
        if (thumbUrl && thumbUrl.startsWith("http") && !itemImages.includes(thumbUrl)) itemImages.push(thumbUrl);

        const contentHtml = item.content ?? item.description ?? "";
        const imgMatches = contentHtml.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/g);
        for (const match of imgMatches) {
          if (match[1] && !itemImages.includes(match[1])) {
            itemImages.push(match[1]);
          }
        }

        const imageUrl = itemImages[0] ?? undefined;
        rawArticles.push({ title, link, imageUrl, images: itemImages });
        console.log(`[Ingest Kept] ${title} (${itemImages.length} images)`);
      }
    } catch (err) {
      console.error(`[Ingest RSS Error] Fetch failed for ${region}:`, err);
    }
  }

  console.log(`[Ingest Stage 1 Complete] Found ${rawArticles.length} relevant articles (Fetched: ${totalFetchedCount}, Filtered: ${totalFilteredOutCount})`);

  if (rawArticles.length === 0) {
    console.error(`[Ingest Error] 0 relevant articles found for date ${targetDate}`);
    return NextResponse.json({
      error: "No relevant articles found for this date",
      targetDate,
      diagnostics: {
        isToday,
        dateQuery,
        totalFetchedCount,
        totalFilteredOutCount
      }
    }, { status: 404 });
  }

  // Stage 2: Gemini clustering
  console.log(`[Ingest Stage 2] Sending ${rawArticles.length} titles to gemini-3.8-flash for clustering...`);
  const titlesOnly = rawArticles
    .map((a, i) => `${i + 1}. ${a.title} | ${a.link}`)
    .join("\n");

  const clusterResult = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `Article list:\n${titlesOnly}`,
    config: {
      systemInstruction: `You are a news editor for "Himalayan Pulse" — focused on Himalayan environment, culture, people, and regional issues across Uttarakhand, Himachal Pradesh, Ladakh, Sikkim, Arunachal Pradesh, Nepal, Bhutan, and Hindu Kush.
1. Group articles covering the same underlying event.
2. Select TOP 3 most impactful, mission-aligned story clusters.
3. Return strict JSON.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            topic: { type: Type.STRING },
            sources: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["id", "topic", "sources"],
        },
      },
    },
  });

  const top3Clusters: Array<{ id: number; topic: string; sources: string[] }> = JSON.parse(
    clusterResult.text ?? "[]"
  );
  console.log(`[Ingest Stage 2 Complete] Top 3 clusters identified:`, top3Clusters.map(c => c.topic));

  // Stage 3: Per-cluster synthesis (with Myth Busting & Impact Analysis)
  console.log(`[Ingest Stage 3] Synthesizing draft context & myth/fact analysis with gemini-3.8-flash...`);
  const synthesizedDrafts: Array<{
    topic: string;
    synthesizedContext: string;
    mythsAndFacts: string[];
    impactAnalysis: string;
    sources: string[];
    imageUrl?: string;
    images: string[];
  }> = [];

  for (const cluster of top3Clusters.slice(0, 3)) {
    const clusterArticles = rawArticles.filter((a) => cluster.sources.includes(a.link));
    const clusterTitles = clusterArticles.map((a) => `- ${a.title} (${a.link})`).join("\n");

    const allClusterImages = Array.from(
      new Set(clusterArticles.flatMap((a) => (a as { images?: string[] }).images ?? []))
    );
    const imageUrl = allClusterImages[0] ?? undefined;

    const synthesisResult = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Topic: ${cluster.topic}\nArticles:\n${clusterTitles}`,
      config: {
        systemInstruction:
          "You are a senior investigative researcher for Himalayan Pulse. Synthesize the news articles into:\n" +
          "1. synthesizedContext: A thorough 4-5 sentence factual overview with numbers, dates, locations, and source attribution.\n" +
          "2. mythsAndFacts: 2-3 specific myths, rumors, or common misconceptions surrounding this event, explicitly proving or busting them with factual evidence.\n" +
          "3. impactAnalysis: A clear factual assessment answering: Is this development/event overall GOOD or BAD for the Himalayan ecology, regional environment, and local mountain communities? Provide explicit scientific/economic reasons WHY.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            synthesizedContext: { type: Type.STRING },
            mythsAndFacts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            impactAnalysis: { type: Type.STRING },
          },
          required: ["synthesizedContext", "mythsAndFacts", "impactAnalysis"],
        },
      },
    });

    const parsedSynth = JSON.parse(synthesisResult.text ?? "{}") as {
      synthesizedContext: string;
      mythsAndFacts: string[];
      impactAnalysis: string;
    };

    synthesizedDrafts.push({
      topic: cluster.topic,
      synthesizedContext: parsedSynth.synthesizedContext?.trim() ?? "",
      mythsAndFacts: parsedSynth.mythsAndFacts ?? [],
      impactAnalysis: parsedSynth.impactAnalysis?.trim() ?? "",
      sources: cluster.sources,
      imageUrl,
      images: allClusterImages,
    });
  }
  console.log(`[Ingest Stage 3 Complete] Synthesized ${synthesizedDrafts.length} draft summaries with myth busting & impact analysis.`);

  // Stage 4: Save to DB
  console.log(`[Ingest Stage 4] Saving drafts to database for ${targetDate}...`);
  const runRecord = existingRun
    ? await prisma.ingestRun.update({ where: { runDate: targetDate }, data: { runType } })
    : await prisma.ingestRun.create({ data: { runDate: targetDate, runType } });

  await prisma.draftQueue.createMany({
    data: synthesizedDrafts.map((d) => ({
      topic: d.topic,
      synthesizedContext: d.synthesizedContext,
      mythsAndFacts: d.mythsAndFacts,
      impactAnalysis: d.impactAnalysis,
      sources: d.sources,
      imageUrl: d.imageUrl,
      images: d.images,
      runDate: targetDate,
      status: "draft",
    })),
  });

  return NextResponse.json({
    success: true,
    targetDate,
    runType,
    draftsCreated: synthesizedDrafts.length,
    runId: runRecord.id,
  });
}
