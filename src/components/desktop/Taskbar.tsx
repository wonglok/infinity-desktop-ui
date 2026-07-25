"use client";

import { useDesktopStore } from "./store";
import { StartMenu } from "./StartMenu";
import { SystemTray } from "./SystemTray";
import { StartIcon, getIcon } from "./icons";

export function Taskbar() {
  const { windows, activeWindowId, startMenuOpen, toggleStartMenu, focusWindow, minimizeWindow } =
    useDesktopStore();

  return (
    <>
      <StartMenu />

      <div
        className="absolute bottom-0 inset-x-0 z-[8000] flex h-14 items-center select-none"
        style={{
          background: "rgba(255,255,252,0.72)",
          backdropFilter: "blur(28px) saturate(150%)",
          WebkitBackdropFilter: "blur(28px) saturate(150%)",
          borderTop: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 -2px 16px rgba(80,60,100,0.06)",
        }}
      >
        {/* Start button */}
        <button
          className="flex items-center gap-1.5 h-full px-4 transition-all duration-150"
          style={{
            color: startMenuOpen ? "#1d1a28" : "rgba(29,26,40,0.55)",
            background: startMenuOpen ? "rgba(0,0,0,0.05)" : "transparent",
          }}
          onClick={toggleStartMenu}
          onMouseEnter={(e) => { if (!startMenuOpen) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
          onMouseLeave={(e) => { if (!startMenuOpen) e.currentTarget.style.background = "transparent"; }}
        >
          <StartIcon className="w-5 h-5 opacity-75" />
          <span className="text-[13px] hidden sm:inline font-medium">Start</span>
        </button>

        <div className="w-px h-7 mx-1" style={{ background: "rgba(0,0,0,0.08)" }} />

        {/* Running apps */}
        <div className="flex items-center gap-1 h-full flex-1 overflow-x-auto px-1.5">
          {windows.map((win) => {
            const active = activeWindowId === win.id;
            const AppIcon = getIcon(win.icon);
            return (
              <button key={win.id}
                className="flex items-center gap-1.5 h-10 px-3.5 rounded-[12px] text-[13px] transition-all duration-150 shrink-0"
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

        <SystemTray />
      </div>
    </>
  );
}
