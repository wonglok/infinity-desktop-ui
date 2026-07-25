"use client";

import { type WindowInstance } from "../store";
import { getIcon } from "../icons";

export function DefaultApp({ window: win }: { window: WindowInstance }) {
  const AppIcon = getIcon(win.icon);
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <AppIcon className="w-16 h-16 mx-auto mb-4 opacity-25" />
        <p className="text-[17px] font-semibold" style={{ color: "#1d1a28" }}>
          {win.title}
        </p>
        <p className="text-[12px] mt-1.5" style={{ color: "#6b6680" }}>
          Application content
        </p>
      </div>
    </div>
  );
}
