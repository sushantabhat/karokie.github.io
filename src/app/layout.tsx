import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Karaoke Studio",
  description: "Record, mix, and sing along to your favorite tracks in your browser!",
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
