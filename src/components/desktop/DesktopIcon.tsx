"use client";

import { useCallback, useState } from "react";
import { useDesktopStore, type DesktopIconDef } from "./store";
import { getIcon } from "./icons";

interface DesktopIconProps {
  icon: DesktopIconDef;
  /** When true, renders as a grid cell for mobile mode (tap to open). */
  mobile?: boolean;
}

export function DesktopIcon({ icon, mobile = false }: DesktopIconProps) {
  const { openWindow } = useDesktopStore();
  const [selected, setSelected] = useState(false);
  const [hovered, setHovered] = useState(false);
  const AppIcon = getIcon(icon.icon);

  const handleDoubleClick = useCallback(() => {
    openWindow(icon.appId);
    setSelected(true);
  }, [icon.appId, openWindow]);

  const handleTap = useCallback(() => {
    if (selected) {
      // Second tap opens the app (mobile single-tap-to-open pattern)
      openWindow(icon.appId);
      setSelected(false);
    } else {
      setSelected(true);
    }
  }, [selected, icon.appId, openWindow]);

  // Mobile: grid-friendly layout, tap-to-open
  if (mobile) {
    return (
      <button
        className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center transition-all duration-150 select-none outline-none w-full"
        style={{
          background: selected || hovered ? "rgba(0,0,0,0.04)" : "transparent",
          boxShadow: selected ? "0 0 0 1px rgba(0,0,0,0.08)" : "none",
        }}
        onClick={handleTap}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onBlur={() => setSelected(false)}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-150"
          style={{
            background: selected ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
            boxShadow: selected ? "0 0 20px rgba(124,111,212,0.14)" : "none",
            color: selected ? "#1d1a28" : "#4a4658",
          }}
        >
          <AppIcon className="w-8 h-8" />
        </div>
        <span
          className="text-[13px] leading-tight max-w-[72px] truncate rounded-md px-1.5 py-0.5"
          style={{
            color: selected ? "#1d1a28" : "rgba(29,26,40,0.55)",
            background: selected ? "rgba(124,111,212,0.15)" : "transparent",
          }}
        >
          {icon.label}
        </span>
      </button>
    );
  }

  // Desktop: absolute-positioned icon, double-click to open
  return (
    <button
      className="flex flex-col items-center gap-2 p-3 w-24 rounded-2xl text-center transition-all duration-150 select-none outline-none"
      style={{
        position: "absolute", left: icon.x, top: icon.y,
        background: selected || hovered ? "rgba(0,0,0,0.04)" : "transparent",
        boxShadow: selected ? "0 0 0 1px rgba(0,0,0,0.08)" : "none",
      }}
      onDoubleClick={handleDoubleClick}
      onClick={() => setSelected(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onBlur={() => setSelected(false)}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-150"
        style={{
          background: selected ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
          boxShadow: selected ? "0 0 16px rgba(124,111,212,0.12)" : "none",
          color: selected ? "#1d1a28" : "#4a4658",
        }}
      >
        <AppIcon className="w-7 h-7" />
      </div>
      <span
        className="text-[13px] leading-tight max-w-[80px] truncate rounded-md px-1.5 py-0.5"
        style={{
          color: selected ? "#1d1a28" : "rgba(29,26,40,0.55)",
          background: selected ? "rgba(124,111,212,0.15)" : "transparent",
        }}
      >
        {icon.label}
      </span>
    </button>
  );
}
