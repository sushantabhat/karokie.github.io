import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

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
      className="h-full antialiased bg-[#0B0F17] text-white min-h-screen m-0 p-0" data-theme="dark"
    >
      <body className="min-h-full flex flex-col relative bg-[#0B0F17] text-white m-0 p-0">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
