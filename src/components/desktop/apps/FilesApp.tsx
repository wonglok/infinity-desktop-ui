"use client";

import { useState } from "react";
import { type WindowInstance, useDesktopStore } from "../store";
import {
  DocumentIcon, ImageIcon, MusicIcon, VideoIcon,
  DownloadIcon, ArrowLeftIcon, ArrowRightIcon,
} from "../icons";

// ── Types & data ────────────────────────────────────────────────────────────

export interface FSEntry {
  name: string;
  kind: "folder" | "file";
  children?: FSEntry[];
  size?: string;
  ext?: string;
}

export const mockFS: FSEntry[] = [
  { name: "Desktop", kind: "folder", children: [] },
  {
    name: "Documents", kind: "folder",
    children: [
      {
        name: "Work", kind: "folder",
        children: [
          { name: "project-notes.txt", kind: "file", size: "18 KB", ext: "txt" },
          { name: "Q4-budget.xlsx", kind: "file", size: "245 KB", ext: "xlsx" },
          { name: "presentation.key", kind: "file", size: "8.2 MB", ext: "key" },
        ],
      },
      {
        name: "Personal", kind: "folder",
        children: [
          { name: "recipes.pdf", kind: "file", size: "1.4 MB", ext: "pdf" },
          { name: "travel-plans.txt", kind: "file", size: "3 KB", ext: "txt" },
        ],
      },
      { name: "draft.md", kind: "file", size: "12 KB", ext: "md" },
      { name: "resume.pdf", kind: "file", size: "86 KB", ext: "pdf" },
    ],
  },
  {
    name: "Pictures", kind: "folder",
    children: [
      { name: "profile.png", kind: "file", size: "420 KB", ext: "png" },
      {
        name: "Vacation", kind: "folder",
        children: [
          { name: "beach.jpg", kind: "file", size: "3.2 MB", ext: "jpg" },
          { name: "sunset.png", kind: "file", size: "1.8 MB", ext: "png" },
          { name: "hotel.jpg", kind: "file", size: "2.1 MB", ext: "jpg" },
        ],
      },
      { name: "wallpaper.png", kind: "file", size: "5.1 MB", ext: "png" },
    ],
  },
  {
    name: "Music", kind: "folder",
    children: [
      { name: "playlist.m3u", kind: "file", size: "2 KB", ext: "m3u" },
      { name: "favorite.mp3", kind: "file", size: "6.4 MB", ext: "mp3" },
      { name: "podcast.mp3", kind: "file", size: "42 MB", ext: "mp3" },
    ],
  },
  {
    name: "Videos", kind: "folder",
    children: [
      { name: "screen-record.mp4", kind: "file", size: "156 MB", ext: "mp4" },
      { name: "tutorial.mp4", kind: "file", size: "890 MB", ext: "mp4" },
    ],
  },
  {
    name: "Downloads", kind: "folder",
    children: [
      { name: "installer.dmg", kind: "file", size: "124 MB", ext: "dmg" },
      { name: "invoice.pdf", kind: "file", size: "64 KB", ext: "pdf" },
      { name: "archive.zip", kind: "file", size: "3.8 MB", ext: "zip" },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function fileIcon(entry: FSEntry) {
  if (entry.kind === "folder") return FolderIconSvg;
  const e = entry.ext ?? "";
  if (["jpg", "png", "gif", "webp", "svg"].includes(e)) return ImageIcon;
  if (["mp3", "m4a", "flac", "wav", "m3u"].includes(e)) return MusicIcon;
  if (["mp4", "mov", "avi", "mkv"].includes(e)) return VideoIcon;
  if (["zip", "dmg", "pkg", "tar", "gz"].includes(e)) return DownloadIcon;
  return DocumentIcon;
}

function FolderIconSvg() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5C3 6.672 3.672 6 4.5 6h4.8c.398 0 .78.158 1.06.44L11.5 7.5H19.5c.828 0 1.5.672 1.5 1.5V19.5c0 .828-.672 1.5-1.5 1.5H4.5C3.672 21 3 20.328 3 19.5V7.5Z" />
    </svg>
  );
}

// ── Preview column ──────────────────────────────────────────────────────────

function PreviewColumn({ entry }: { entry: FSEntry }) {
  const Icon = fileIcon(entry);
  return (
    <div className="h-full overflow-y-auto shrink-0 flex flex-col" style={{ width: 240 }}>
      <div className="flex justify-center pt-14 pb-5">
        <span className="opacity-30"><Icon className="w-16 h-16" /></span>
      </div>
      <div className="px-6 pb-6 text-center">
        <div className="text-[15px] font-medium" style={{ color: "#1d1a28" }}>{entry.name}</div>
        <div className="text-[12px] mt-1" style={{ color: "#6b6680" }}>{entry.size ?? "—"}</div>
      </div>
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        {[
          ["Kind", entry.ext ? `${entry.ext.toUpperCase()} document` : "Document"],
          ["Size", entry.size ?? "—"],
          ["Modified", "Today at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
          ["Created", "Today"],
        ].map(([label, value]) => (
          <div key={label} className="flex px-5 py-2.5 text-[12px]"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
            <span className="w-20 shrink-0" style={{ color: "#9b96a8" }}>{label}</span>
            <span style={{ color: "#3d3a4d" }}>{value}</span>
          </div>
        ))}
      </div>
      <div className="px-5 pt-4 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#9b96a8" }}>Open with</div>
        {["Preview", "TextEdit", "Browser"].map((app) => (
          <button key={app}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-[8px] text-[13px] text-left transition-colors"
            style={{ color: "#3d3a4d" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >{app}</button>
        ))}
      </div>
    </div>
  );
}

// ── FilesApp ────────────────────────────────────────────────────────────────

export function FilesApp({ window: _win }: { window: WindowInstance }) {
  const isMobile = useDesktopStore((s) => s.isMobile);
  const [columns, setColumns] = useState<FSEntry[][]>([mockFS]);
  const [selected, setSelected] = useState<number[]>([]);
  const [previewEntry, setPreviewEntry] = useState<FSEntry | null>(null);

  function navigate(colIdx: number, entry: FSEntry) {
    const nextSelected = [...selected.slice(0, colIdx), -1];
    nextSelected[colIdx] = columns[colIdx].indexOf(entry);
    if (entry.kind === "folder") {
      setColumns([...columns.slice(0, colIdx + 1), entry.children ?? []]);
      setPreviewEntry(null);
    } else {
      setColumns(columns.slice(0, colIdx + 1));
      setPreviewEntry(entry);
    }
    setSelected(nextSelected);
  }

  function selectColumn(colIdx: number, idx: number) {
    const next = [...selected.slice(0, colIdx), idx];
    while (next.length < columns.length) next.push(-1);
    setSelected(next);
  }

  const hasPreview = previewEntry !== null;
  const canGoBack = columns.length > 1 || hasPreview;

  function goBack() {
    if (hasPreview) { setPreviewEntry(null); return; }
    if (columns.length <= 1) return;
    setColumns(columns.slice(0, -1));
    setSelected(selected.slice(0, -1));
  }

  const selInCol = (ci: number) => selected[ci] ?? -1;
  const totalCols = columns.length + (hasPreview ? 1 : 0);

  // Mobile: single-column drill-down
  if (isMobile) {
    const currentCol = columns[columns.length - 1];
    return (
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0"
          style={{ background: "rgba(0,0,0,0.018)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <button onClick={goBack} disabled={!canGoBack}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] transition-colors touch-target"
            style={{ color: canGoBack ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)", cursor: canGoBack ? "pointer" : "default" }}
          ><ArrowLeftIcon className="w-4 h-4" /></button>
          <span className="flex-1 text-[13px] font-medium truncate" style={{ color: "#1d1a28" }}>
            {columns.length > 1 ? columns[columns.length - 2][selInCol(columns.length - 2)]?.name ?? "Files" : "Files"}
          </span>
          <span className="text-[11px]" style={{ color: "#9b96a8" }}>{currentCol.length} items</span>
        </div>

        {/* Single column */}
        <div className="flex-1 overflow-y-auto">
          {currentCol.map((entry, fi) => {
            const Icon = fileIcon(entry);
            return (
              <button key={fi}
                className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left transition-colors outline-none"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.03)", color: "#3d3a4d" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                onClick={() => { selectColumn(columns.length - 1, fi); navigate(columns.length - 1, entry); }}
              >
                <span className="opacity-55"><Icon className="w-5 h-5 shrink-0" /></span>
                <span className="truncate flex-1">{entry.name}</span>
                {entry.kind === "folder" && <span className="text-[11px] opacity-30 shrink-0">›</span>}
                {entry.size && <span className="text-[11px] shrink-0" style={{ color: "#9b96a8" }}>{entry.size}</span>}
              </button>
            );
          })}
          {currentCol.length === 0 && (
            <div className="px-4 py-12 text-center text-[14px]" style={{ color: "#9b96a8" }}>Empty folder</div>
          )}
        </div>
      </div>
    );
  }

  // Desktop: multi-column browser
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 shrink-0"
        style={{ background: "rgba(0,0,0,0.018)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <button onClick={goBack} disabled={!canGoBack}
          className="flex items-center justify-center w-8 h-7 rounded-[10px] transition-colors"
          style={{ color: canGoBack ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)", cursor: canGoBack ? "pointer" : "default" }}
          onMouseEnter={(e) => { if (canGoBack) e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        ><ArrowLeftIcon className="w-3.5 h-3.5" /></button>
        <button className="flex items-center justify-center w-8 h-7 rounded-[10px] transition-colors"
          style={{ color: "rgba(0,0,0,0.15)" }}
        ><ArrowRightIcon className="w-3.5 h-3.5" /></button>
        {/* Path bar */}
        <div className="flex-1 flex items-center gap-1 text-[12px] mx-2" style={{ color: "#5e5a70" }}>
          {columns.map((col, ci) => {
            const idx = selInCol(ci);
            const name = idx >= 0 && idx < col.length ? col[idx].name : ci === 0 ? "Home" : "...";
            const isDeepest = ci === columns.length - 1 && !hasPreview;
            return (
              <span key={ci} className="flex items-center gap-1">
                {ci > 0 && <span className="opacity-30">›</span>}
                <span style={{ color: isDeepest ? "#1d1a28" : "#5e5a70" }}>{name}</span>
              </span>
            );
          })}
          {hasPreview && (
            <span className="flex items-center gap-1">
              <span className="opacity-30">›</span>
              <span style={{ color: "#1d1a28" }}>{previewEntry!.name}</span>
            </span>
          )}
        </div>
        <span className="text-[11px]" style={{ color: "#9b96a8" }}>
          {columns.reduce((sum, c) => sum + c.length, 0)} items
        </span>
      </div>

      {/* Columns */}
      <div className="flex-1 flex overflow-x-auto">
        {columns.map((col, ci) => (
          <div key={ci} className="h-full overflow-y-auto shrink-0"
            style={{ width: 220, borderRight: ci < totalCols - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
            {col.map((entry, fi) => {
              const Icon = fileIcon(entry);
              const isSel = selInCol(ci) === fi;
              return (
                <button key={fi}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] text-left transition-colors outline-none"
                  style={{ background: isSel ? "rgba(124,111,212,0.20)" : "transparent", color: isSel ? "#1d1a28" : "#3d3a4d" }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { selectColumn(ci, fi); navigate(ci, entry); }}
                >
                  <span className="opacity-55"><Icon className="w-4 h-4 shrink-0" /></span>
                  <span className="truncate">{entry.name}</span>
                  {entry.kind === "folder" && <span className="ml-auto text-[10px] opacity-35 shrink-0">›</span>}
                </button>
              );
            })}
            {col.length === 0 && (
              <div className="px-4 py-8 text-center text-[13px]" style={{ color: "#9b96a8" }}>Empty folder</div>
            )}
          </div>
        ))}
        {hasPreview && <PreviewColumn entry={previewEntry!} />}
      </div>
    </div>
  );
}
