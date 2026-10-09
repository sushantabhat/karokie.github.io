import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: '/blog' },
  title: 'Audio Editing Blog & Tutorials',
  description: 'Learn how to remove vocals, pitch shift, and record karaoke in your browser for free.',
};

export default function BlogIndex() {
  return (
    <main className="h-full overflow-y-auto bg-background text-foreground transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
          Audio Tutorials & Guides
        </h1>
        <p className="text-lg text-secondary mb-12">
          Learn how to get the most out of our free browser-based audio tools.
        </p>

        <div className="grid grid-cols-1 gap-6">
          <Link href="/blog/how-to-remove-vocals" className="block p-8 rounded-2xl border border-edge/40 bg-panel/50 hover:bg-panel transition-all hover:scale-[1.02]">
            <h2 className="text-2xl font-bold mb-3 text-blue-400">How to Remove Vocals from Any Song for Free (2026)</h2>
            <p className="text-foreground/80 mb-4">
              Learn how to isolate vocals or create instrumental karaoke tracks directly in your browser without creating an account or downloading shady software.
            </p>
            <span className="text-sm font-semibold text-blue-500">Read Tutorial →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
