"use client";

import { Sidebar } from "@/components/Sidebar";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden md:ml-[72px] pb-[64px] md:pb-0">
        {children}
      </main>
    </div>
  );
}

