"use client";

import { useState, useEffect } from "react";
import { type WindowInstance, useDesktopStore } from "../store";
import { MonitorIcon, BellIcon, StorageIcon, WifiIcon } from "../icons";

// ── Live clock hook ──────────────────────────────────────────────────────────

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Widget card shell ────────────────────────────────────────────────────────

function WidgetCard({
  title,
  icon: Icon,
  children,
  span,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  span?: "half" | "full";
}) {
  const isMobile = useDesktopStore((s) => s.isMobile);
  return (
    <div
      className={`flex flex-col ${span === "full" ? "col-span-full" : span === "half" ? "col-span-1" : "col-span-1"}`}
      style={{
        background: "rgba(255,255,252,0.64)",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 16,
        boxShadow:
          "0 1px 8px rgba(80,60,100,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      <div
        className={`flex items-center gap-2 ${isMobile ? "px-3 py-2.5" : "px-4 py-3"}`}
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <Icon
          className={`${isMobile ? "w-4 h-4" : "w-3.5 h-3.5"} opacity-50`}
        />
        <span
          className={`${isMobile ? "text-[13px]" : "text-[12px]"} font-semibold uppercase tracking-wide opacity-50`}
          style={{ color: "#1d1a28" }}
        >
          {title}
        </span>
      </div>
      <div className={`flex-1 ${isMobile ? "p-3" : "p-4"}`}>{children}</div>
    </div>
  );
}

// ── WidgetApp ────────────────────────────────────────────────────────────────

export function WidgetApp({ window: _win }: { window: WindowInstance }) {
  const isMobile = useDesktopStore((s) => s.isMobile);
  const clock = useClock();
  const [notes, setNotes] = useState<string[]>(() => [
    "Welcome to Widgets!",
    "Click a note to remove it.",
    "Type a new note below.",
  ]);
  const [draft, setDraft] = useState("");

  const addNote = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    setDraft("");
  };

  const removeNote = (i: number) => {
    setNotes((prev) => prev.filter((_, idx) => idx !== i));
  };

  const timeStr = clock.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = clock.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const grid = isMobile
    ? "grid grid-cols-1 gap-3 p-3"
    : "grid grid-cols-2 gap-4 p-4";

  return (
    <div
      className={`h-full overflow-auto ${grid}`}
      style={{ background: "rgba(250,249,246,0.44)" }}
    >
      {/* Clock widget */}
      <WidgetCard title="Clock" icon={MonitorIcon} span="full">
        <div className="text-center py-2">
          <p
            className={`${isMobile ? "text-[36px]" : "text-[44px]"} font-light tracking-tight leading-none`}
            style={{ color: "#1d1a28" }}
          >
            {timeStr}
          </p>
          <p
            className={`${isMobile ? "text-[14px]" : "text-[15px]"} mt-2`}
            style={{ color: "#6b6680" }}
          >
            {dateStr}
          </p>
        </div>
      </WidgetCard>

      {/* System status */}
      <WidgetCard title="System" icon={StorageIcon}>
        <div className="space-y-3">
          {[
            { label: "CPU", pct: 23 },
            { label: "Memory", pct: 58 },
            { label: "Disk", pct: 41 },
            { label: "Network", pct: 12 },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span
                className={`${isMobile ? "text-[13px] w-16" : "text-[12px] w-14"} font-medium`}
                style={{ color: "#3d3a4d" }}
              >
                {row.label}
              </span>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(0,0,0,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${row.pct}%`,
                    background:
                      row.pct > 80
                        ? "rgba(239,68,68,0.55)"
                        : row.pct > 50
                          ? "rgba(234,179,8,0.55)"
                          : "rgba(34,197,94,0.45)",
                  }}
                />
              </div>
              <span
                className={`${isMobile ? "text-[13px]" : "text-[12px]"} w-8 text-right tabular-nums font-medium`}
                style={{ color: "#6b6680" }}
              >
                {row.pct}%
              </span>
            </div>
          ))}
          <div
            className={`flex items-center gap-2 ${isMobile ? "text-[13px]" : "text-[12px]"}`}
            style={{ color: "#6b6680" }}
          >
            <WifiIcon className={`${isMobile ? "w-4 h-4" : "w-3.5 h-3.5"}`} />
            <span>Infinity Cloud · Connected</span>
          </div>
        </div>
      </WidgetCard>

      {/* Quick notes */}
      <WidgetCard title="Notes" icon={BellIcon}>
        <div className="flex flex-col h-full">
          <div className="flex-1 space-y-1.5 mb-3">
            {notes.length === 0 && (
              <p
                className={`${isMobile ? "text-[13px]" : "text-[12px]"} opacity-45`}
                style={{ color: "#6b6680" }}
              >
                No notes yet.
              </p>
            )}
            {notes.map((note, i) => (
              <div
                key={i}
                onClick={() => removeNote(i)}
                className={`${isMobile ? "text-[13px] py-1.5 px-2.5" : "text-[12px] py-1 px-2"} rounded-lg cursor-pointer transition-colors`}
                style={{ color: "#3d3a4d" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {note}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addNote();
              }}
              placeholder="Add a note…"
              className={`flex-1 bg-transparent outline-none rounded-lg ${isMobile ? "text-[13px] py-2 px-3" : "text-[12px] py-1.5 px-2.5"}`}
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                color: "#3d3a4d",
              }}
            />
            <button
              onClick={addNote}
              className={`${isMobile ? "px-3 py-2 text-[13px]" : "px-2.5 py-1.5 text-[12px]"} rounded-lg font-medium transition-colors touch-target`}
              style={{
                color: "#fff",
                background: "#5b5a6e",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#4a4960")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#5b5a6e")
              }
            >
              Add
            </button>
          </div>
        </div>
      </WidgetCard>

      {/* Weather mock */}
      <WidgetCard title="Weather" icon={MonitorIcon}>
        <div className="text-center py-2">
          <p
            className={`${isMobile ? "text-[40px]" : "text-[48px]"} leading-none`}
          >
            ☀️
          </p>
          <p
            className={`${isMobile ? "text-[22px]" : "text-[26px]"} font-light mt-2`}
            style={{ color: "#1d1a28" }}
          >
            24°C
          </p>
          <p
            className={`${isMobile ? "text-[13px]" : "text-[12px]"} mt-1`}
            style={{ color: "#6b6680" }}
          >
            Sunny · San Francisco
          </p>
          <div
            className={`flex justify-center gap-4 ${isMobile ? "mt-3 text-[13px]" : "mt-3 text-[12px]"}`}
            style={{ color: "#6b6680" }}
          >
            <span>H: 28°</span>
            <span>L: 18°</span>
            <span>💧 45%</span>
          </div>
        </div>
      </WidgetCard>
    </div>
  );
}
