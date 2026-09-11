"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2, Music, CircleDot, HelpCircle, Menu, X, MessageCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const tools = [
    { name: "Karaoke", href: "/karaoke", icon: Mic2, disabled: false },
    { name: "Lyrics Sync", href: "/sync", icon: Music, disabled: false },
    { name: "Voice Changer", href: "/recorder", icon: CircleDot, disabled: false, badge: "" },
  ];

  const bottomLinks = [
    { name: "About", href: "/about", icon: HelpCircle },
    { name: "Discord", href: "https://discord.gg/PG4ePQWTDh", icon: MessageCircle, external: true },
  ];

  const isKaraokePage = pathname === "/karaoke";

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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-panel border-t border-edge/20 z-50 flex items-center justify-around px-2 pb-safe">
        {[...tools, { name: "About", href: "/about", icon: HelpCircle }].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors
                ${isActive ? "text-[#38bdf8]" : "text-muted hover:text-foreground"}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-[#38bdf8]/20' : ''}`} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
        
        {/* Mobile Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[10px] font-medium leading-none">Theme</span>
        </button>
      </nav>
    </>
  );
}

export default Sidebar;