import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Online Voice Changer & Pitch Correction',
  description: 'Apply professional pitch correction, robotic voice effects, and autotune to your vocals directly in your browser. Upload audio and tune it instantly for free.',
  openGraph: {
    title: 'Free Online Voice Changer & Pitch Correction',
    description: 'Apply professional pitch correction, robotic voice effects, and autotune to your vocals directly in your browser.',
    type: 'website',
  }
};

export default function AutotuneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
