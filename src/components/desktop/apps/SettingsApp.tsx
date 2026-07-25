"use client";

import { type WindowInstance } from "../store";
import { MonitorIcon, SpeakerIcon, GlobeIcon, LockIcon, PaletteIcon, StorageIcon } from "../icons";

export function SettingsApp({ window: _win }: { window: WindowInstance }) {
  const cats: [React.ComponentType<{ className?: string }>, string][] = [
    [MonitorIcon, "Display"], [SpeakerIcon, "Sound"], [GlobeIcon, "Network"],
    [LockIcon, "Privacy"], [PaletteIcon, "Personalization"], [StorageIcon, "Storage"],
  ];
  return (
    <div className="flex h-full">
      <div className="w-52 shrink-0 p-4"
        style={{ background: "rgba(0,0,0,0.018)", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-2" style={{ color: "#5e5a70" }}>Settings</div>
        {cats.map(([Icon, label]) => (
          <div key={label}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] text-[13px] cursor-pointer transition-colors"
            style={{ color: "#3d3a4d" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          ><Icon className="w-4 h-4 opacity-50" /><span>{label}</span></div>
        ))}
      </div>
      <div className="flex-1 p-8">
        <h3 className="text-[16px] font-medium mb-6" style={{ color: "#1d1a28" }}>Display</h3>
        <div className="space-y-5 text-[14px]" style={{ color: "#3d3a4d" }}>
          {["Dark mode", "Transparency effects"].map((label) => (
            <div key={label} className="flex items-center justify-between">
              <span>{label}</span>
              <div className="w-10 h-5.5 rounded-full relative" style={{ background: "rgba(124,111,212,0.6)" }}>
                <div className="absolute right-0.5 top-0.5 w-4.5 h-4.5 rounded-full" style={{ background: "#fff" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
