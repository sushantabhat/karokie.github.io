"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2, Music, CircleDot, HelpCircle, Menu, X, MessageCircle, Moon, Sun, Scissors, Link as LinkIcon, Wand2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const tools = [
    { name: "Karaoke", href: "/karaoke", icon: Mic2, disabled: false },
    { name: "Lyrics Sync", href: "/sync", icon: Music, disabled: false },
    { name: "Voice Changer", href: "/recorder", icon: CircleDot, disabled: false, badge: "" },
    // Adding placeholders for the tools shown in the user's reference image
    { name: "Remover", href: "/splitter", icon: Wand2, disabled: false, badge: "" },
    { name: "Cutter / Splitter", href: "/cutter", icon: Scissors, disabled: false, badge: "" },
    
  ];

  const bottomLinks = [
    { name: "About", href: "/about", icon: HelpCircle },
    { name: "Discord", href: "https://discord.gg/PG4ePQWTDh", icon: MessageCircle, external: true },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[72px] fixed inset-y-0 left-0 bg-panel border-r border-edge/20 z-40">
        <div className="flex flex-col gap-2 pt-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = pathname === tool.href;
            
            if (tool.disabled) {
              return (
                <div key={tool.name} className="flex flex-col items-center justify-center p-3 text-muted/50 cursor-not-allowed group relative">
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] text-center leading-tight">{tool.name}</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded m-1 backdrop-blur-sm">
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-wider text-center px-1">
                      {tool.badge}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={tool.name}
                href={tool.href}
                className={`flex flex-col items-center justify-center p-3 transition-colors relative
                  ${isActive 
                    ? "text-[#38bdf8] bg-control/20" 
                    : "text-muted hover:text-foreground hover:bg-control/10"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#38bdf8] rounded-r" />
                )}
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] text-center leading-tight">{tool.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-2 pb-6">
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center p-3 transition-colors relative text-muted hover:text-foreground hover:bg-control/10"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6 mb-1" /> : <Moon className="w-6 h-6 mb-1" />}
            <span className="text-[10px] text-center leading-tight">Theme</span>
          </button>
          {bottomLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            const isExternal = link.external;
            
            const linkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

            return (
              <Link
                key={link.name}
                href={link.href}
                {...linkProps}
                className={`flex flex-col items-center justify-center p-3 transition-colors relative
                  ${isActive 
                    ? "text-[#38bdf8] bg-control/20" 
                    : "text-muted hover:text-foreground hover:bg-control/10"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#38bdf8] rounded-r" />
                )}
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] text-center leading-tight">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile Hamburger Button (Floating) */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-panel border border-edge/20 shadow-sm text-foreground hover:bg-control"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Fullscreen Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          
          {/* Overlay Header */}
          <div className="flex items-center justify-between p-4 border-b border-edge/20">
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-control rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-control rounded-lg transition-colors">
                <HelpCircle className="w-6 h-6" />
              </Link>
              <button onClick={toggleTheme} className="p-2 hover:bg-control rounded-lg transition-colors">
                {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Grid of Tools */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = pathname === tool.href;

              return (
                <Link
                  key={tool.name}
                  href={tool.disabled ? '#' : tool.href}
                  onClick={(e) => {
                    if (tool.disabled) {
                      e.preventDefault();
                      return;
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-xl transition-all
                    ${isActive 
                      ? "bg-panel border border-edge shadow-md" 
                      : "bg-control/50 border border-transparent hover:bg-control"
                    }
                    ${tool.disabled ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {tool.disabled && (
                    <div className="absolute top-2 right-2 bg-foreground/10 text-foreground/50 text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider">
                      {tool.badge}
                    </div>
                  )}
                  <Icon className="w-8 h-8 mb-3 opacity-90" strokeWidth={1.5} />
                  <span className="text-sm font-medium tracking-tight opacity-90">{tool.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Overlay Footer (Discord, etc) */}
          <div className="mt-auto p-4 flex justify-center pb-8">
            <Link 
              href="https://discord.gg/PG4ePQWTDh" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Join our Discord
            </Link>
          </div>

        </div>
      )}
    </>
  );
}

export default Sidebar;
