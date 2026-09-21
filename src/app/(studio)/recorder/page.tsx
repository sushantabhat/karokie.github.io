import VoiceChangerTool from '@/components/recorder/VoiceChangerTool';

export const metadata = {
  alternates: { canonical: '/recorder' },
  title: 'Voice Changer - Karaoke Studio',
};

export default function RecorderPage() {
  return <VoiceChangerTool />;
}
