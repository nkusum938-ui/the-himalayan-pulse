"use client";

import { useState } from "react";

export function NewsletterSubscribe() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section id="newsletter" className="border-t border-b border-[#1c1917]/15 dark:border-[#f5f5f4]/15 py-10 my-12 bg-[#f5f4f0]/30 dark:bg-[#141210]/30 scroll-mt-8">
      <div className="max-w-md mx-auto text-center px-4">
        <h3 className="font-serif text-xl font-bold text-[#1c1917] dark:text-[#f5f5f4] mb-1">
          Daily Mountain Dispatch
        </h3>
        <p className="text-xs text-[#57534e] dark:text-[#a1a1aa] font-serif mb-5 leading-relaxed">
          One quiet daily summary of Himalayan ecology, community reports, and field investigations.
        </p>
        
        {submitted ? (
          <div className="text-xs font-mono text-[#1e3a2b] dark:text-[#488263] py-2 font-semibold">
            ✓ You are subscribed to the daily dispatch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white dark:bg-[#0c0a09] border border-[#e7e5e4] dark:border-[#27272a] px-3 py-2.5 min-h-[44px] text-base sm:text-xs font-mono rounded-xs text-[#1c1917] dark:text-[#f5f5f4] focus:outline-none focus:border-[#1e3a2b] dark:focus:border-[#488263]"
            />
            <button
              type="submit"
              className="bg-[#1e3a2b] dark:bg-[#488263] text-white px-5 py-2.5 min-h-[44px] text-xs font-mono font-semibold uppercase tracking-wider rounded-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
