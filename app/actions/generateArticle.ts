"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { ensureGoogleCredentials } from "@/lib/google-auth";
import { revalidatePath } from "next/cache";
import { formatArticleContent } from "@/lib/formatContent";
import { optimizeImage } from "@/lib/imageOptimizer";

function getAI() {
  ensureGoogleCredentials();
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.VERTEX_PROJECT_ID!,
    location: process.env.VERTEX_REGION || "global",
  });
}

export async function generateAIImage({ prompt }: { prompt: string }) {
  const ai = getAI();
  try {
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: `Editorial documentary photograph of Himalayan region: ${prompt}. Photorealistic, natural sunlight, cinematic 8k resolution mountain photography.`,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "16:9",
      },
    });
    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Image) {
      const rawUrl = `data:image/jpeg;base64,${base64Image}`;
      const optimizedUrl = await optimizeImage(rawUrl);
      return { imageUrl: optimizedUrl };
    }
  } catch (err) {
    console.error("[Imagen Generation Error]", err);
  }
  // High quality realistic mountain editorial fallback image from Unsplash
  return {
    imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop",
  };
}

export async function generateArticlePreview({
  draftId,
  topic,
  synthesizedContext,
  mythsAndFacts,
  impactAnalysis,
  sources,
  imageUrl,
  images,
  adminViews,
  articleDate,
  authorName,
  authorRole,
}: {
  draftId: string;
  topic: string;
  synthesizedContext: string;
  mythsAndFacts?: string[];
  impactAnalysis?: string;
  sources: string[];
  imageUrl?: string;
  images?: string[];
  adminViews: string;
  articleDate: string;
  authorName?: string;
  authorRole?: string;
}) {
  const ai = getAI();
  const availableImages = images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];
  const finalAuthorName = authorName && authorName.trim() ? authorName.trim() : "Himalayan Pulse Editorial Desk";
  const finalAuthorRole = authorRole && authorRole.trim() ? authorRole.trim() : "Senior Regional Editor";

  const result = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `Topic: ${topic}
Factual Research Context: ${synthesizedContext}
Discovered Myths & Misconceptions: ${JSON.stringify(mythsAndFacts ?? [])}
Initial Impact Assessment: ${impactAnalysis ?? "None"}
Source URLs: ${JSON.stringify(sources)}
Available Image URLs: ${JSON.stringify(availableImages)}
Editor's Personal Views/Perspective: ${adminViews}
Article Date: ${articleDate}`,
    config: {
      systemInstruction: `You are a senior editor and investigative journalist for "Himalayan Pulse", a publication focused on Himalayan ecology, culture, and communities.

Blend the editor's personal perspective with factual research context, myth busting, and regional impact analysis.

Structure:
- Title: Compelling, keyword-rich headline.
- Key Takeaways: 3 concise bullet points for AI Overview / GEO extraction.
- Myths & Fact Checks: 2-3 specific myths or rumors surrounding this topic, explicitly proving or busting them with factual evidence.
- Regional Impact Analysis: Direct analytical section explaining whether this event/development is overall GOOD or BAD for the Himalayan ecosystem & local mountain communities, with explicit scientific/economic REASONS WHY.
- Article Body: 3-4 structured sections. EVERY section title MUST be explicitly prefixed with '### ' (Markdown H3 header). NEVER write section headings as plain unformatted text. Bold critical entities, numbers, dates. Include inline Markdown images using available image URLs (\`![Caption](URL)\`) placed between relevant paragraphs if image URLs exist.

Strict rules:
- Stay strictly within Himalayan region scope.
- Article date must be ${articleDate}.
- No national politics, Bollywood, sports, finance, or viral content.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          mythsAndFacts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          impactAnalysis: { type: Type.STRING },
          content: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          metaKeywords: { type: Type.STRING },
          entities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["title", "keyTakeaways", "mythsAndFacts", "impactAnalysis", "content", "excerpt", "metaKeywords", "entities"],
      },
    },
  });

  const articleData = JSON.parse(result.text ?? "{}") as {
    title: string;
    keyTakeaways: string[];
    mythsAndFacts: string[];
    impactAnalysis: string;
    content: string;
    excerpt: string;
    metaKeywords: string;
    entities: string[];
  };

  const cleanContent = formatArticleContent(articleData.content ?? "");

  const slug = articleData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Delete any previous generated (non-published) post for this draft
  await prisma.post.deleteMany({
    where: { draftId, isDraft: true },
  });

  const initialImage = imageUrl ?? availableImages[0] ?? null;
  const finalImageUrl = (initialImage && initialImage.startsWith("data:image"))
    ? await optimizeImage(initialImage)
    : initialImage;

  const post = await prisma.post.create({
    data: {
      draftId,
      title: articleData.title,
      slug,
      content: cleanContent,
      excerpt: articleData.excerpt,
      metaKeywords: articleData.metaKeywords,
      keyTakeaways: articleData.keyTakeaways,
      mythsAndFacts: articleData.mythsAndFacts ?? mythsAndFacts ?? [],
      impactAnalysis: articleData.impactAnalysis ?? impactAnalysis ?? null,
      entities: articleData.entities,
      authorName: finalAuthorName,
      authorRole: finalAuthorRole,
      imageUrl: finalImageUrl,
      images: availableImages,
      originalSources: sources,
      isDraft: true,
      articleDate,
    },
  });

  // Update draft status to "generated"
  await prisma.draftQueue.update({
    where: { id: draftId },
    data: { status: "generated" },
  });

  return {
    postId: post.id,
    slug: post.slug,
    title: articleData.title,
    excerpt: articleData.excerpt,
    content: cleanContent,
    keyTakeaways: articleData.keyTakeaways,
    mythsAndFacts: articleData.mythsAndFacts ?? [],
    impactAnalysis: articleData.impactAnalysis ?? "",
    metaKeywords: articleData.metaKeywords,
    entities: articleData.entities,
    authorName: post.authorName,
    authorRole: post.authorRole,
    imageUrl: post.imageUrl,
    images: post.images,
  };
}

export async function updatePostImage(postId: string, imageUrl: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false };

  const finalImageUrl = imageUrl.startsWith("data:image")
    ? await optimizeImage(imageUrl)
    : imageUrl;

  // Only store real URLs in the images array, never base64 strings
  const existingImages = (post.images ?? []).filter((img: string) => img.startsWith("http"));
  const updatedImages = finalImageUrl.startsWith("http")
    ? Array.from(new Set([finalImageUrl, ...existingImages]))
    : existingImages;

  await prisma.post.update({
    where: { id: postId },
    data: {
      imageUrl: finalImageUrl,
      images: updatedImages,
    },
  });

  revalidatePath("/");
  revalidatePath(`/news/${post.slug}`);

  return { success: true, imageUrl: finalImageUrl, images: updatedImages };
}

export async function updatePublishedPost({
  postId,
  title,
  content,
  excerpt,
  imageUrl,
  authorName,
  authorRole,
}: {
  postId: string;
  title?: string;
  content?: string;
  excerpt?: string;
  imageUrl?: string | null;
  authorName?: string;
  authorRole?: string;
}) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, error: "Post not found" };

  let finalImageUrl = imageUrl;
  if (imageUrl && imageUrl.startsWith("data:image")) {
    finalImageUrl = await optimizeImage(imageUrl);
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(title ? { title: title.trim() } : {}),
      ...(content ? { content: content.replaceAll("\\n", "\n") } : {}),
      ...(excerpt ? { excerpt: excerpt.trim() } : {}),
      ...(finalImageUrl !== undefined ? { imageUrl: finalImageUrl } : {}),
      ...(authorName ? { authorName: authorName.trim() } : {}),
      ...(authorRole ? { authorRole: authorRole.trim() } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath(`/news/${post.slug}`);

  return { success: true, post: updated };
}

export async function publishPost(postId: string, draftId: string, slug: string, authorName?: string, authorRole?: string) {
  const existingPost = await prisma.post.findUnique({ where: { id: postId } });
  const cleanContent = existingPost ? existingPost.content.replaceAll("\\n", "\n") : undefined;

  let pubDate = new Date();
  if (existingPost?.articleDate) {
    pubDate = new Date(existingPost.articleDate + "T12:00:00Z");
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isDraft: false,
      publishedAt: pubDate,
      ...(authorName ? { authorName: authorName.trim() } : {}),
      ...(authorRole ? { authorRole: authorRole.trim() } : {}),
      ...(cleanContent ? { content: cleanContent } : {}),
    },
  });

  await prisma.draftQueue.update({
    where: { id: draftId },
    data: { status: "published", publishedSlug: slug },
  });

  revalidatePath("/");
  revalidatePath(`/news/${slug}`);

  return { success: true };
}

export async function getDraftsForDate(date: string) {
  const drafts = await prisma.draftQueue.findMany({
    where: { runDate: date },
    orderBy: { createdAt: "asc" },
  });

  const ingestRun = await prisma.ingestRun.findUnique({ where: { runDate: date } });

  return { drafts, ingestRunType: ingestRun?.runType ?? null };
}

export async function getGeneratedPreview(draftId: string) {
  const post = await prisma.post.findFirst({
    where: { draftId },
    orderBy: { updatedAt: "desc" },
  });

  if (!post) return null;

  return {
    postId: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    keyTakeaways: post.keyTakeaways,
    mythsAndFacts: post.mythsAndFacts,
    impactAnalysis: post.impactAnalysis,
    metaKeywords: post.metaKeywords,
    entities: post.entities,
    authorName: post.authorName,
    authorRole: post.authorRole,
    imageUrl: post.imageUrl,
    images: post.images,
    isDraft: post.isDraft,
  };
}

export async function generateCustomArticlePreview({
  rawNotes,
  articleDate,
  authorName,
  authorRole,
}: {
  rawNotes: string;
  articleDate: string;
  authorName?: string;
  authorRole?: string;
}) {
  const ai = getAI();
  const finalAuthorName = authorName && authorName.trim() ? authorName.trim() : "Himalayan Pulse Editorial Desk";
  const finalAuthorRole = authorRole && authorRole.trim() ? authorRole.trim() : "Senior Regional Editor";

  const result = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `User Raw News Notes:
${rawNotes}

Article Date: ${articleDate}`,
    config: {
      systemInstruction: `You are a senior editor for "Himalayan Pulse", a high-authority publication covering the Himalayan region (ecology, geology, infrastructure, culture, local communities).

The user has provided rough news notes in their own words. Transform these notes into a highly professional, well-structured, authoritative news article.

Structure:
- Title: Compelling, professional headline based on the notes.
- Key Takeaways: 3 concise bullet points for AI Overview / GEO extraction.
- Myths & Fact Checks: 2-3 myths/rumors or misconceptions regarding this issue, explicitly proving or busting them.
- Regional Impact Analysis: Concise breakdown explaining whether this news/development is overall GOOD or BAD for the region & local mountain communities, with clear Reasons Why.
- Article Body: 3-4 structured sections with ### headers. Write in clear, engaging, journalist-grade language. Bold critical figures, places, and dates.

Rules:
- Article date is ${articleDate}.
- Do not introduce unrelated global politics or celebrity topics.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          mythsAndFacts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          impactAnalysis: { type: Type.STRING },
          content: { type: Type.STRING },
          excerpt: { type: Type.STRING },
          metaKeywords: { type: Type.STRING },
          entities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["title", "keyTakeaways", "mythsAndFacts", "impactAnalysis", "content", "excerpt", "metaKeywords", "entities"],
      },
    },
  });

  const articleData = JSON.parse(result.text ?? "{}") as {
    title: string;
    keyTakeaways: string[];
    mythsAndFacts: string[];
    impactAnalysis: string;
    content: string;
    excerpt: string;
    metaKeywords: string;
    entities: string[];
  };

  const cleanContent = (articleData.content ?? "").replaceAll("\\n", "\n");

  const slug = articleData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Create a DraftQueue entry for this custom article
  const customDraft = await prisma.draftQueue.create({
    data: {
      runDate: articleDate,
      topic: articleData.title,
      synthesizedContext: rawNotes,
      mythsAndFacts: articleData.mythsAndFacts ?? [],
      impactAnalysis: articleData.impactAnalysis ?? null,
      sources: ["Editor Custom Submission"],
      status: "generated",
    },
  });

  const post = await prisma.post.create({
    data: {
      draftId: customDraft.id,
      title: articleData.title,
      slug,
      content: cleanContent,
      excerpt: articleData.excerpt,
      metaKeywords: articleData.metaKeywords,
      keyTakeaways: articleData.keyTakeaways,
      mythsAndFacts: articleData.mythsAndFacts ?? [],
      impactAnalysis: articleData.impactAnalysis ?? null,
      entities: articleData.entities,
      authorName: finalAuthorName,
      authorRole: finalAuthorRole,
      imageUrl: null,
      images: [],
      originalSources: ["Editor Custom Submission"],
      isDraft: true,
      articleDate,
    },
  });

  return {
    draft: {
      id: customDraft.id,
      topic: customDraft.topic,
      synthesizedContext: customDraft.synthesizedContext,
      mythsAndFacts: articleData.mythsAndFacts,
      impactAnalysis: articleData.impactAnalysis,
      sources: customDraft.sources,
      imageUrl: null,
      images: [],
      runDate: articleDate,
      status: "generated",
      publishedSlug: null,
      publishedTitle: null,
    },
    preview: {
      postId: post.id,
      slug: post.slug,
      title: articleData.title,
      excerpt: articleData.excerpt,
      content: cleanContent,
      keyTakeaways: articleData.keyTakeaways,
      mythsAndFacts: articleData.mythsAndFacts ?? [],
      impactAnalysis: articleData.impactAnalysis ?? "",
      metaKeywords: articleData.metaKeywords,
      entities: articleData.entities,
      authorName: post.authorName,
      authorRole: post.authorRole,
      imageUrl: post.imageUrl,
      images: post.images,
    },
  };
}

