import Link from "next/link";

export default function ContactPage() {
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
          Contact & Press Inquiries
        </h1>
        <p className="text-lg font-serif text-[#44403c] dark:text-[#d6d3d1] leading-relaxed mb-8">
          We welcome news tips, ground reports, photo submissions, and editorial corrections from across the Himalayan region.
        </p>

        <div className="space-y-8 text-sm font-serif">
          <div className="p-6 border border-[#e7e5e4] dark:border-[#27272a] bg-[#f5f4f0]/50 dark:bg-[#1c1917]/50 rounded-[2px]">
            <h2 className="text-lg font-bold font-serif text-[#1c1917] dark:text-[#f5f5f4] mb-2">
              Editorial Desk & News Tips
            </h2>
            <p className="text-[#44403c] dark:text-[#d6d3d1] mb-3">
              To send news tips, pitch stories, or report factual errors:
            </p>
            <div className="font-mono text-xs text-[#1e3a2b] dark:text-[#488263] font-bold">
              editor@thehimalayanpulse.com
            </div>
          </div>

          <div className="p-6 border border-[#e7e5e4] dark:border-[#27272a] bg-[#f5f4f0]/50 dark:bg-[#1c1917]/50 rounded-[2px]">
            <h2 className="text-lg font-bold font-serif text-[#1c1917] dark:text-[#f5f5f4] mb-2">
              General Inquiries
            </h2>
            <p className="text-[#44403c] dark:text-[#d6d3d1] mb-3">
              For general questions, newsletter support, or feedback:
            </p>
            <div className="font-mono text-xs text-[#1e3a2b] dark:text-[#488263] font-bold">
              contact@thehimalayanpulse.com
            </div>
          </div>

          <div className="pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            <h3 className="font-bold text-[#1c1917] dark:text-[#f5f5f4] mb-2">Location Scope</h3>
            <p className="text-[#78716c] text-xs font-mono">
              Uttarakhand • Himachal Pradesh • Ladakh • Jammu & Kashmir • Sikkim • Nepal • Bhutan • Arunachal Pradesh
            </p>
          </div>
        </div>
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
