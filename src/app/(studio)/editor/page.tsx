import { Metadata } from 'next';
import AudioEditorTool from '@/components/editor/AudioEditorTool';

export const metadata: Metadata = {
  alternates: { canonical: '/editor' },
  title: 'Audio Cutter & Joiner - Edit MP3s Free',
  description: 'Trim, cut, and merge multiple audio files together. 100% free, private, and runs entirely in your browser.',
  openGraph: {
    title: 'Audio Cutter & Joiner - Edit MP3s Free',
    description: 'Trim, cut, and merge multiple audio files together.',
    type: 'website',
  }
};

export default function EditorPage() {
  return <AudioEditorTool />;
}
