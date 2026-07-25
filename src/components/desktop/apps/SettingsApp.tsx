"use client";

import { useState } from "react";
import { type WindowInstance, useDesktopStore } from "../store";
import { MonitorIcon, SpeakerIcon, GlobeIcon, LockIcon, PaletteIcon, StorageIcon } from "../icons";

export function SettingsApp({ window: _win }: { window: WindowInstance }) {
  const cats: [React.ComponentType<{ className?: string }>, string][] = [
    [MonitorIcon, "Display"], [SpeakerIcon, "Sound"], [GlobeIcon, "Network"],
    [LockIcon, "Privacy"], [PaletteIcon, "Personalization"], [StorageIcon, "Storage"],
  ];
  const [active, setActive] = useState("Display");
  const mobile = useDesktopStore((s) => s.isMobile);

  // Nav — vertical sidebar on desktop, horizontal scroll on mobile
  const navContent = (
    <div className={mobile ? "flex gap-1 overflow-x-auto px-2 py-2 scrollbar-hide" : "space-y-0.5"}>
      {mobile && <div className="text-xs font-semibold uppercase tracking-wider px-2 py-1 shrink-0 self-center" style={{ color: "#5e5a70" }}>Settings</div>}
      {cats.map(([Icon, label]) => (
        <div key={label}
          className={`flex items-center gap-2.5 rounded-[10px] cursor-pointer transition-colors shrink-0 ${mobile ? "px-3 py-2 text-[13px]" : "px-2.5 py-2 text-[13px]"}`}
          style={{
            color: active === label ? "#1d1a28" : "#3d3a4d",
            background: active === label ? "rgba(124,111,212,0.15)" : "transparent",
          }}
          onMouseEnter={(e) => { if (active !== label) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={(e) => { if (active !== label) e.currentTarget.style.background = "transparent"; }}
          onClick={() => setActive(label)}
        >
          <Icon className="w-4 h-4 opacity-50" />
          {!mobile && <span>{label}</span>}
        </div>
      ))}
    </div>
  );

  if (mobile) {
    return (
      <div className="flex h-full flex-col">
        <div style={{ background: "rgba(0,0,0,0.018)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {navContent}
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          <SettingsContent active={active} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-52 shrink-0 p-4"
        style={{ background: "rgba(0,0,0,0.018)", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-2" style={{ color: "#5e5a70" }}>Settings</div>
        {navContent}
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        <SettingsContent active={active} />
      </div>
    </div>
  );
}

function SettingsContent({ active }: { active: string }) {
  return (
    <div>
      <h3 className="text-[16px] font-medium mb-6" style={{ color: "#1d1a28" }}>{active}</h3>
      <div className="space-y-5 text-[14px]" style={{ color: "#3d3a4d" }}>
        {active === "Display" && (
          <>
            {["Dark mode", "Transparency effects"].map((label) => (
              <div key={label} className="flex items-center justify-between">
                <span>{label}</span>
                <div className="w-10 h-5.5 rounded-full relative" style={{ background: "rgba(124,111,212,0.6)" }}>
                  <div className="absolute right-0.5 top-0.5 w-4.5 h-4.5 rounded-full" style={{ background: "#fff" }} />
                </div>
              </div>
            ))}
          </>
        )}
        {active !== "Display" && (
          <p style={{ color: "#6b6680" }}>{active} settings coming soon.</p>
        )}
      </div>
    </div>
  );
}
