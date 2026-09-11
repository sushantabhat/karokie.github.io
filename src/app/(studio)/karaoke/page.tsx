import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Online Karaoke Studio - Record & Mix Vocals',
  description: 'Free browser-based karaoke recorder. Upload backing tracks, sync lyrics, add studio reverb to your voice, and export your final mix entirely in your browser.',
  openGraph: {
    title: 'Online Karaoke Studio - Record & Mix Vocals',
    description: 'Free browser-based karaoke recorder with vocal reverb and local mixing.',
    type: 'website',
  }
};

import KaraokeStudio from '@/components/karaoke/KaraokeStudio';

export default function KaraokePage() {
  return <KaraokeStudio />;
}
