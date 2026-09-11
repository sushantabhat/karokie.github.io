'use client';

import { useEffect, useState } from 'react';
import { Mic2, Wrench } from 'lucide-react';

export function MaintenanceOverlay() {
  const [isLocked, setIsLocked] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isUnlocked = localStorage.getItem('karokie_dev_bypass') === 'true';
    
    // Use native window.location to avoid Next.js Suspense de-opt during build
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'unlock') {
      localStorage.setItem('karokie_dev_bypass', 'true');
      setIsLocked(false);
      // Clean up the URL so it looks normal
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isUnlocked) {
      setIsLocked(false);
    }
  }, []);

  // During SSR or before mount, show the solid black wall to prevent a flash of the app
  if (!mounted) {
    return <div className="fixed inset-0 z-[9999] bg-[#0b0f17]" />;
  }

  // If unlocked, render nothing
  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b0f17] flex flex-col items-center justify-center text-center p-6">
      <div className="w-24 h-24 rounded-full bg-[#38bdf8]/10 flex items-center justify-center mb-6 animate-pulse">
        <Wrench className="w-12 h-12 text-[#38bdf8]" />
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
        Karaoke Studio 2.0
      </h1>
      <p className="text-lg md:text-xl text-neutral-400 max-w-lg mb-8">
        We're currently in the lab brewing a massive update. A complete suite of audio tools is coming your way soon.
      </p>
      <div className="flex items-center gap-2 text-neutral-500 font-medium bg-white/5 px-4 py-2 rounded-full border border-white/10">
        <Mic2 className="w-4 h-4" />
        <span>Stay tuned</span>
      </div>
    </div>
  );
}
