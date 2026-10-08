"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatArticleContent } from "@/lib/formatContent";
import {
  getDraftsForDate,
  generateArticlePreview,
  publishPost,
  getGeneratedPreview,
  generateAIImage,
  updatePostImage,
  generateCustomArticlePreview,
  updatePublishedPost,
} from "@/app/actions/generateArticle";

// ── Types ──────────────────────────────────────────────────────────────────

interface DraftTopic {
  id: string;
  topic: string;
  synthesizedContext: string;
  mythsAndFacts?: string[];
  impactAnalysis?: string | null;
  sources: string[];
  imageUrl: string | null;
  images?: string[];
  runDate: string;
  status: string; // "draft" | "generated" | "published"
  publishedSlug: string | null;
  publishedTitle: string | null;
}

interface GeneratedPreview {
  postId: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  keyTakeaways: string[];
  mythsAndFacts?: string[];
  impactAnalysis?: string;
  metaKeywords: string;
  entities: string[];
  authorName?: string;
  authorRole?: string;
  imageUrl?: string | null;
  images?: string[];
  isDraft?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getTodayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ── Auth Gate ──────────────────────────────────────────────────────────────

function AuthGate({ onAuth }: { onAuth: (passphrase: string) => void }) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase }),
    });
    if (res.ok) {
      onAuth(passphrase);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] dark:bg-[#141210] text-[#1c1917] dark:text-[#f5f5f4] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-[#f5f4f0] dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#27272a] p-8 rounded-[2px]"
      >
        <div className="font-mono text-xs text-[#1e3a2b] dark:text-[#488263] uppercase tracking-wider mb-2 font-bold">
          Internal Portal Access
        </div>
        <h1 className="font-serif text-2xl font-bold mb-6">Himalayan Pulse Admin</h1>
        <label className="block text-xs font-mono text-[#78716c] dark:text-[#a1a1aa] mb-2">
          ADMIN_ACCESS_PASSPHRASE
        </label>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => { setPassphrase(e.target.value); setError(false); }}
          placeholder="Enter secure passphrase..."
          className="w-full px-3 py-2 bg-[#fcfbf9] dark:bg-[#141210] border border-[#d6d3d1] dark:border-[#3f3f46] text-sm text-[#1c1917] dark:text-[#f5f5f4] font-mono rounded-[2px] mb-2 focus:outline-none focus:border-[#1e3a2b]"
        />
        {error && (
          <p className="text-xs font-mono text-red-500 mb-4">Incorrect passphrase.</p>
        )}
        <button
          type="submit"
          className="w-full mt-4 py-2.5 bg-[#1e3a2b] hover:bg-[#264936] text-white font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors font-bold"
        >
          Authenticate Session
        </button>
      </form>
    </div>
  );
}

// ── Main Admin Page ────────────────────────────────────────────────────────

export default function AdminPage() {
  const today = getTodayIST();

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassphrase, setAuthPassphrase] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [drafts, setDrafts] = useState<DraftTopic[]>([]);
  const [ingestRunType, setIngestRunType] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftTopic | null>(null);
  const [adminViews, setAdminViews] = useState("");
  const [authorName, setAuthorName] = useState("Himalayan Pulse Editorial Desk");
  const [authorRole, setAuthorRole] = useState("Senior Regional Editor");
  const [preview, setPreview] = useState<GeneratedPreview | null>(null);
  const [showEditViews, setShowEditViews] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isIngestRunning, setIsIngestRunning] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"rss" | "custom">("rss");
  const [customNotes, setCustomNotes] = useState("");
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [isEditingPublishedText, setIsEditingPublishedText] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCustomGenerate = async () => {
    if (!customNotes.trim()) return;
    setIsGeneratingCustom(true);
    showBanner("Generating professional article from custom notes...", 15000);
    try {
      const res = await generateCustomArticlePreview({
        rawNotes: customNotes,
        articleDate: selectedDate,
        authorName,
        authorRole,
      });
      setDrafts((prev) => [res.draft as DraftTopic, ...prev]);
      setSelectedDraft(res.draft as DraftTopic);
      setPreview(res.preview as GeneratedPreview);
      showBanner("Custom article generated! Attach images & publish below.");
      setCustomNotes("");
    } catch {
      showBanner("Failed to generate custom article.");
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleDateContainerClick = () => {
    const el = dateInputRef.current;
    if (el) {
      try {
        if (typeof (el as unknown as { showPicker?: () => void }).showPicker === "function") {
          (el as unknown as { showPicker: () => void }).showPicker();
        } else {
          el.focus();
        }
      } catch {
        el.focus();
      }
    }
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !preview) return;

    if (!file.type.startsWith("image/")) {
      showBanner("Error: Selected file is not an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showBanner("Error: Image file size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      if (base64Url) {
        showBanner("Uploading local image...", 10000);
        try {
          const updateRes = await updatePostImage(preview.postId, base64Url);
          if (updateRes.success) {
            setPreview({
              ...preview,
              imageUrl: base64Url,
              images: updateRes.images,
            });
            showBanner("Local image uploaded and attached to article!");
          }
        } catch {
          showBanner("Failed to attach local image.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Load drafts whenever date changes
  const loadDrafts = useCallback(
    async (date: string) => {
      try {
        const result = await getDraftsForDate(date);
        const fetchedDrafts = result.drafts as DraftTopic[];
        setDrafts(fetchedDrafts);
        setIngestRunType(result.ingestRunType);
        const initialDraft = fetchedDrafts[0] ?? null;
        setSelectedDraft(initialDraft);
        setPreview(null);
        setAdminViews("");
        setShowEditViews(false);

        if (initialDraft && initialDraft.status === "generated") {
          const prev = await getGeneratedPreview(initialDraft.id);
          if (prev) {
            setPreview(prev as GeneratedPreview);
            if (prev.authorName) setAuthorName(prev.authorName);
            if (prev.authorRole) setAuthorRole(prev.authorRole);
          }
        }
      } catch {
        setDrafts([]);
        setIngestRunType(null);
        setSelectedDraft(null);
        setPreview(null);
        setShowEditViews(false);
      }
    },
    []
  );

  const refreshDrafts = async (date: string) => {
    try {
      const result = await getDraftsForDate(date);
      setDrafts(result.drafts as DraftTopic[]);
      setIngestRunType(result.ingestRunType);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadDrafts(selectedDate);
  }, [isAuthenticated, selectedDate, loadDrafts]);

  const handleDateChange = (dateStr: string) => {
    if (dateStr > today) return; // block future dates
    setSelectedDate(dateStr);
  };

  const showBanner = (msg: string, durationMs = 5000) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), durationMs);
  };

  // Manual ingest — only shown if no cron ran for this date
  const handleManualIngest = async () => {
    setIsIngestRunning(true);
    showBanner(`Running RSS fetch & Gemini clustering for ${selectedDate}...`, 60000);
    try {
      const res = await fetch("/api/cron/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase: authPassphrase, date: selectedDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        showBanner(`Error: ${data.error ?? "Ingest failed"}`);
      } else {
        showBanner(`Ingest complete for ${selectedDate}: ${data.draftsCreated} topics saved.`);
        await loadDrafts(selectedDate);
      }
    } catch {
      showBanner("Network error during ingest.");
    } finally {
      setIsIngestRunning(false);
    }
  };

  // Generate article from draft + admin views
  const handleGenerate = () => {
    if (!selectedDraft || !adminViews.trim()) return;
    startTransition(async () => {
      showBanner("Generating professional article with Gemini...", 60000);
      try {
        const result = await generateArticlePreview({
          draftId: selectedDraft.id,
          topic: selectedDraft.topic,
          synthesizedContext: selectedDraft.synthesizedContext,
          mythsAndFacts: selectedDraft.mythsAndFacts,
          impactAnalysis: selectedDraft.impactAnalysis ?? undefined,
          sources: selectedDraft.sources,
          imageUrl: selectedDraft.imageUrl ?? undefined,
          images: selectedDraft.images,
          adminViews,
          articleDate: selectedDate,
          authorName,
          authorRole,
        });
        setPreview(result as GeneratedPreview);
        setShowEditViews(false);
        await refreshDrafts(selectedDate);
        showBanner("Article generated with myth-busting & impact analysis. Review and publish!");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        showBanner(`Generation failed: ${message}`);
      }
    });
  };

  // Generate AI Image
  const handleGenerateAIImage = async () => {
    if (!selectedDraft || !preview) return;
    setIsGeneratingImage(true);
    showBanner("Generating editorial AI image with Vertex AI Imagen...", 60000);
    try {
      const res = await generateAIImage({ prompt: selectedDraft.topic });
      if (res.imageUrl) {
        const updateRes = await updatePostImage(preview.postId, res.imageUrl);
        if (updateRes.success) {
          setPreview({
            ...preview,
            imageUrl: res.imageUrl,
            images: updateRes.images,
          });
          showBanner("AI Image generated and attached to article!");
        }
      }
    } catch {
      showBanner("AI Image generation failed.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Update published article
  const handleUpdatePublished = () => {
    if (!preview) return;
    startTransition(async () => {
      showBanner("Updating published article live on site...", 60000);
      try {
        const res = await updatePublishedPost({
          postId: preview.postId,
          title: editTitle.trim() || preview.title,
          content: editContent.trim() || preview.content,
          authorName,
          authorRole,
          imageUrl: preview.imageUrl,
        });
        if (res.success && res.post) {
          setPreview({
            ...preview,
            title: res.post.title,
            content: res.post.content,
          });
          setIsEditingPublishedText(false);
          await loadDrafts(selectedDate);
          showBanner("Published article updated live on site!");
        }
      } catch {
        showBanner("Failed to update published article.");
      }
    });
  };

  // Publish the generated article
  const handlePublish = () => {
    if (!preview || !selectedDraft) return;
    startTransition(async () => {
      showBanner("Publishing article...", 60000);
      try {
        await publishPost(preview.postId, selectedDraft.id, preview.slug, authorName, authorRole);
        setPreview(null);
        setAdminViews("");
        setShowEditViews(false);
        setIsEditingPublishedText(false);
        await loadDrafts(selectedDate);
        showBanner("Article published successfully. Live on public site!");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        showBanner(`Publish failed: ${message}`);
      }
    });
  };

  // Pick a draft — load preview if already generated or published
  const selectDraft = async (draft: DraftTopic) => {
    setSelectedDraft(draft);
    setPreview(null);
    setAdminViews("");
    setShowEditViews(false);
    setIsEditingPublishedText(false);

    if (draft.status === "generated" || draft.status === "published") {
      const prev = await getGeneratedPreview(draft.id);
      if (prev) {
        setPreview(prev as GeneratedPreview);
        setEditTitle(prev.title);
        setEditContent(prev.content);
        if (prev.authorName) setAuthorName(prev.authorName);
        if (prev.authorRole) setAuthorRole(prev.authorRole);
      }
    }
  };

  if (!isAuthenticated) {
    return <AuthGate onAuth={(passphrase) => {
      setAuthPassphrase(passphrase);
      setIsAuthenticated(true);
    }} />;
  }

  const canManualIngest = ingestRunType === null || ingestRunType === "manual";
  const cronRan = ingestRunType === "cron";

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1c1917] dark:bg-[#141210] dark:text-[#f5f5f4] transition-colors duration-200">
      {/* HEADER */}
      <header className="border-b border-[#e7e5e4] dark:border-[#27272a] bg-[#fcfbf9] dark:bg-[#141210] px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
          <Link href="/" className="font-serif text-lg sm:text-xl font-bold tracking-tight">
            The Himalayan Pulse
          </Link>
          <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 bg-[#1e3a2b] text-white rounded-[2px] font-bold uppercase tracking-wider">
            Editorial Desk
          </span>
        </div>

        {/* DATE PICKER & ACTIONS BAR */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4">
          <div
            onClick={handleDateContainerClick}
            className="flex items-center gap-2 sm:gap-3 bg-[#f5f4f0] dark:bg-[#1c1917] border border-[#d6d3d1] dark:border-[#3f3f46] px-3 py-2 sm:py-1.5 min-h-[40px] rounded-[2px] cursor-pointer hover:border-[#1e3a2b] transition-colors"
          >
            <svg className="w-4 h-4 text-[#1e3a2b] dark:text-[#488263]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-mono font-bold text-[#78716c] dark:text-[#a1a1aa] uppercase select-none">Date:</span>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#1c1917] dark:text-[#f5f5f4] focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
            {!cronRan && (
              <button
                onClick={handleManualIngest}
                disabled={isIngestRunning || selectedDate > today}
                className="px-3 py-2 sm:py-1.5 min-h-[40px] bg-[#f5f4f0] hover:bg-[#e7e5e4] dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-[#1c1917] dark:text-[#f5f5f4] border border-[#d6d3d1] dark:border-[#3f3f46] rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                {isIngestRunning ? "⏳ Ingesting..." : `⚡ Ingest for ${selectedDate}`}
              </button>
            )}
            {cronRan && (
              <span className="px-3 py-2 sm:py-1.5 min-h-[40px] flex items-center bg-[#f5f4f0] dark:bg-[#1c1917] border border-[#d6d3d1] dark:border-[#3f3f46] rounded-[2px] text-[#1e3a2b] dark:text-[#86efac] font-bold">
                ✓ Cron ran
              </span>
            )}

            <Link href="/" className="text-[#1e3a2b] dark:text-[#488263] uppercase font-bold hover:underline py-2">
              Public Site →
            </Link>
          </div>
        </div>
      </header>

      {/* STATUS BANNER */}
      {statusBanner && (
        <div className="bg-[#1e3a2b] text-white px-4 sm:px-6 py-2.5 text-xs font-mono border-b border-[#276e47] flex justify-between items-center">
          <span className="truncate">{statusBanner}</span>
          <button onClick={() => setStatusBanner(null)} className="opacity-70 hover:opacity-100 ml-4 shrink-0 p-1">✕</button>
        </div>
      )}

      {/* WORKSPACE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        {/* LEFT: DRAFT QUEUE */}
        <section className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-baseline border-b border-[#e7e5e4] dark:border-[#27272a] pb-3">
            <h2 className="font-mono text-xs uppercase text-[#78716c] dark:text-[#a1a1aa] tracking-wider font-bold">
              1. Ingest & Write ({formatDate(selectedDate)})
            </h2>
            <span className="text-xs font-mono text-[#78716c]">{drafts.length} Topics</span>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-[#f5f4f0] dark:bg-[#1c1917] p-1 border border-[#e7e5e4] dark:border-[#27272a] rounded-[2px] font-mono text-xs">
            <button
              onClick={() => setActiveTab("rss")}
              className={`py-1.5 text-center rounded-[2px] font-bold transition-colors ${
                activeTab === "rss"
                  ? "bg-[#1e3a2b] text-white shadow-xs"
                  : "text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]"
              }`}
            >
              RSS News Drafts
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`py-1.5 text-center rounded-[2px] font-bold transition-colors ${
                activeTab === "custom"
                  ? "bg-[#1e3a2b] text-white shadow-xs"
                  : "text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]"
              }`}
            >
              ✍️ Custom Article
            </button>
          </div>

          {activeTab === "custom" ? (
            <div className="p-4 bg-[#fcfbf9] dark:bg-[#1c1917] border border-[#d6d3d1] dark:border-[#3f3f46] rounded-[2px] space-y-4">
              <div className="text-xs font-mono font-bold uppercase text-[#1e3a2b] dark:text-[#86efac]">
                Write News in Your Words
              </div>
              <p className="text-xs text-[#78716c]">
                Enter your raw notes below. Gemini will transform them into a professional article structure.
              </p>
              <textarea
                rows={6}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Enter your raw news notes, quotes, or outline..."
                className="w-full p-3 bg-[#fcfbf9] dark:bg-[#0f0e0d] border border-[#d6d3d1] dark:border-[#3f3f46] text-base sm:text-xs text-[#1c1917] dark:text-[#f5f5f4] font-mono rounded-[2px] focus:outline-none focus:border-[#1e3a2b] resize-none"
              />
              <button
                onClick={handleCustomGenerate}
                disabled={isGeneratingCustom || !customNotes.trim()}
                className="w-full py-3 min-h-[44px] bg-[#1e3a2b] hover:bg-[#264936] text-white font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors flex justify-center items-center gap-2 font-bold disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingCustom ? "⚡ Transforming with AI..." : "⚡ Generate Custom Article →"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
            {drafts.length > 0 ? (
              drafts.map((draft) => {
                const isSelected = selectedDraft?.id === draft.id;
                const isPublished = draft.status === "published";
                const isGenerated = draft.status === "generated";
                return (
                  <div
                    key={draft.id}
                    onClick={() => selectDraft(draft)}
                    className={`p-5 border rounded-[2px] transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#f5f4f0] dark:bg-[#1c1917] border-[#1e3a2b] dark:border-[#488263] shadow-xs"
                        : "bg-[#fcfbf9] dark:bg-[#141210] border-[#e7e5e4] dark:border-[#27272a] hover:border-[#d6d3d1]"
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-mono text-[#78716c] mb-2">
                      <span>{ingestRunType === "cron" ? "Cron" : "Manual"} · {formatDate(draft.runDate)}</span>
                      {isPublished ? (
                        <span className="text-[#1e3a2b] dark:text-[#86efac] font-bold uppercase">✓ Published (Editable)</span>
                      ) : isGenerated ? (
                        <span className="text-blue-600 dark:text-blue-400 font-bold uppercase">Generated</span>
                      ) : (
                        <span className="text-[#b45309] dark:text-amber-400 font-bold uppercase">Draft</span>
                      )}
                    </div>

                    <h3 className="font-serif text-base font-bold text-[#1c1917] dark:text-[#f5f5f4] mb-2 leading-snug">
                      {draft.topic}
                    </h3>

                    <p className="text-xs font-serif text-[#57534e] dark:text-[#a1a1aa] line-clamp-3 leading-relaxed mb-3">
                      {draft.synthesizedContext}
                    </p>

                    {isPublished && draft.publishedSlug && (
                      <div className="mb-2">
                        <Link
                          href={`/news/${draft.publishedSlug}`}
                          className="text-xs font-mono text-[#1e3a2b] dark:text-[#488263] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View published article →
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-mono pt-3 mt-1 border-t border-[#e7e5e4] dark:border-[#27272a]">
                      <span className="text-[#78716c]">{draft.sources.length} Sources</span>
                      <span className={isSelected ? "text-[#1e3a2b] dark:text-[#86efac] font-bold" : "text-[#78716c]"}>
                        {isSelected ? "Selected →" : "Select to Edit"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 border border-dashed border-[#d6d3d1] dark:border-[#27272a] text-center text-xs font-mono text-[#78716c] space-y-2">
                <p>No drafts for {formatDate(selectedDate)}.</p>
                {!cronRan && canManualIngest && (
                  <p>Click "Ingest for {selectedDate}" to fetch and cluster news.</p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

        {/* RIGHT: WORKBENCH */}
        <section className="lg:col-span-8 space-y-8">

          {/* STEP 3: PREVIEW (Show at top when generated) */}
          {preview ? (
            <div className="bg-[#f5f4f0] dark:bg-[#141210] border border-[#1e3a2b] dark:border-[#488263] p-6 rounded-[2px] space-y-6">
              <div className="flex justify-between items-center border-b border-[#e7e5e4] dark:border-[#27272a] pb-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-mono text-xs uppercase text-[#1e3a2b] dark:text-[#86efac] tracking-wider font-bold">
                    3. Article Preview ({formatDate(selectedDate)})
                  </h2>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold uppercase rounded-[2px]">
                    Ready to Publish
                  </span>
                </div>
                <button
                  onClick={() => setShowEditViews(!showEditViews)}
                  className="text-xs font-mono text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] underline"
                >
                  {showEditViews ? "Hide Views Form ▲" : "✏️ Edit Views & Regenerate ▼"}
                </button>
              </div>

              {/* Collapsible Edit Views Form */}
              {showEditViews && selectedDraft && selectedDraft.status !== "published" && (
                <div className="p-4 bg-[#fcfbf9] dark:bg-[#1c1917] border border-[#d6d3d1] dark:border-[#3f3f46] rounded-[2px] space-y-4 mb-4">
                  <div className="text-xs font-mono font-bold uppercase text-[#1e3a2b] dark:text-[#86efac]">
                    Edit Personal Views & Regenerate
                  </div>
                  <textarea
                    rows={4}
                    value={adminViews}
                    onChange={(e) => setAdminViews(e.target.value)}
                    placeholder="Update your personal views or angle..."
                    className="w-full p-3 bg-[#fcfbf9] dark:bg-[#0f0e0d] border border-[#d6d3d1] dark:border-[#3f3f46] text-sm text-[#1c1917] dark:text-[#f5f5f4] font-serif rounded-[2px] focus:outline-none focus:border-[#1e3a2b] resize-none"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={isPending || !adminViews.trim()}
                    className="w-full py-2.5 bg-[#1e3a2b] hover:bg-[#264936] text-white font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors flex justify-center items-center gap-2 font-bold disabled:opacity-50"
                  >
                    {isPending ? "Regenerating..." : "Regenerate Article with New Views →"}
                  </button>
                </div>
              )}

              {/* Image Manager & AI Generator */}
              <div className="p-4 bg-[#fcfbf9] dark:bg-[#1c1917] border border-[#d6d3d1] dark:border-[#3f3f46] rounded-[2px] space-y-3">
                <div className="flex justify-between items-center text-xs font-mono font-bold uppercase text-[#78716c]">
                  <span>Article Image & Media Gallery</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLocalImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-[#e7e5e4] dark:bg-[#27272a] hover:bg-[#d6d3d1] dark:hover:bg-[#3f3f46] text-[#1c1917] dark:text-[#f5f5f4] text-[11px] font-mono rounded-[2px] transition-colors font-bold"
                    >
                      📁 Upload Image
                    </button>
                    <button
                      onClick={handleGenerateAIImage}
                      disabled={isGeneratingImage}
                      className="px-3 py-1 bg-[#1e3a2b] hover:bg-[#264936] text-white text-[11px] font-mono rounded-[2px] transition-colors font-bold disabled:opacity-50"
                    >
                      {isGeneratingImage ? "⏳ Generating AI Image..." : "✨ Generate AI Image"}
                    </button>
                  </div>
                </div>

                {preview.imageUrl ? (
                  <div className="relative aspect-video w-full max-h-64 overflow-hidden rounded-[2px] border border-[#d6d3d1]">
                    <img src={preview.imageUrl} alt="Featured" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 text-white text-[10px] font-mono font-bold">
                      Primary Featured Image
                    </span>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-[#d6d3d1] text-center text-xs font-mono text-[#78716c]">
                    No image attached yet. Click "Generate AI Image" to create one.
                  </div>
                )}

                {preview.images && preview.images.length > 1 && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] font-mono text-[#78716c] uppercase">Available Images (Click to set primary):</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {preview.images.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={imgUrl}
                          alt={`Source ${i}`}
                          className={`w-20 h-14 object-cover border rounded-[2px] cursor-pointer ${
                            preview.imageUrl === imgUrl ? "border-2 border-[#1e3a2b]" : "border-[#e7e5e4] opacity-70 hover:opacity-100"
                          }`}
                          onClick={async () => {
                            const updateRes = await updatePostImage(preview.postId, imgUrl);
                            if (updateRes.success) {
                              setPreview({ ...preview, imageUrl: imgUrl });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Takeaways */}
              <div className="p-5 bg-[#fcfbf9] dark:bg-[#1c1917] border border-[#1e3a2b] space-y-2">
                <div className="text-xs font-mono font-bold uppercase text-[#1e3a2b] dark:text-[#86efac]">
                  Key Takeaways (GEO Block)
                </div>
                <ul className="list-disc list-inside text-xs font-serif text-[#44403c] dark:text-[#d4d4d8] space-y-1">
                  {preview.keyTakeaways.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>

              {/* Myth Busting Section */}
              {preview.mythsAndFacts && preview.mythsAndFacts.length > 0 && (
                <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-600 dark:border-amber-400 space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-amber-900 dark:text-amber-300">
                    ⚡ Myth Busting & Fact Check
                  </div>
                  <ul className="list-disc list-inside text-xs font-serif text-amber-950 dark:text-amber-200 space-y-1">
                    {preview.mythsAndFacts.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Factual Impact Analysis Section */}
              {preview.impactAnalysis && (
                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600 dark:border-emerald-400 space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-emerald-900 dark:text-emerald-300">
                    🔍 Regional Impact Assessment (Good or Bad for Himalayas?)
                  </div>
                  <p className="text-xs font-serif text-emerald-950 dark:text-emerald-200 leading-relaxed">
                    {preview.impactAnalysis}
                  </p>
                </div>
              )}

              {/* Article body with ReactMarkdown or Editable Textarea */}
              <div className="p-8 bg-[#fcfbf9] dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#27272a] rounded-[2px] space-y-4">
                <div className="text-xs font-mono text-[#78716c] uppercase border-b border-[#e7e5e4] dark:border-[#27272a] pb-2 flex justify-between items-center">
                  <span>{selectedDraft?.status === "published" ? "Published Article — Reader View" : "Public Reader View Preview"}</span>
                  <span className="text-[#1e3a2b] dark:text-[#86efac] font-bold">By {preview.authorName || authorName} ({preview.authorRole || authorRole})</span>
                </div>

                {isEditingPublishedText ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-[#78716c] mb-1">Article Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full p-2.5 bg-[#fcfbf9] dark:bg-[#0f0e0d] border border-[#d6d3d1] dark:border-[#3f3f46] text-base font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] rounded-[2px] focus:outline-none focus:border-[#1e3a2b]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-[#78716c] mb-1">Article Markdown Body</label>
                      <textarea
                        rows={14}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 bg-[#fcfbf9] dark:bg-[#0f0e0d] border border-[#d6d3d1] dark:border-[#3f3f46] text-xs font-mono text-[#1c1917] dark:text-[#f5f5f4] rounded-[2px] focus:outline-none focus:border-[#1e3a2b]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="font-serif text-2xl font-bold">{preview.title}</h1>
                    <p className="text-sm font-serif text-[#57534e] dark:text-[#a1a1aa] italic mb-6">{preview.excerpt}</p>
                    <div className="prose prose-stone dark:prose-invert max-w-none prose-a:text-[#1e3a2b] dark:prose-a:text-[#488263] prose-strong:text-[#1c1917] dark:prose-strong:text-[#f5f5f4] prose-strong:font-bold">
                      <ReactMarkdown
                        components={{
                          h2: ({ node, ...props }) => (
                            <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] mt-8 mb-3 border-b border-[#e7e5e4] dark:border-[#27272a] pb-1" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-lg font-serif font-bold text-[#1e3a2b] dark:text-[#86efac] mt-6 mb-2" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-5 leading-relaxed text-[#292524] dark:text-[#e7e5e4] text-sm font-serif" {...props} />
                          ),
                        }}
                      >
                        {formatArticleContent(preview.content)}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </div>

              {/* Meta */}
              <div className="text-xs font-mono text-[#78716c] space-y-1">
                <div>Byline: <span className="text-[#1c1917] dark:text-[#f5f5f4]">{preview.authorName || authorName} ({preview.authorRole || authorRole})</span></div>
                <div>Keywords: <span className="text-[#1c1917] dark:text-[#f5f5f4]">{preview.metaKeywords}</span></div>
                <div>Entities: <span className="text-[#1c1917] dark:text-[#f5f5f4]">{preview.entities.join(", ")}</span></div>
                <div>Canonical: <code className="text-[#1c1917] dark:text-[#f5f5f4]">/news/{preview.slug}</code></div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-[#e7e5e4] dark:border-[#27272a] flex justify-between items-center">
                {selectedDraft?.status === "published" ? (
                  <>
                    <button
                      onClick={() => setIsEditingPublishedText(!isEditingPublishedText)}
                      className="px-4 py-2 text-xs font-mono border border-[#d6d3d1] dark:border-[#3f3f46] text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] rounded-[2px] transition-colors"
                    >
                      {isEditingPublishedText ? "👁️ Preview Changes" : "✏️ Edit Text / Title"}
                    </button>
                    <button
                      onClick={handleUpdatePublished}
                      disabled={isPending}
                      className="px-6 py-2.5 bg-[#1e3a2b] hover:bg-[#264936] text-white font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors font-bold disabled:opacity-50"
                    >
                      {isPending ? "Updating..." : "💾 Save Published Updates →"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowEditViews(!showEditViews)}
                      className="px-4 py-2 text-xs font-mono border border-[#d6d3d1] dark:border-[#3f3f46] text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] rounded-[2px] transition-colors"
                    >
                      ✏️ Edit Views & Regenerate
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isPending}
                      className="px-6 py-2.5 bg-[#1e3a2b] hover:bg-[#264936] text-white font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors font-bold disabled:opacity-50"
                    >
                      {isPending ? "Publishing..." : "Publish Article →"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* STEP 2: WRITE VIEWS (Show when not generated yet) */
            <div className="bg-[#f5f4f0] dark:bg-[#141210] border border-[#e7e5e4] dark:border-[#27272a] p-6 rounded-[2px] space-y-6">
              <div className="border-b border-[#e7e5e4] dark:border-[#27272a] pb-3">
                <h2 className="font-mono text-xs uppercase text-[#1e3a2b] dark:text-[#86efac] tracking-wider font-bold">
                  2. Your Views & Angle ({formatDate(selectedDate)})
                </h2>
                <p className="text-xs font-mono text-[#78716c] mt-1">
                  Write your personal take. Gemini will elevate it to professional journalism while keeping your voice.
                </p>
              </div>

              {selectedDraft && selectedDraft.status !== "published" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#78716c] uppercase mb-1 font-bold">
                      Topic
                    </label>
                    <div className="p-4 bg-[#fcfbf9] dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#27272a] text-base font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4]">
                      {selectedDraft.topic}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#78716c] uppercase mb-1 font-bold">
                      AI Research Summary (from {selectedDraft.sources.length} sources)
                    </label>
                    <div className="p-4 bg-[#fcfbf9] dark:bg-[#1c1917] border border-[#e7e5e4] dark:border-[#27272a] text-xs font-serif text-[#44403c] dark:text-[#a1a1aa] leading-relaxed">
                      {selectedDraft.synthesizedContext}
                    </div>
                  </div>

                  {/* Author / Editor Name & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-[#78716c] uppercase mb-1 font-bold">
                        Editor / Publisher Name *
                      </label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="e.g. Prakhar Negi"
                        className="w-full p-2.5 bg-[#fcfbf9] dark:bg-[#0f0e0d] border border-[#d6d3d1] dark:border-[#3f3f46] text-xs font-serif text-[#1c1917] dark:text-[#f5f5f4] rounded-[2px] focus:outline-none focus:border-[#1e3a2b]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-[#78716c] uppercase mb-1 font-bold">
                        Editor Designation / Role
                      </label>
                      <input
                        type="text"
                        value={authorRole}
                        onChange={(e) => setAuthorRole(e.target.value)}
                        placeholder="e.g. Senior Regional Editor"
                        className="w-full p-2.5 bg-[#fcfbf9] dark:bg-[#0f0e0d] border border-[#d6d3d1] dark:border-[#3f3f46] text-xs font-serif text-[#1c1917] dark:text-[#f5f5f4] rounded-[2px] focus:outline-none focus:border-[#1e3a2b]"
                      />
                    </div>
                  </div>

                  {selectedDraft.mythsAndFacts && selectedDraft.mythsAndFacts.length > 0 && (
                    <div>
                      <label className="block text-xs font-mono text-amber-800 dark:text-amber-400 uppercase mb-1 font-bold">
                        ⚡ Myths & Misconceptions to Address
                      </label>
                      <ul className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-serif text-amber-950 dark:text-amber-200 space-y-1 list-disc list-inside">
                        {selectedDraft.mythsAndFacts.map((mf, i) => (
                          <li key={i}>{mf}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedDraft.impactAnalysis && (
                    <div>
                      <label className="block text-xs font-mono text-emerald-800 dark:text-emerald-400 uppercase mb-1 font-bold">
                        🔍 Initial Regional Impact Assessment
                      </label>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-serif text-emerald-950 dark:text-emerald-200 leading-relaxed">
                        {selectedDraft.impactAnalysis}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-[#1e3a2b] dark:text-[#86efac] uppercase mb-1 font-bold">
                      Your Views / Perspective *
                    </label>
                    <textarea
                      rows={5}
                      value={adminViews}
                      onChange={(e) => setAdminViews(e.target.value)}
                      placeholder="Write your personal angle, opinion, or perspective on this story. Don't worry about being polished — Gemini will handle the professional writing while keeping your voice and views intact..."
                      className="w-full p-3 bg-[#fcfbf9] dark:bg-[#0f0e0d] border border-[#d6d3d1] dark:border-[#3f3f46] text-sm text-[#1c1917] dark:text-[#f5f5f4] font-serif rounded-[2px] focus:outline-none focus:border-[#1e3a2b] resize-none"
                    />
                    {!adminViews.trim() && (
                      <p className="text-xs font-mono text-[#b45309] mt-1">Your views are required to generate the article.</p>
                    )}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isPending || !adminViews.trim()}
                    className="w-full py-3 bg-[#1e3a2b] hover:bg-[#264936] text-white font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors flex justify-center items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Generating Article with Myth Busting & Impact Analysis...</span>
                      </>
                    ) : (
                      <span>Generate Professional Article →</span>
                    )}
                  </button>
                </div>
              ) : selectedDraft?.status === "published" ? (
                <div className="p-8 text-center text-xs font-mono text-[#1e3a2b] dark:text-[#86efac]">
                  ✓ This article has been published. Select another draft to continue.
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-mono text-[#78716c]">
                  Select a draft from the queue on the left.
                </div>
              )}
            </div>
          )}

        </section>
      </div>
    </div>
  );
}

