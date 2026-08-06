"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type WindowInstance, useDesktopStore } from "../store";
import { FileSDKClient, type FileEntry } from "../../../../desktop-ui-app/sdk/fileSDKClient";
import {
  DocumentIcon, ImageIcon, MusicIcon, VideoIcon,
  DownloadIcon, ArrowLeftIcon, ArrowRightIcon,
  FolderIcon,
} from "../icons";

// ── Helpers ─────────────────────────────────────────────────────────────────

function fileIcon(entry: FileEntry) {
  if (entry.kind === "folder") return FolderIcon;
  const e = entry.ext ?? "";
  if (["jpg", "png", "gif", "webp", "svg"].includes(e)) return ImageIcon;
  if (["mp3", "m4a", "flac", "wav", "m3u"].includes(e)) return MusicIcon;
  if (["mp4", "mov", "avi", "mkv"].includes(e)) return VideoIcon;
  if (["zip", "dmg", "pkg", "tar", "gz"].includes(e)) return DownloadIcon;
  return DocumentIcon;
}

function formatSize(bytes: number): string {
  if (!bytes || bytes < 1024) return bytes ? `${bytes} B` : "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Preview column ──────────────────────────────────────────────────────────

function PreviewColumn({ entry }: { entry: FileEntry }) {
  const Icon = fileIcon(entry);
  return (
    <div className="h-full overflow-y-auto shrink-0 flex flex-col" style={{ width: 240 }}>
      <div className="flex justify-center pt-14 pb-5">
        <span className="opacity-30"><Icon className="w-16 h-16" /></span>
      </div>
      <div className="px-6 pb-6 text-center">
        <div className="text-[15px] font-medium" style={{ color: "#1d1a28" }}>{entry.name}</div>
        <div className="text-[12px] mt-1" style={{ color: "#6b6680" }}>
          {entry.size != null ? formatSize(entry.size) : "—"}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
        {[
          ["Kind", entry.kind === "folder" ? "Folder" : entry.mimeType ?? "Document"],
          ["Size", entry.size != null ? formatSize(entry.size) : "—"],
          ["Modified", entry.updatedAt
            ? new Date(entry.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : "—"],
        ].map(([label, value]) => (
          <div key={label} className="flex px-5 py-2.5 text-[12px]"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
            <span className="w-20 shrink-0" style={{ color: "#9b96a8" }}>{label}</span>
            <span className="truncate" style={{ color: "#3d3a4d" }}>{value}</span>
          </div>
        ))}
      </div>
      {/* Download link for files */}
      {entry.kind === "file" && (
        <div className="px-5 pt-4">
          <a
            href={FileSDKClient.getDownloadUrl(entry.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-[8px] text-[13px] transition-colors"
            style={{ color: "#7c6fd4" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,111,212,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      )}
    </div>
  );
}

// ── FilesApp ────────────────────────────────────────────────────────────────

export function FilesApp({ window: _win }: { window: WindowInstance }) {
  const isMobile = useDesktopStore((s) => s.isMobile);
  const showModal = useDesktopStore((s) => s.showModal);

  // Folder stack: each layer is { folderId, entries } — index 0 is root
  const [stack, setStack] = useState<{ folderId: string | null; entries: FileEntry[]; selectedIdx: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<FileEntry | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ label: string; pct: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag-and-drop state ──────────────────────────────────────────────────

  const [dragEntryId, setDragEntryId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const dragEntry = dragEntryId
    ? stack.flatMap((s) => s.entries).find((e) => e.id === dragEntryId) ?? null
    : null;

  // Load root folder
  useEffect(() => {
    loadFolder(null);
  }, []);

  async function loadFolder(folderId: string | null) {
    setLoading(true);
    setError(null);
    try {
      const entries = await FileSDKClient.list(folderId);
      setStack([{ folderId, entries, selectedIdx: -1 }]);
      setPreviewEntry(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load files");
      setStack([{ folderId: null, entries: [], selectedIdx: -1 }]);
    } finally {
      setLoading(false);
    }
  }

  async function navigateInto(idx: number, entry: FileEntry) {
    // Update selection in current column
    setStack((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], selectedIdx: idx };
      return updated;
    });

    if (entry.kind === "folder") {
      setLoading(true);
      setError(null);
      try {
        const entries = await FileSDKClient.list(entry.id);
        setStack((prev) => [...prev, { folderId: entry.id, entries, selectedIdx: -1 }]);
        setPreviewEntry(null);
      } catch (err: any) {
        setError(err.message ?? "Failed to open folder");
      } finally {
        setLoading(false);
      }
    } else {
      setPreviewEntry(entry);
    }
  }

  function selectColumn(colIdx: number, idx: number) {
    setStack((prev) => {
      const updated = [...prev];
      if (colIdx < updated.length) {
        updated[colIdx] = { ...updated[colIdx], selectedIdx: idx };
      }
      return updated;
    });
  }

  function goBack() {
    if (previewEntry) {
      setPreviewEntry(null);
      return;
    }
    if (stack.length <= 1) return;
    setStack((prev) => prev.slice(0, -1));
    setPreviewEntry(null);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadProgress({ label: file.name, pct: 0 });
    setError(null);

    try {
      const currentFolder = stack.length > 0 ? stack[stack.length - 1].folderId : null;

      // Step 1 — get a pre-signed S3 URL
      const { entry, uploadUrl } = await FileSDKClient.signUpload(
        file.name,
        file.type || "application/octet-stream",
        currentFolder,
      );

      // Step 2 — upload directly to S3 (bypasses Next.js server)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress({ label: file.name, pct: Math.round((ev.loaded / ev.total) * 100) });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`S3 upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      // Step 3 — confirm the upload so the DB record gets the real size
      await FileSDKClient.confirmUpload(entry.id, file.size);

      // Reload current folder
      await loadFolder(currentFolder);
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await FileSDKClient.delete(entryId);
      const currentFolder = stack.length > 0 ? stack[stack.length - 1].folderId : null;
      await loadFolder(currentFolder);
      setPreviewEntry(null);
    } catch (err: any) {
      setError(err.message ?? "Delete failed");
    }
  }

  /** Move an entry into a target folder via drag-and-drop. */
  async function handleMove(entryId: string, targetFolderId: string | null) {
    // No-op: moving into the folder it's already in
    const entry = stack.flatMap((s) => s.entries).find((e) => e.id === entryId);
    if (!entry) return;

    // Find which folder the entry is currently in
    const currentFolderId = stack.length > 0 ? stack[stack.length - 1].folderId : null;
    if (targetFolderId === currentFolderId) return;
    // Don't move a folder into itself
    if (entry.kind === "folder" && targetFolderId === entry.id) return;

    try {
      await FileSDKClient.move(entryId, targetFolderId);
      // Reload whichever column we're showing
      const idToReload = stack.length > 0 ? stack[stack.length - 1].folderId : null;
      await loadFolder(idToReload);
    } catch (err: any) {
      setError(err.message ?? "Move failed");
    }
  }

  // ── Drag-and-drop handlers ──────────────────────────────────────────────

  function onDragStart(entryId: string) {
    setDragEntryId(entryId);
  }

  function onDragOverFolder(e: React.DragEvent, folderId: string) {
    // Only accept drops onto folders that aren't the dragged item itself
    if (dragEntryId === folderId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId);
  }

  function onDragOverRoot(e: React.DragEvent) {
    // Dropping onto the column background means moving into that column's folder
    const colFolderId = stack.length > 0 ? stack[stack.length - 1].folderId : null;
    if (dragEntryId && colFolderId === dragEntryId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(null); // root column = no specific folder highlighted
  }

  function onDragLeaveFolder() {
    setDragOverFolderId(null);
  }

  async function onDrop(e: React.DragEvent, targetFolderId: string | null) {
    e.preventDefault();
    const entryId = dragEntryId;
    setDragEntryId(null);
    setDragOverFolderId(null);
    if (entryId) await handleMove(entryId, targetFolderId);
  }

  function onDragEnd() {
    setDragEntryId(null);
    setDragOverFolderId(null);
  }

  async function handleCreateFolder() {
    const name = await showModal(
      "New folder",
      "Enter a name for the new folder.",
      "prompt",
      { placeholder: "Folder name", defaultValue: "Untitled folder" },
    );

    // User cancelled
    if (!name || typeof name !== "string" || !name.trim()) return;

    try {
      const currentFolderId = stack.length > 0 ? stack[stack.length - 1].folderId : null;
      await FileSDKClient.createFolder(name.trim(), currentFolderId);
      await loadFolder(currentFolderId);
    } catch (err: any) {
      setError(err.message ?? "Failed to create folder");
    }
  }

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
    // Reset so the same file can be re-uploaded
    e.target.value = "";
  }, [stack]);

  const currentFolder = stack.length > 0 ? stack[stack.length - 1] : null;
  const hasPreview = previewEntry !== null;
  const canGoBack = stack.length > 1 || hasPreview;
  const selInCol = (ci: number) => (ci < stack.length ? stack[ci].selectedIdx : -1);

  // ── Mobile ────────────────────────────────────────────────────────────────

  if (isMobile) {
    const entries = currentFolder?.entries ?? [];
    return (
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0"
          style={{ background: "rgba(0,0,0,0.018)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <button onClick={goBack} disabled={!canGoBack}
            className="flex items-center justify-center w-8 h-8 rounded-[10px] transition-colors touch-target"
            style={{ color: canGoBack ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)" }}
          ><ArrowLeftIcon className="w-4 h-4" /></button>
          <span className="flex-1 text-[13px] font-medium truncate" style={{ color: "#1d1a28" }}>
            {stack.length > 1 ? stack[stack.length - 2].entries[selInCol(stack.length - 2)]?.name ?? "Files" : "Files"}
          </span>
          <span className="text-[11px]" style={{ color: "#9b96a8" }}>
            {entries.length} items{uploading ? " · uploading…" : ""}
          </span>
        </div>

        {/* Actions: upload + new folder */}
        <div className="px-3 py-2 flex gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 rounded-[10px] py-2 text-[12px] font-medium transition-colors touch-target"
            style={{
              background: "rgba(124,111,212,0.08)",
              color: "#7c6fd4",
              opacity: uploading ? 0.5 : 1,
            }}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                {uploadProgress ? `${uploadProgress.pct}%` : <Spinner />}
                {uploadProgress ? uploadProgress.label : "Uploading…"}
              </span>
            ) : (
              "Upload file"
            )}
          </button>
          <button
            onClick={handleCreateFolder}
            className="flex items-center justify-center gap-1 rounded-[10px] py-2 px-3 text-[12px] font-medium transition-colors touch-target shrink-0"
            style={{
              background: "rgba(0,0,0,0.04)",
              color: "#4a4658",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New folder
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFileInput} />
        </div>

        {/* Single column */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12" style={{ color: "#9b96a8" }}>
              <Spinner /><span className="ml-2 text-[13px]">Loading…</span>
            </div>
          )}
          {error && (
            <div className="mx-3 mt-3 rounded-[10px] px-3 py-2 text-[12px]"
              style={{ background: "rgba(239,68,68,0.06)", color: "#c41e1e" }}>
              {error}
              <button className="ml-2 underline" onClick={() => { const id = currentFolder?.folderId ?? null; loadFolder(id); }}>
                Retry
              </button>
            </div>
          )}
          {!loading && entries.map((entry, fi) => {
            const Icon = fileIcon(entry);
            const isDropTarget = dragOverFolderId === entry.id;
            const isDragging = dragEntryId === entry.id;
            return (
              <button key={entry.id}
                draggable
                onDragStart={() => onDragStart(entry.id)}
                onDragEnd={onDragEnd}
                onDragOver={
                  entry.kind === "folder"
                    ? (e) => onDragOverFolder(e, entry.id)
                    : undefined
                }
                onDragLeave={entry.kind === "folder" ? onDragLeaveFolder : undefined}
                onDrop={
                  entry.kind === "folder"
                    ? (e) => onDrop(e, entry.id)
                    : undefined
                }
                className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-left transition-colors outline-none"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.03)",
                  color: "#3d3a4d",
                  background: isDropTarget ? "rgba(124,111,212,0.25)" : "transparent",
                  opacity: isDragging ? 0.4 : 1,
                  outline: isDropTarget ? "2px solid rgba(124,111,212,0.5)" : "none",
                  outlineOffset: -2,
                }}
                onMouseEnter={(e) => {
                  if (!isDropTarget) e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isDropTarget) e.currentTarget.style.background = "transparent";
                }}
                onClick={() => { selectColumn(stack.length - 1, fi); navigateInto(fi, entry); }}
              >
                <span className="opacity-55"><Icon className="w-5 h-5 shrink-0" /></span>
                <span className="truncate flex-1">{entry.name}</span>
                {entry.kind === "folder" && (
                  <span className="text-[11px] opacity-30 shrink-0">
                    {isDropTarget ? "⬇" : "›"}
                  </span>
                )}
                {entry.size != null && entry.kind !== "folder" && (
                  <span className="text-[11px] shrink-0" style={{ color: "#9b96a8" }}>{formatSize(entry.size)}</span>
                )}
              </button>
            );
          })}
          {!loading && entries.length === 0 && !error && (
            <div className="px-4 py-12 text-center text-[14px]" style={{ color: "#9b96a8" }}>
              {stack.length === 1 ? "No files yet. Upload something!" : "Empty folder"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop ────────────────────────────────────────────────────────────────

  const cols = stack.map((s) => s.entries);
  const totalCols = cols.length + (hasPreview ? 1 : 0);

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

        {/* Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 px-3 h-7 rounded-[10px] text-[12px] font-medium transition-colors"
          style={{
            background: uploading ? "rgba(124,111,212,0.05)" : "rgba(124,111,212,0.08)",
            color: "#7c6fd4",
            opacity: uploading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = "rgba(124,111,212,0.16)"; }}
          onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.background = "rgba(124,111,212,0.08)"; }}
        >
          {uploading ? (
            <>{uploadProgress ? `${uploadProgress.pct}%` : <Spinner />}</>
          ) : (
            <span className="text-[16px] leading-none">+</span>
          )}
          {uploading ? (uploadProgress ? uploadProgress.label : "Uploading…") : "Upload"}
        </button>

        {/* New Folder */}
        <button
          onClick={handleCreateFolder}
          className="flex items-center gap-1 px-3 h-7 rounded-[10px] text-[12px] font-medium transition-colors"
          style={{ background: "rgba(0,0,0,0.04)", color: "#4a4658" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New folder
        </button>

        <input ref={fileInputRef} type="file" className="hidden" onChange={onFileInput} />

        {/* Path */}
        <div className="flex-1 flex items-center gap-1 text-[12px] mx-2" style={{ color: "#5e5a70" }}>
          {stack.map((s, ci) => {
            const name = s.selectedIdx >= 0 ? s.entries[s.selectedIdx]?.name : "Home";
            return (
              <span key={ci} className="flex items-center gap-1">
                {ci > 0 && <span className="opacity-30">›</span>}
                <span style={{ color: ci === stack.length - 1 && !hasPreview ? "#1d1a28" : "#5e5a70" }}>{name}</span>
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
          {stack.reduce((sum, s) => sum + s.entries.length, 0)} items
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 rounded-[10px] px-3 py-1.5 text-[12px] flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.06)", color: "#c41e1e" }}>
          <span className="flex-1">{error}</span>
          <button className="underline shrink-0" onClick={() => { const id = currentFolder?.folderId ?? null; loadFolder(id); }}>
            Retry
          </button>
        </div>
      )}

      {/* Columns */}
      <div className="flex-1 flex overflow-x-auto">
        {loading && (
          <div className="flex items-center justify-center w-full py-16" style={{ color: "#9b96a8" }}>
            <Spinner /><span className="ml-2 text-[14px]">Loading files…</span>
          </div>
        )}
        {!loading && cols.map((col, ci) => {
          const colFolderId = ci < stack.length ? stack[ci].folderId : null;
          return (
          <div key={ci} className="h-full overflow-y-auto shrink-0"
            style={{ width: 220, borderRight: ci < totalCols - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={(e) => onDrop(e, colFolderId)}
          >
            {col.map((entry, fi) => {
              const Icon = fileIcon(entry);
              const isSel = selInCol(ci) === fi;
              const isDropTarget = dragOverFolderId === entry.id;
              const isDragging = dragEntryId === entry.id;

              return (
                <button key={entry.id}
                  draggable
                  onDragStart={() => onDragStart(entry.id)}
                  onDragEnd={onDragEnd}
                  onDragOver={
                    entry.kind === "folder"
                      ? (e) => onDragOverFolder(e, entry.id)
                      : undefined
                  }
                  onDragLeave={entry.kind === "folder" ? onDragLeaveFolder : undefined}
                  onDrop={
                    entry.kind === "folder"
                      ? (e) => onDrop(e, entry.id)
                      : undefined
                  }
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] text-left transition-colors outline-none group"
                  style={{
                    background: isDropTarget
                      ? "rgba(124,111,212,0.25)"
                      : isSel ? "rgba(124,111,212,0.20)" : "transparent",
                    color: isSel ? "#1d1a28" : "#3d3a4d",
                    opacity: isDragging ? 0.4 : 1,
                    outline: isDropTarget ? "2px solid rgba(124,111,212,0.5)" : "none",
                    outlineOffset: -2,
                    borderRadius: isDropTarget ? 4 : 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSel && !isDropTarget) e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel && !isDropTarget) e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => { selectColumn(ci, fi); navigateInto(fi, entry); }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (confirm(`Delete "${entry.name}"?`)) {
                      handleDelete(entry.id);
                    }
                  }}
                >
                  <span className="opacity-55"><Icon className="w-4 h-4 shrink-0" /></span>
                  <span className="truncate">{entry.name}</span>
                  {entry.kind === "folder" && (
                    <span className="ml-auto text-[10px] opacity-35 shrink-0">
                      {isDropTarget ? "⬇" : "›"}
                    </span>
                  )}
                </button>
              );
            })}
            {col.length === 0 && !error && (
              <div className="px-4 py-8 text-center text-[13px]" style={{ color: "#9b96a8" }}>
                {stack.length === 1 && ci === 0 ? "No files yet" : "Empty folder"}
              </div>
            )}
          </div>
        )})}
        {!loading && hasPreview && <PreviewColumn entry={previewEntry!} />}
      </div>
    </div>
  );
}
