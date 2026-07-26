"use client";

import {
  useCallback,
  useState,
  useRef,
  type PointerEvent as RPointerEvent,
} from "react";
import { useDesktopStore, type WindowInstance } from "./store";
import { getIcon } from "./icons";
import {
  FilesApp,
  TerminalApp,
  BrowserApp,
  SettingsApp,
  DefaultApp,
  AppStoreApp,
} from "./apps";

import { AppLoader } from "./AppLoader/AppLoader";

const RESIZE_HANDLE = 6;
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | null;

const GLASS_INACTIVE = {
  background: "rgba(255,255,252,0.60)",
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow:
    "0 2px 18px rgba(80,60,100,0.06), 0 0 0 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)",
};

const GLASS_ACTIVE = {
  background: "rgba(255,255,252,0.76)",
  border: "1px solid rgba(0,0,0,0.09)",
  boxShadow:
    "0 4px 32px rgba(80,60,100,0.10), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)",
};

// ── App registry ───────────────────────────────────────────────────────────

const appContentMap: Record<
  string,
  React.ComponentType<{ window: WindowInstance }>
> = {
  files: FilesApp,
  terminal: TerminalApp,
  browser: BrowserApp,
  settings: SettingsApp,
  appstore: AppStoreApp,
};

// ── Window ─────────────────────────────────────────────────────────────────

export function Window({ window: win }: { window: WindowInstance }) {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    moveWindow,
    resizeWindow,
    showModal,
    isMobile,
    appRegistry,
  } = useDesktopStore();

  const appDef = appRegistry.find((a) => a.id === win.appId);
  const isRemoteApp = Boolean(appDef?.origin);

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<ResizeDir>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    winX: number;
    winY: number;
  } | null>(null);
  const resizeRef = useRef<{
    dir: ResizeDir;
    startX: number;
    startY: number;
    winX: number;
    winY: number;
    winW: number;
    winH: number;
  } | null>(null);

  const isActive = useDesktopStore((s) => s.activeWindowId === win.id);
  const glass = isActive ? GLASS_ACTIVE : GLASS_INACTIVE;
  const AppIcon = getIcon(win.icon);

  const onPointerDownTitle = useCallback(
    (e: RPointerEvent) => {
      if (win.maximized || isMobile) return;
      focusWindow(win.id);
      setDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        winX: win.x,
        winY: win.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [win.id, win.maximized, win.x, win.y, focusWindow, isMobile],
  );

  const onPointerMove = useCallback(
    (e: RPointerEvent) => {
      if (dragging && dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        moveWindow(
          win.id,
          dragRef.current.winX + dx,
          dragRef.current.winY + dy,
        );
      }
      if (resizing && resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const r = resizeRef.current;
        let nw = r.winW,
          nh = r.winH,
          nx = r.winX,
          ny = r.winY;
        if (r.dir?.includes("e")) nw = Math.max(win.minWidth, r.winW + dx);
        if (r.dir?.includes("s")) nh = Math.max(win.minHeight, r.winH + dy);
        if (r.dir?.includes("w")) {
          nw = Math.max(win.minWidth, r.winW - dx);
          nx = r.winX + (r.winW - nw);
        }
        if (r.dir?.includes("n")) {
          nh = Math.max(win.minHeight, r.winH - dy);
          ny = r.winY + (r.winH - nh);
        }
        resizeWindow(win.id, nw, nh, nx, ny);
      }
    },
    [
      dragging,
      resizing,
      win.id,
      win.minWidth,
      win.minHeight,
      moveWindow,
      resizeWindow,
    ],
  );

  const onPointerUp = useCallback((e: RPointerEvent) => {
    setDragging(false);
    setResizing(null);
    dragRef.current = null;
    resizeRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
  }, []);

  const onResizeStart = useCallback(
    (dir: ResizeDir) => (e: RPointerEvent) => {
      e.stopPropagation();
      setResizing(dir);
      resizeRef.current = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        winX: win.x,
        winY: win.y,
        winW: win.width,
        winH: win.height,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [win.x, win.y, win.width, win.height],
  );

  const handleClose = useCallback(async () => {
    if (isMobile) {
      closeWindow(win.id);
      return;
    }
    const confirmed = await showModal(
      "Close window",
      `Close "${win.title}"?`,
      "confirm",
    );
    if (confirmed) closeWindow(win.id);
  }, [win.id, win.title, showModal, closeWindow, isMobile]);

  const AppContent = appContentMap[win.appId];

  return (
    <div
      className={`absolute flex flex-col overflow-hidden transition-[opacity,border-radius] duration-200 ${win.minimized ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{
        left: 0,
        top: 0,
        willChange: "auto",
        transform:
          win.maximized || isMobile
            ? undefined
            : `translate(${win.x}px, ${win.y}px)`,
        width: win.maximized || isMobile ? "100%" : win.width,
        height:
          win.maximized || isMobile
            ? isMobile
              ? "calc(100% - 64px)"
              : "calc(100% - 56px)"
            : win.height,
        zIndex: win.zIndex,
        borderRadius: win.maximized || isMobile ? 0 : 18,
        ...glass,
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
      }}
      onPointerDown={() => focusWindow(win.id)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Title bar — taller on mobile for touch */}
      <div
        className={`flex shrink-0 items-center gap-2.5 px-4 select-none ${isMobile ? "h-12" : "h-11"}`}
        style={{
          background: isActive ? "rgba(0,0,0,0.025)" : "rgba(0,0,0,0.012)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          cursor: dragging ? "grabbing" : isMobile ? "default" : "default",
        }}
        onPointerDown={onPointerDownTitle}
        onDoubleClick={() => {
          if (!isMobile) toggleMaximizeWindow(win.id);
        }}
      >
        <AppIcon className={`${isMobile ? "w-5 h-5" : "w-4 h-4"} opacity-55`} />
        <span
          className={`flex-1 font-semibold truncate select-none ${isMobile ? "text-[16px]" : "text-[17px]"}`}
          style={{ color: "#1d1a28" }}
        >
          {win.title}
        </span>
        <div className={`flex items-center ${isMobile ? "gap-2" : "gap-1.5"}`}>
          {!isMobile && (
            <>
              <WinButton
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeWindow(win.id);
                }}
              >
                <MinimizeIconSvg />
              </WinButton>
              <WinButton
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMaximizeWindow(win.id);
                }}
              >
                {win.maximized ? <RestoreIconSvg /> : <MaximizeIconSvg />}
              </WinButton>
            </>
          )}
          <WinButton
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            hoverBg="rgba(239,68,68,0.55)"
            size={isMobile ? "lg" : "sm"}
          >
            <CloseIconSvg size={isMobile ? "lg" : "sm"} />
          </WinButton>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto"
        style={{ background: "rgba(250,249,246,0.60)" }}
      >
        {AppContent ? (
          <AppContent window={win} />
        ) : isRemoteApp ? (
          <div
            className="h-full w-full overflow-hidden relative"
            style={{ background: "rgba(250,249,246,0.44)" }}
          >
            <AppLoader
              user={{
                id: "userID_u123456",
                username: "wonglok831",
                email: "lok@lok.com",
              }}
              app={{
                id: win.id,
                name: appDef?.name ?? win.title,
                origin: appDef?.origin ?? "",
              }}
            />
          </div>
        ) : (
          <DefaultApp window={win} />
        )}
      </div>

      {/* Mobile gesture bar — visual affordance for swiping/closing */}
      {isMobile && (
        <div
          className="shrink-0 flex items-center justify-center h-7"
          style={{
            background: "rgba(0,0,0,0.015)",
            borderTop: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: 36,
              height: 4,
              background: "rgba(0,0,0,0.18)",
            }}
          />
        </div>
      )}

      {/* Resize handles — desktop only */}
      {!win.maximized && !isMobile && (
        <>
          <div
            className="absolute inset-x-0 top-0"
            style={{ height: RESIZE_HANDLE, cursor: "n-resize" }}
            onPointerDown={onResizeStart("n")}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: RESIZE_HANDLE, cursor: "s-resize" }}
            onPointerDown={onResizeStart("s")}
          />
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: RESIZE_HANDLE, cursor: "w-resize" }}
            onPointerDown={onResizeStart("w")}
          />
          <div
            className="absolute inset-y-0 right-0"
            style={{ width: RESIZE_HANDLE, cursor: "e-resize" }}
            onPointerDown={onResizeStart("e")}
          />
          {(["nw", "ne", "sw", "se"] as NonNullable<ResizeDir>[]).map((dir) => {
            const isN = dir.includes("n"),
              isW = dir.includes("w");
            return (
              <div
                key={dir}
                className="absolute"
                style={{
                  [isN ? "top" : "bottom"]: 0,
                  [isW ? "left" : "right"]: 0,
                  width: RESIZE_HANDLE + 4,
                  height: RESIZE_HANDLE + 4,
                  cursor: `${dir}-resize`,
                }}
                onPointerDown={onResizeStart(dir)}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

// ── WinButton + inline SVG icons ──────────────────────────────────────────

function WinButton({
  onClick,
  hoverBg = "rgba(0,0,0,0.07)",
  children,
  size = "sm",
}: {
  onClick: (e: React.MouseEvent) => void;
  hoverBg?: string;
  children: React.ReactNode;
  size?: "sm" | "lg";
}) {
  const [hovered, setHovered] = useState(false);
  const dim = size === "lg" ? 32 : 28;
  return (
    <button
      className="flex items-center justify-center rounded-[10px] transition-all duration-150"
      style={{
        width: dim,
        height: dim,
        color: hovered ? "rgba(0,0,0,0.60)" : "rgba(0,0,0,0.28)",
        background: hovered ? hoverBg : "transparent",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

function MinimizeIconSvg({ size: _s }: { size?: "sm" | "lg" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <rect
        x="1.5"
        y="4.25"
        width="7"
        height="1.2"
        rx="0.6"
        fill="currentColor"
      />
    </svg>
  );
}
function MaximizeIconSvg({ size: _s }: { size?: "sm" | "lg" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <rect
        x="1"
        y="1"
        width="8"
        height="8"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}
function RestoreIconSvg({ size: _s }: { size?: "sm" | "lg" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <rect
        x="2.5"
        y="0.5"
        width="7"
        height="7"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="0.5"
        y="2.5"
        width="7"
        height="7"
        rx="1"
        fill="rgba(255,255,252,0.9)"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}
function CloseIconSvg({ size: _s }: { size?: "sm" | "lg" }) {
  const dim = _s === "lg" ? 12 : 10;
  const sw = _s === "lg" ? 1.5 : 1.2;
  return (
    <svg width={dim} height={dim} viewBox="0 0 10 10">
      <path
        d="M1.5 1.5l7 7M8.5 1.5l-7 7"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}
