import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: {
    template: "%s | Karaoke Studio",
    default: "Karaoke Studio | Free Online Audio Tools & Vocal Remover",
  },
  description: "Free online karaoke maker, vocal remover, audio cutter, and voice changer. Create instrumental tracks and sing along directly in your browser with zero installation.",
  keywords: ["karaoke", "vocal remover", "audio cutter", "voice changer", "lyrics sync", "online karaoke", "audio editor", "instrumental maker", "free vocal remover"],
  authors: [{ name: "Karaoke Studio" }],
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
      data-theme="dark"
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
