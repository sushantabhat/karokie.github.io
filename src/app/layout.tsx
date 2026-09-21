import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0E14" },
    { media: "(prefers-color-scheme: light)", color: "#F1F5F9" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.karaokestudio.me'),
  title: {
    template: "%s | Karaoke Studio",
    default: "Karaoke Studio | Free Online Audio Tools & Vocal Remover",
  },
  description: "Free online karaoke maker, vocal remover, audio cutter, and voice changer. Create instrumental tracks and sing along directly in your browser with zero installation.",
  keywords: ["karaoke", "vocal remover", "audio cutter", "voice changer", "lyrics sync", "online karaoke", "audio editor", "instrumental maker", "free vocal remover"],
  authors: [{ name: "Sushant Bhattarai" }],
  openGraph: {
    title: "Karaoke Studio | Free Online Audio Suite",
    description: "Free online karaoke maker, vocal remover, audio cutter, and voice changer. Create instrumental tracks and sing along directly in your browser with zero installation.",
    url: "https://www.karaokestudio.me",
    siteName: "Karaoke Studio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Karaoke Studio | Free Online Audio Suite",
    description: "Free online karaoke maker, vocal remover, audio cutter, and voice changer.",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased min-h-screen m-0 p-0" 
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col relative bg-background text-foreground m-0 p-0">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
