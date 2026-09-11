import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'LRC Maker - Sync Lyrics to Audio',
  description: 'Create perfectly timed .LRC files for your songs. Upload audio, paste lyrics, and tap to sync lines precisely with the music.',
  openGraph: {
    title: 'LRC Maker - Sync Lyrics to Audio',
    description: 'Create perfectly timed .LRC files for your songs right in your browser.',
    type: 'website',
  }
};

import { LyricsSyncTool } from '@/components/sync/LyricsSyncTool';

export default function SyncPage() {
  return <LyricsSyncTool />;
}

