import { Metadata } from 'next';
import CutterTool from '@/components/cutter/CutterTool';

export const metadata: Metadata = {
  title: 'Audio Cutter - Trim MP3s Free',
  description: 'Visually trim and cut audio files directly in your browser. 100% free and private.',
};

export default function CutterPage() {
  return <CutterTool />;
}
