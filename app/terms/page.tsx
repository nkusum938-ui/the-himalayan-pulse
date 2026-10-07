import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1c1917] dark:bg-[#141210] dark:text-[#f5f5f4] selection:bg-[#1e3a2b] selection:text-white transition-colors duration-200">
      <header className="border-b border-[#e7e5e4] dark:border-[#27272a] bg-[#fcfbf9] dark:bg-[#141210] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#1c1917] dark:text-[#f5f5f4]">
            The Himalayan Pulse
          </Link>
          <Link href="/" className="font-mono text-xs text-[#1e3a2b] dark:text-[#488263] uppercase hover:underline">
            ← Back to News
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4 text-[#1c1917] dark:text-[#f5f5f4]">
          Terms of Service
        </h1>
        <p className="text-xs font-mono text-[#78716c] mb-8">
          Last updated: October 2026
        </p>

        <section className="space-y-6 text-sm text-[#44403c] dark:text-[#d6d3d1] font-serif leading-relaxed">
          <p>
            Welcome to The Himalayan Pulse. By accessing or using our platform, you agree to comply with and be bound by the following terms and conditions.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            1. Intellectual Property
          </h2>
          <p>
            All original articles, commentary, and media produced by The Himalayan Pulse are protected under copyright laws. You may quote or reference short passages with proper attribution and a direct link back to the source.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            2. Content Accuracy & Disclaimer
          </h2>
          <p>
            While we strive for complete factual accuracy, news reports on natural events, mountain weather, and regional incidents are subject to real-time updates. Content is provided for informational purposes.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            3. User Conduct
          </h2>
          <p>
            Readers using interactive tools or submitting inquiries are expected to maintain respectful conduct. We reserve the right to restrict access to anyone violating civil discourse guidelines.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            4. Amendments
          </h2>
          <p>
            We reserve the right to update these terms at any time. Continued use of the website constitutes acceptance of updated terms.
          </p>
        </section>
      </main>

      <footer className="mt-20 border-t border-[#e7e5e4] dark:border-[#27272a] bg-[#f5f4f0] dark:bg-[#141210] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#78716c] font-mono">
          <div>© 2026 The Himalayan Pulse. All rights reserved.</div>
          <div className="flex gap-4">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
