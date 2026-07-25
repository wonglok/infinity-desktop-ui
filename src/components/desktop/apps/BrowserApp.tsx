"use client";

import { type WindowInstance, useDesktopStore } from "../store";
import { ArrowLeftIcon, ArrowRightIcon, RefreshIcon, LockIcon, GlobeIcon } from "../icons";

export function BrowserApp({ window: _win }: { window: WindowInstance }) {
  const isMobile = useDesktopStore((s) => s.isMobile);
  const btnSize = isMobile ? "w-9 h-8" : "w-8 h-7";
  const iconSize = isMobile ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2.5"
        style={{ background: "rgba(0,0,0,0.018)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex gap-0.5">
          {[ArrowLeftIcon, ArrowRightIcon, RefreshIcon].map((Icon, i) => (
            <button key={i}
              className={`flex items-center justify-center ${btnSize} rounded-[10px] transition-colors touch-target`}
              style={{ color: "rgba(0,0,0,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            ><Icon className={iconSize} /></button>
          ))}
        </div>
        <div className={`flex-1 flex items-center gap-2 rounded-[10px] text-[13px] ${isMobile ? "px-3 py-2" : "px-4 py-2"}`}
          style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.08)", color: "#3d3a4d" }}>
          <LockIcon className="w-3.5 h-3.5 opacity-45 shrink-0" />
          <span className="truncate">infinity-cloud.local</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center" style={{ background: "rgba(250,249,246,0.44)" }}>
        <div className="text-center px-4">
          <GlobeIcon className={`mx-auto ${isMobile ? "w-16 h-16" : "w-20 h-20"} mb-4 md:mb-5 opacity-18`} />
          <h2 className={`${isMobile ? "text-[16px]" : "text-[18px]"} font-medium`} style={{ color: "#1d1a28" }}>Infinity Cloud Browser</h2>
          <p className={`${isMobile ? "text-[13px]" : "text-[14px]"} mt-2`} style={{ color: "#6b6680" }}>Ready to explore the cloud.</p>
        </div>
      </div>
    </div>
  );
}
