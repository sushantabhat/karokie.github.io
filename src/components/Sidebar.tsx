"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2, Music, CircleDot, HelpCircle, Menu, X, MessageCircle } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      {/* Mobile Hamburger (only if not on karaoke page) */}
      {!isKaraokePage && (
        <button
          className="md:hidden fixed top-3 left-3 z-50 p-2 bg-panel/80 backdrop-blur rounded-lg border border-edge/20 text-foreground shadow-md"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-edge/20">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-muted hover:text-foreground bg-control/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Combine tools and bottom links for mobile grid */}
              {[...tools, ...bottomLinks].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isDisabled = "disabled" in item ? item.disabled : false;
                const badge = "badge" in item ? item.badge : null;
                const isExternal = "external" in item ? item.external : false;

                const cardClass = `flex flex-col items-center justify-center p-6 rounded-xl border transition-all h-[150px]
                  ${isActive 
                    ? "border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8]" 
                    : "border-edge/20 bg-panel text-foreground"
                  }
                  ${isDisabled ? "opacity-40" : "hover:border-edge/60"}
                `;

                if (isDisabled) {
                  return (
                    <div key={item.name} className={cardClass}>
                      <Icon className="w-10 h-10 mb-3" />
                      <span className="font-medium text-center">{item.name}</span>
                      {badge && (
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-2 bg-background/50 px-2 py-1 rounded">
                          {badge}
                        </span>
                      )}
                    </div>
                  );
                }

                const linkProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    {...linkProps}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cardClass}
                  >
                    <Icon className="w-10 h-10 mb-3" />
                    <span className="font-medium text-center">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
