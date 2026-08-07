"use client";

import { useEffect, useState } from "react";
import { WifiIcon, SpeakerIcon, BellIcon } from "./icons";
import { useDesktopStore } from "./store";

export function SystemTray() {
  const isMobile = useDesktopStore((s) => s.isMobile);
  const [time, setTime] = useState("");

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Date().toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  const iconDim = isMobile ? "w-10 h-10" : "h-9 w-9";
  const iconSize = isMobile ? "w-5 h-5" : "w-4.5 h-4.5";

  return (
    <div
      className={`flex items-center ${isMobile ? "gap-0.5" : "gap-1"} h-full`}
    >
      {[WifiIcon, SpeakerIcon, BellIcon].map((Icon, i) => (
        <button
          key={i}
          className={`flex ${iconDim} items-center justify-center rounded-[10px] transition-all duration-150`}
          style={{ color: "rgba(29,26,40,0.35)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.05)";
            e.currentTarget.style.color = "rgba(29,26,40,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(29,26,40,0.35)";
          }}
        >
          <Icon className={iconSize} />
        </button>
      ))}

      <div
        className={`flex flex-col items-end justify-center h-full leading-tight rounded-[10px] cursor-default ${isMobile ? "px-2.5 text-[13px]" : "px-3.5 text-[12px]"}`}
        style={{ color: "#3d3a4d" }}
      >
        <span>{time || "--:--"}</span>
        {!isMobile && (
          <span style={{ color: "#6b6680", fontSize: "10px" }}>{date}</span>
        )}
      </div>
    </div>
  );
}
