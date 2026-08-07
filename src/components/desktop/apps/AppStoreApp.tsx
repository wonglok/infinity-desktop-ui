"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useDesktopStore,
  type WindowInstance,
  type AppDefinition,
} from "../store";
import { getIcon, SearchIcon, TrashIcon, ExternalLinkIcon } from "../icons";

// ── System apps that cannot be removed ─────────────────────────────────────

const SYSTEM_APPS = new Set([
  "files",
  "appstore",
]);

// ── Component ──────────────────────────────────────────────────────────────

export function AppStoreApp({ window: _win }: { window: WindowInstance }) {
  const {
    appRegistry,
    removeApp,
    openAddAppModal,
    showModal,
    openWindow,
    isMobile,
  } = useDesktopStore();

  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Filter apps by search, excluding self
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = appRegistry.filter((a) => a.id !== "appstore");
    if (!q) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.origin && a.origin.toLowerCase().includes(q)),
    );
  }, [appRegistry, search]);

  // Stats
  const stats = useMemo(() => {
    const total = appRegistry.length;
    const remote = appRegistry.filter((a) => Boolean(a.origin)).length;
    const system = appRegistry.filter((a) => SYSTEM_APPS.has(a.id)).length;
    const userInstalled = total - system;
    return { total, remote, system, userInstalled };
  }, [appRegistry]);

  const handleRemove = useCallback(
    async (app: AppDefinition) => {
      if (SYSTEM_APPS.has(app.id)) return;

      setRemovingId(app.id);
      try {
        const confirmed = await showModal(
          "Remove App",
          `Are you sure you want to remove "${app.name}"?${
            app.origin ? "\n\nThis will also remove its desktop icon." : ""
          }`,
          "confirm",
        );
        if (confirmed) {
          removeApp(app.id);
        }
      } finally {
        setRemovingId(null);
      }
    },
    [removeApp, showModal],
  );

  const handleOpen = useCallback(
    (appId: string) => {
      openWindow(appId);
    },
    [openWindow],
  );

  return (
    <div
      className="flex flex-col h-full select-auto"
      style={{ background: "rgba(250,249,246,0.60)" }}
    >
      {/* Header */}
      <div
        className={`shrink-0 ${isMobile ? "px-4 py-4" : "px-6 py-5"}`}
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className={`font-semibold ${isMobile ? "text-xl" : "text-[22px]"}`}
              style={{ color: "#1d1a28" }}
            >
              AppStore
            </h2>
            <p className="text-[13px] mt-0.5" style={{ color: "#5e5a70" }}>
              Manage your installed applications
            </p>
          </div>

          {/* Add App button */}
          <button
            onClick={openAddAppModal}
            className={`flex items-center gap-2 rounded-[12px] font-medium text-[14px] transition-all duration-150 ${
              isMobile ? "px-4 py-2.5" : "px-4 py-2.5"
            }`}
            style={{
              background: "rgba(124,111,212,0.55)",
              color: "#fff",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(124,111,212,0.7)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(124,111,212,0.55)")
            }
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add App</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "rgba(0,0,0,0.25)" }}
          >
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps…"
            className="w-full rounded-[12px] pl-10 pr-4 py-2.5 text-[14px] outline-none transition-all duration-200"
            style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#1d1a28",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(124,111,212,0.4)";
              e.target.style.background = "rgba(0,0,0,0.05)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0,0,0,0.08)";
              e.target.style.background = "rgba(0,0,0,0.03)";
            }}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div
        className={`shrink-0 flex items-center gap-4 ${
          isMobile ? "px-4 py-2.5" : "px-6 py-3"
        }`}
        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      >
        <StatBadge label="All" count={stats.total} />
        <StatBadge label="System" count={stats.system} muted />
        <StatBadge label="User" count={stats.userInstalled} accent />
        {stats.remote > 0 && (
          <StatBadge label="Remote" count={stats.remote} muted />
        )}
      </div>

      {/* App grid */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "rgba(0,0,0,0.30)" }}
          >
            <SearchIcon className="w-10 h-10 opacity-40" />
            <p className="text-[14px]">
              {search.trim()
                ? "No apps match your search."
                : "No apps installed."}
            </p>
          </div>
        ) : (
          <div
            className={`${
              isMobile
                ? "grid grid-cols-2 gap-3 p-3"
                : "grid grid-cols-3 gap-4 p-4"
            }`}
          >
            {filtered.map((app) => (
              <AppGridItem
                key={app.id}
                app={app}
                isSystem={SYSTEM_APPS.has(app.id)}
                isRemoving={removingId === app.id}
                onRemove={() => handleRemove(app)}
                onOpen={() => handleOpen(app.id)}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatBadge({
  label,
  count,
  muted,
  accent,
}: {
  label: string;
  count: number;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: muted ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.45)" }}
      >
        {label}
      </span>
      <span
        className="text-[12px] font-semibold rounded-full px-2 py-0.5"
        style={{
          background: accent ? "rgba(124,111,212,0.12)" : "rgba(0,0,0,0.05)",
          color: accent ? "#5b4db0" : "#3d3a4d",
        }}
      >
        {count}
      </span>
    </div>
  );
}

function AppGridItem({
  app,
  isSystem,
  isRemoving,
  onRemove,
  onOpen,
  isMobile,
}: {
  app: AppDefinition;
  isSystem: boolean;
  isRemoving: boolean;
  onRemove: () => void;
  onOpen: () => void;
  isMobile: boolean;
}) {
  const AppIcon = getIcon(app.icon);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col rounded-[16px] overflow-hidden transition-all duration-150 "
      style={{
        background: hovered
          ? "rgba(255,255,252,0.70)"
          : "rgba(255,255,252,0.45)",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: hovered
          ? "0 2px 16px rgba(80,60,100,0.08)"
          : "0 1px 4px rgba(0,0,0,0.03)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon + name area — clickable to open */}
      <div
        // onClick={onOpen}
        className={`flex flex-col items-center gap-3 w-full text-center ${
          isMobile ? "px-3 pt-5 pb-4" : "px-4 pt-5 pb-4"
        }`}
        style={{ background: "transparent" }}
      >
        <div
          className={`flex items-center justify-center rounded-[16px] transition-all duration-150 ${
            isMobile ? "h-14 w-14" : "h-12 w-12"
          }`}
          style={{
            background: hovered ? "rgba(124,111,212,0.10)" : "rgba(0,0,0,0.04)",
            color: hovered ? "#5b4db0" : "#4a4658",
          }}
        >
          <AppIcon className={isMobile ? "w-8 h-8" : "w-7 h-7"} />
        </div>

        <div className="min-w-0 w-full">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span
              className={`font-semibold truncate ${isMobile ? "text-[14px]" : "text-[13px]"}`}
              style={{ color: "#1d1a28" }}
            >
              {app.name}
            </span>
          </div>

          {/* Badges */}
          <div className="flex items-center justify-center gap-1.5">
            {isSystem && (
              <span
                className="text-[9px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5"
                style={{
                  background: "rgba(0,0,0,0.05)",
                  color: "rgba(0,0,0,0.40)",
                }}
              >
                System
              </span>
            )}
            {!isSystem && app.origin && (
              <span
                className="text-[9px] font-medium uppercase tracking-wider rounded-full px-2 py-0.5"
                style={{
                  background: "rgba(124,111,212,0.10)",
                  color: "#5b4db0",
                }}
              >
                Remote
              </span>
            )}
          </div>
        </div>

        {app.origin && (
          <div className="flex items-center gap-1 mt-0.5">
            <span style={{ color: "rgba(0,0,0,0.25)" }}>
              <ExternalLinkIcon className="w-2.5 h-2.5 shrink-0" />
            </span>
            <span
              className="text-[11px] truncate max-w-[120px]"
              style={{ color: "rgba(0,0,0,0.40)" }}
            >
              {app.origin}
            </span>
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div
        className="flex items-center justify-center gap-2 pb-4"
        style={{ borderTop: "none" }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className={`rounded-[10px] transition-all duration-150 cursor-pointer ${
            isMobile ? "px-4 py-2 text-[13px]" : "px-3.5 py-1.5 text-[12px]"
          }`}
          style={{
            background: "rgba(0,0,0,0.04)",
            color: "rgba(0,0,0,0.50)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.08)";
            e.currentTarget.style.color = "rgba(0,0,0,0.70)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.04)";
            e.currentTarget.style.color = "rgba(0,0,0,0.50)";
          }}
        >
          Open
        </button>

        {!isSystem && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={isRemoving}
            className={`flex items-center justify-center rounded-[10px] transition-all duration-150 disabled:opacity-40 ${
              isMobile ? "h-9 w-9" : "h-7 w-7"
            }`}
            style={{ color: "rgba(0,0,0,0.30)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.10)";
              e.currentTarget.style.color = "rgba(239,68,68,0.70)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(0,0,0,0.30)";
            }}
            title={`Remove ${app.name}`}
          >
            {isRemoving ? (
              <SpinnerIcon className="w-3.5 h-3.5" />
            ) : (
              <TrashIcon className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Inline icons ────────────────────────────────────────────────────────────

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.25"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
