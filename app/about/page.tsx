import Link from "next/link";

export default function AboutPage() {
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
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-6 text-[#1c1917] dark:text-[#f5f5f4]">
          About The Himalayan Pulse
        </h1>
        <p className="text-lg font-serif text-[#44403c] dark:text-[#d6d3d1] leading-relaxed mb-6">
          The Himalayan Pulse is an independent digital publication dedicated to chronicling news, community stories, environmental reports, and cultural developments across the entire Himalayan belt.
        </p>

        <section className="space-y-6 text-sm text-[#44403c] dark:text-[#d6d3d1] font-serif leading-relaxed">
          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            Our Mission
          </h2>
          <p>
            Mountain regions are often underrepresented in mainstream national discourse despite being at the front lines of climate change, eco-tourism, and rapid infrastructure expansion. Our mission is to deliver calm, factual, and deeply rooted journalism from Uttarakhand, Himachal Pradesh, Ladakh, Jammu & Kashmir, Sikkim, Nepal, Bhutan, and Arunachal Pradesh.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            Editorial Standards
          </h2>
          <p>
            We adhere strictly to verification, factual accuracy, and unbiased reporting. We aim to present local perspectives with clarity, free from sensationalism or visual clutter.
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
