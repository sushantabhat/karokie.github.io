import { Metadata } from 'next';
import CutterTool from '@/components/cutter/CutterTool';

export const metadata: Metadata = {
  title: 'Free Audio Cutter - Trim MP3 & WAV Online',
  description: 'Visually trim, cut, and edit audio files directly in your browser. Fast, 100% free, private, and no installation required. Perfect for making ringtones.',
  openGraph: {
    title: 'Free Audio Cutter - Trim MP3 & WAV Online',
    description: 'Visually trim, cut, and edit audio files directly in your browser. Fast, 100% free, private, and no installation required.',
    type: 'website',
  }
};

export default function CutterPage() {
  return <CutterTool />;
}
