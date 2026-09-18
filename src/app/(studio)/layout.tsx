"use client";

import { Sidebar } from "@/components/layout/Sidebar";

import { UnsavedChangesProvider } from "@/providers/UnsavedChangesProvider";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <UnsavedChangesProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <Sidebar />
        <main className="flex flex-col flex-1 min-w-0 overflow-hidden md:ml-[72px] ">
          {children}
        </main>
      </div>
    </UnsavedChangesProvider>
  );
}

