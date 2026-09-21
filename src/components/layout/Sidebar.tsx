"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mic2, Music, CircleDot, HelpCircle, Menu, X, MessageCircle, Moon, Sun, Scissors, Link as LinkIcon, Wand2, Activity, Trash2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useUnsavedChanges } from "@/providers/UnsavedChangesProvider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);

  // Render-safe state reset: clear menuOpenPath if the pathname changes
  // This avoids useEffect cascading renders while ensuring the menu closes on back/forward navigation.
  if (menuOpenPath !== null && menuOpenPath !== pathname) {
    setMenuOpenPath(null);
  }

  const mobileMenuOpen = menuOpenPath === pathname;
  const { theme, toggleTheme } = useTheme();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();

  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const tools = [
    { name: "Karaoke", href: "/karaoke", icon: Mic2, disabled: false },
    { name: "Lyrics Sync", href: "/sync", icon: Music, disabled: false },
    { name: "Voice Changer", href: "/recorder", icon: CircleDot, disabled: false, badge: "" },
    { name: "Remover", href: "/splitter", icon: Wand2, disabled: false, badge: "" },
    { name: "Cutter / Splitter", href: "/cutter", icon: Scissors, disabled: false, badge: "" },
    { name: "Autotune", href: "/autotune", icon: Activity, disabled: false, badge: "" },
  ];

  const bottomLinks = [
    { name: "About", href: "/about", icon: HelpCircle },
    { name: "Discord", href: "https://discord.gg/PG4ePQWTDh", icon: MessageCircle, external: true },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string, isExternal?: boolean) => {
    if (isExternal) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    if (pathname !== href) {
      if (!hasUnsavedChanges) {
        return; // Let standard link navigation proceed since no unsaved changes
      }
      e.preventDefault();
      setPendingPath(href);
      setShowWarning(true);
    }
  };

  const confirmNavigation = () => {
    if (pendingPath) {
      setHasUnsavedChanges(false);
      router.push(pendingPath);
      setShowWarning(false);
      setPendingPath(null);
       
    }
  };

  const cancelNavigation = () => {
    setShowWarning(false);
    setPendingPath(null);
  };

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
                onClick={(e) => handleNavClick(e, tool.href)}
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
                onClick={(e) => handleNavClick(e, link.href, isExternal)}
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
        onClick={() => setMenuOpenPath(pathname)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-panel border border-edge/20 shadow-sm text-foreground hover:bg-control"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Fullscreen Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background text-foreground flex flex-col overflow-y-auto animate-in fade-in  duration-200">
          
          {/* Overlay Header */}
          <div className="flex items-center justify-between p-4 border-b border-edge/20">
            <button onClick={() => setMenuOpenPath(null)} className="p-2 hover:bg-control rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <Link href="/about" onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                
                if (pathname !== "/about") {
                  if (!hasUnsavedChanges) {
                     
                    return;
                  }
                  e.preventDefault();
                  setPendingPath("/about");
                  setShowWarning(true);
                } else {
                   
                }
              }} className="p-2 hover:bg-control rounded-lg transition-colors">
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
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    
                    if (pathname !== tool.href) {
                      if (!hasUnsavedChanges) {
                         
                        return;
                      }
                      e.preventDefault();
                      setPendingPath(tool.href);
                      setShowWarning(true);
                    } else {
                       
                    }
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

      {/* Full-screen Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#13151a]/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-2xl w-full mx-auto px-6 flex flex-col items-center text-center">
            <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
              Are you sure you want to switch tools?
            </h2>
            <p className="text-base md:text-lg text-white/70 mb-10 max-w-lg">
              Any unsaved progress or audio track settings will be deleted along with it.
            </p>
            
            <div className="flex items-center gap-6">
              <button
                onClick={confirmNavigation}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white rounded-full transition-all hover:scale-105 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Yes, discard
              </button>
              <button
                onClick={cancelNavigation}
                className="px-6 py-2.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
