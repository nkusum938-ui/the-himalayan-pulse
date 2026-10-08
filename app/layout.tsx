import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Himalayan Pulse — Mountain Ecology & Community Journalism",
  description:
    "Independent reporting on Himalayan environment, culture, and community life across Uttarakhand, Himachal, Ladakh, Sikkim, Nepal, Bhutan, and Arunachal Pradesh.",
  metadataBase: new URL("https://thehimalayanpulse.com"),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://thehimalayanpulse.com/#organization",
        "name": "The Himalayan Pulse",
        "url": "https://thehimalayanpulse.com",
        "logo": "https://thehimalayanpulse.com/logo.png",
        "sameAs": [],
        "description": "Independent reporting on Himalayan environment, culture, and community life across Uttarakhand, Himachal, Ladakh, Sikkim, Nepal, Bhutan, and Arunachal Pradesh."
      },
      {
        "@type": "WebSite",
        "@id": "https://thehimalayanpulse.com/#website",
        "url": "https://thehimalayanpulse.com",
        "name": "The Himalayan Pulse",
        "publisher": {
          "@id": "https://thehimalayanpulse.com/#organization"
        },
        "inLanguage": "en-US"
      }
    ]
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
