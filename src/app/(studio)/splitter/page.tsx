import { Metadata } from 'next';
import SplitterTool from '@/components/splitter/SplitterTool';

export const metadata: Metadata = {
  alternates: { canonical: '/splitter' },
  title: 'Audio Splitter - Remove Vocals Free',
  description: 'Instantly strip vocals from any song to create a karaoke backing track. 100% free, private, and runs entirely in your browser.',
  openGraph: {
    title: 'Audio Splitter - Remove Vocals Free',
    description: 'Instantly strip vocals from any song to create a karaoke backing track.',
    type: 'website',
  }
};

export default function SplitterPage() {
  return <SplitterTool />;
}
