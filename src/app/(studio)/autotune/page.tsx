"use client";

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/components/autotone/App/App').then(mod => mod.App), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#111111] flex items-center justify-center text-white">Loading Autotune Engine...</div>
});

export default function AutotunePage() {
  return (
    <div className="h-full w-full bg-[#111111] overflow-y-auto">
      <App />
    </div>
  );
}
