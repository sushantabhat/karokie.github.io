import { Metadata } from 'next';
import { Bluetooth, Save, Waves, Download, Heart, Code2, ShieldCheck, Github } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: '/about' },
  title: 'About Audio Studio - Privacy-First Audio Tools',
  description: 'Learn about our 100% private, browser-based audio suite. All processing happens locally on your device.',
};

export default function AboutPage() {
  return (
    <main className="h-full overflow-y-auto bg-background text-foreground transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-background to-background blur-2xl"></div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 drop-shadow-sm">
          About Karaoke Studio
        </h1>
        <p className="text-lg text-secondary leading-relaxed max-w-2xl mx-auto">
          A lightweight, powerful recording studio that runs entirely inside your browser. No sign-ups, no tracking cookies, and no waiting for cloud uploads. Just pure creativity.
        </p>
      </section>

      {/* Main Content */}
      <section className="flex-1 max-w-4xl mx-auto px-6 pb-20 w-full space-y-12">
        {/* Privacy & Transparency Highlight Card */}
        <div className="group relative overflow-hidden p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent transition-all hover:border-emerald-500/50">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
              <ShieldCheck className="w-4 h-4" /> Privacy First
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-3">
              Zero Servers. Zero Databases.<br />100% On Your Device.
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed max-w-xl">
              Most audio apps upload your voice to cloud buckets. We don&apos;t even have a backend database. 
              All audio processing, reverb effects, and mix rendering happen locally on your computer using the Web Audio API. 
              We never hear, touch, or store your tracks.
            </p>
          </div>
        </div>

        {/* Features Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-edge/40 bg-panel/50 hover:bg-panel transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Bluetooth className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Hardware Mic Sync</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Wireless headsets introduce delay. Use the offset slider to manually nudge vocal tracks forward or backward in milliseconds to lock in with the beat.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-edge/40 bg-panel/50 hover:bg-panel transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Save className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Offline Drafts</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Save recordings as browser drafts without creating an account. Close the tab, come back tomorrow, and pick up right where you left off.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-edge/40 bg-panel/50 hover:bg-panel transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <Waves className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Studio Reverb & FX</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Apply real-time spatial room reverb and compression to vocal takes so they sit naturally over the backing track before the final bounce.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-edge/40 bg-panel/50 hover:bg-panel transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Direct MP3 & WAV Export</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Render and download high‑quality MP3 or lossless WAV files directly in the browser with a single click, completely offline.
            </p>
          </div>
        </div>

        {/* Open Source Acknowledgements & License */}
        <div className="mt-16 pt-10 border-t border-edge/40">
          <div className="flex items-center gap-3 mb-6 text-foreground">
            <Code2 className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-xl font-bold">Open Source Credits</h2>
          </div>
          
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-edge/30">
              <h3 className="font-semibold text-base mb-2 text-foreground/90 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" /> 
                Autotune Engine
              </h3>
              <p className="text-sm text-secondary mb-4 leading-relaxed">
                The core pitch-correction and autotune algorithms powering our Autotune tool were made possible by the incredible work of Alexander Crist. We are extremely grateful for this open-source contribution to web audio.
              </p>
              
              <div className="rounded-lg bg-black/40 border border-edge/20 p-4 overflow-x-auto text-xs text-muted font-mono leading-relaxed">
                <p>Copyright (c) 2023 Alexander Crist</p>
                <br />
                <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
                <br />
                <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
                <br />
                <p>THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-edge/20 bg-panel/30 text-center text-sm text-muted">
        <p className="flex items-center justify-center gap-2">
          Karaoke Studio © {new Date().getFullYear()} • Built with Next.js & Web Audio API
        </p>
      </footer>
    </main>
  );
}
