"use client";

import { useDesktopStore } from "./store";
import { StartMenu } from "./StartMenu";
import { SystemTray } from "./SystemTray";
import { StartIcon, getIcon } from "./icons";

export function Taskbar() {
  const {
    windows,
    activeWindowId,
    startMenuOpen,
    toggleStartMenu,
    focusWindow,
    minimizeWindow,
    isMobile,
  } = useDesktopStore();

  return (
    <>
      <StartMenu />

      <div
        className="absolute bottom-0 inset-x-0 z-[8000] flex items-center select-none"
        style={{
          height: isMobile ? 64 : 56,
          background: "rgba(255,255,252,0.72)",
          backdropFilter: "blur(28px) saturate(150%)",
          WebkitBackdropFilter: "blur(28px) saturate(150%)",
          borderTop: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 -2px 16px rgba(80,60,100,0.06)",
        }}
      >
        {/* Start button */}
        <button
          className={`flex items-center gap-1.5 h-full transition-all duration-150 ${isMobile ? "px-5" : "px-4"}`}
          style={{
            color: startMenuOpen ? "#1d1a28" : "rgba(29,26,40,0.55)",
            background: startMenuOpen ? "rgba(0,0,0,0.05)" : "transparent",
          }}
          onClick={toggleStartMenu}
          onMouseEnter={(e) => { if (!startMenuOpen) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
          onMouseLeave={(e) => { if (!startMenuOpen) e.currentTarget.style.background = "transparent"; }}
        >
          <StartIcon className={isMobile ? "w-6 h-6 opacity-75" : "w-5 h-5 opacity-75"} />
          {!isMobile && <span className="text-[12px] hidden sm:inline font-medium">Start</span>}
        </button>

        {/* Separator + running apps — desktop only */}
        {!isMobile && (
          <>
            <div className="w-px h-7 mx-1" style={{ background: "rgba(0,0,0,0.08)" }} />
            <div className="flex items-center gap-1 h-full flex-1 overflow-x-auto px-1.5">
              {windows.map((win) => {
                const active = activeWindowId === win.id;
                const AppIcon = getIcon(win.icon);
                return (
                  <button key={win.id}
                    className="flex items-center gap-1.5 h-10 px-3.5 rounded-[12px] text-[12px] transition-all duration-150 shrink-0"
                    style={{
                      background: active ? "rgba(0,0,0,0.06)" : "transparent",
                      color: active ? "#1d1a28" : "rgba(29,26,40,0.50)",
                      opacity: win.minimized ? 0.55 : 1,
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    onClick={() => { if (win.minimized || !active) focusWindow(win.id); else minimizeWindow(win.id); }}
                  >
                    <AppIcon className="w-4 h-4 opacity-55" />
                    <span className="max-w-[120px] truncate">{win.title}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Mobile: spacer pushes tray to the right */}
        {isMobile && <div className="flex-1" />}

        <SystemTray />
      </div>
    </>
  );
}
