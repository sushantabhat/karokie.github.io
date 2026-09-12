import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'About Audio Studio - Privacy-First Audio Tools',
  description: 'Learn about our 100% private, browser-based audio suite. All processing happens locally on your device.',
};

export default function AboutPage() {
  return (
    <main className="h-full overflow-y-auto bg-background text-foreground transition-colors duration-200">
      {/* Main Content */}
      <section className="flex-1 max-w-3xl mx-auto px-6 py-6 w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            About Karaoke Studio
          </h1>
          <p className="text-secondary leading-relaxed text-sm sm:text-base">
            Karaoke Studio is a lightweight recording studio that runs entirely inside your browser. No sign-ups, no tracking cookies, and no waiting for cloud uploads. Drop in an instrumental track, hit record, and export your mix.
          </p>
        </div>

        {/* Privacy & Transparency Highlight Card */}
        <div className="p-5 rounded-xl border border-emerald-500/20 bg-green-500/10">
          <h2 className="text-base font-semibold text-green-500 mb-2">
            Zero Servers. Zero Databases. 100% On Your Device.
          </h2>
          <p className="text-sm text-foreground leading-relaxed">
            Most audio apps upload your voice to cloud buckets. Karaoke Studio doesn't even have a backend database. 
            All audio processing, reverb effects, and mix rendering happen locally on your computer using the Web Audio API. 
            Drafts stay saved in your browser's local storage (IndexedDB), and when you export, the file downloads straight to your hard drive. We never hear, touch, or store your tracks.
          </p>
        </div>

        {/* Features Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-edge/20 bg-panel">
            <h3 className="font-semibold text-sm mb-1">Bluetooth & Hardware Mic Sync</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Wireless headsets introduce delay. Use the offset slider to manually nudge vocal tracks forward or backward in milliseconds to lock in with the beat.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-edge/20 bg-panel">
            <h3 className="font-semibold text-sm mb-1">Offline Drafts</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Save recordings as browser drafts without creating an account. Close the tab, come back tomorrow, and pick up right where you left off.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-edge/20 bg-panel">
            <h3 className="font-semibold text-sm mb-1">Master Reverb</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Apply real-time spatial room reverb to vocal takes so they sit naturally over the backing track before final bounce.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-edge/20 bg-panel">
            <h3 className="font-semibold text-sm mb-1">Direct MP3 & WAV Export</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Render and download high‑quality MP3 or lossless WAV files directly in the browser with a single click.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-edge/20/60 text-center text-xs text-muted">
        <p>Karaoke Studio © 2026 • Open Source Audio Project</p>
      </footer>
    </main>
  );
}
