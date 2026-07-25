"use client";

import { useEffect, useState } from "react";
import { WifiIcon, SpeakerIcon, BellIcon } from "./icons";

export function SystemTray() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() { setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }));
  }, []);

  return (
    <div className="flex items-center gap-1 h-full">
      {[WifiIcon, SpeakerIcon, BellIcon].map((Icon, i) => (
        <button key={i}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] transition-all duration-150"
          style={{ color: "rgba(29,26,40,0.35)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; e.currentTarget.style.color = "rgba(29,26,40,0.6)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(29,26,40,0.35)"; }}
        >
          <Icon className="w-4.5 h-4.5" />
        </button>
      ))}

      <div className="flex flex-col items-end justify-center px-3.5 h-full text-[13px] leading-tight rounded-[10px] cursor-default"
        style={{ color: "#3d3a4d" }}>
        <span>{time || "--:--"}</span>
        <span style={{ color: "#6b6680", fontSize: "11px" }}>{date}</span>
      </div>
    </div>
  );
}
