import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Karaoke Studio",
  description: "Record, mix, and sing along to your favorite tracks in your browser!",
};

type LayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className="h-full antialiased bg-[#0B0F17] text-white min-h-screen m-0 p-0"
    >
      <body className="min-h-full flex flex-col relative bg-[#0B0F17] text-white m-0 p-0">
        {children}
        {/* Minimal Studio Footer */}
        <footer className="w-full py-8 mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-500 border-t border-neutral-800/40">
          <span>Karaoke Studio © 2026</span>
          <span>•</span>
          <Link className="hover:text-neutral-300 transition-colors" href="/about">
            About
          </Link>
          <span>•</span>
          <a
            href="https://github.com/sushantabhat/sushantabhat.github.io"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            GitHub
          </a>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
