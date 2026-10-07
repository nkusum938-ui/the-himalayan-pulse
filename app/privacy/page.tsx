import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-xs font-mono text-[#78716c] mb-8">
          Last updated: October 2026
        </p>

        <section className="space-y-6 text-sm text-[#44403c] dark:text-[#d6d3d1] font-serif leading-relaxed">
          <p>
            At The Himalayan Pulse, we respect your privacy. This Privacy Policy outlines the types of information we collect when you visit our website and how we handle and protect that information.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            1. Information We Collect
          </h2>
          <p>
            We collect minimal personal data. If you subscribe to our newsletter, we store your email address solely for the purpose of dispatching our periodic news updates. Local preferences (such as bookmarked articles) are stored locally in your browser (localStorage) and never transmitted to our servers.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            2. Cookies & Analytics
          </h2>
          <p>
            We may use basic analytical tools to understand aggregate reader traffic (such as total page views and general regional demographics). We do not track individual users across third-party websites.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            3. Data Sharing
          </h2>
          <p>
            We do not sell, rent, or lease subscriber email addresses or personal information to third parties under any circumstances.
          </p>

          <h2 className="text-xl font-serif font-bold text-[#1c1917] dark:text-[#f5f5f4] pt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
            4. Contact Us
          </h2>
          <p>
            For privacy inquiries or to request removal of your email from our newsletter list, please contact us at editor@thehimalayanpulse.com.
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
