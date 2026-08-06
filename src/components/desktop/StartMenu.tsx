"use client";

import { useEffect, useRef } from "react";
import { useDesktopStore } from "./store";
import { getIcon, PowerIcon, UserIcon } from "./icons";

export function StartMenu() {
  const {
    startMenuOpen,
    closeStartMenu,
    openWindow,
    appRegistry,
    user,
    logout,
    showModal,
    isMobile,
    openAddAppModal,
  } = useDesktopStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        closeStartMenu();
    }
    const timer = setTimeout(
      () => window.addEventListener("mousedown", handleClick),
      0,
    );
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [startMenuOpen, closeStartMenu]);

  useEffect(() => {
    if (!startMenuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeStartMenu();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [startMenuOpen, closeStartMenu]);

  if (!startMenuOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute z-[9000] overflow-hidden ${isMobile ? "bottom-16 inset-x-3" : "bottom-14 left-2 w-80"}`}
      style={{
        background: "rgba(255,255,252,0.82)",
        backdropFilter: "blur(32px) saturate(160%)",
        WebkitBackdropFilter: "blur(32px) saturate(160%)",
        borderRadius: isMobile ? "18px 18px 12px 12px" : "18px 18px 14px 14px",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow:
          "0 4px 48px rgba(80,60,100,0.12), 0 0 0 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* User */}
      <div
        className={`flex items-center gap-3.5 ${isMobile ? "px-5 py-4" : "px-5 py-4"}`}
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-white"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,111,212,0.75), rgba(160,140,220,0.6))",
          }}
        >
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[15px] font-medium" style={{ color: "#1d1a28" }}>
            {user?.name ?? user?.email ?? "User"}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "#5e5a70" }}>
            {user?.email
              ? user.email.toLowerCase()
              : "user@infinity-os"}
          </div>
        </div>
      </div>

      {/* Apps */}
      <div className="py-2.5">
        <div
          className="px-5 py-1.5 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "#6b6680" }}
        >
          Apps
        </div>
        {appRegistry.map((app) => {
          const AppIcon = getIcon(app.icon);
          return (
            <button
              key={app.id}
              className={`flex w-full items-center gap-3.5 text-[14px] transition-colors text-left ${isMobile ? "px-5 py-3" : "px-5 py-2.5"}`}
              style={{ color: "#3d3a4d" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              onClick={() => {
                openWindow(app.id);
                closeStartMenu();
              }}
            >
              <AppIcon className="w-5 h-5 opacity-55" />
              <span>{app.name}</span>
            </button>
          );
        })}

        {/* Add App button */}
        <button
          className={`flex w-full items-center gap-3.5 text-[14px] transition-colors text-left ${isMobile ? "px-5 py-3" : "px-5 py-2.5"}`}
          style={{ color: "#5b4db0" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(124,111,212,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
          onClick={() => openAddAppModal()}
        >
          <PlusIcon className="w-5 h-5 opacity-65" />
          <span className="font-medium">Add Remote App</span>
        </button>
      </div>

      {/* Sign out */}
      <div
        className="pt-1.5 pb-2.5 px-2.5"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <button
          className={`flex w-full items-center gap-3 text-[14px] rounded-[12px] transition-colors text-left ${isMobile ? "px-3.5 py-3" : "px-3.5 py-2.5"}`}
          style={{ color: "#4a4658" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
          onClick={async () => {
            closeStartMenu();
            const confirmed = await showModal(
              "Sign out",
              "Are you sure you want to sign out? All open windows will be closed.",
              "confirm",
            );
            if (confirmed) logout();
          }}
        >
          <PowerIcon className="w-4.5 h-4.5 opacity-50" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

// ── Inline icon ──────────────────────────────────────────────────────────────

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
