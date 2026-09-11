"use client";

import { Sidebar } from "@/components/Sidebar";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-hidden md:ml-[72px]">
        {children}
      </main>
    </div>
  );
}

