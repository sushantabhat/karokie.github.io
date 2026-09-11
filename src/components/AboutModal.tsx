import React from 'react';
import { X } from 'lucide-react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const appVersion = '1.0.0'; // Update as needed

export function AboutModal({ open, onClose }: AboutModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-panel border border-edge/20 light:border-edge rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-edge/20 light:border-edge">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            About Karaoke Studio
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-foreground">
          <p>
            Karaoke Studio is a web‑based platform that lets you record, mix, and sing along to your favorite tracks directly in the browser.
          </p>
          <p>
            <strong>Version:</strong> {appVersion}
          </p>
          <p>
            <strong>Credits:</strong> Developed by <a href="https://github.com/sushantabhat" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Sushant Abhat</a>.
          </p>
          <p>
            <strong>Tech Stack:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Next.js (App Router)</li>
              <li>React & TypeScript</li>
              <li>Tailwind CSS</li>
              <li>Vercel Analytics</li>
              <li>Lucide icons</li>
            </ul>
          </p>
          <p>
            Join our community on Discord to share recordings, get support, and stay updated:
            <a href="https://discord.gg/your-discord-invite" target="_blank" rel="noopener noreferrer" className="ml-2 inline-block bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition">
              Discord
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
