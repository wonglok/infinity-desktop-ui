"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type WindowInstance, useDesktopStore } from "../store";
import {
  FileSDKClient,
  type FileEntry,
} from "../../../../desktop-ui-app/sdk/fileSDKClient";
import {
  DocumentIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
  DownloadIcon,
  ArrowLeftIcon,
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
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── View mode icons ─────────────────────────────────────────────────────────

function ListIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function DetailIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="18" rx="1" />
      <line x1="3" y1="14" x2="10" y2="14" />
      <line x1="3" y1="18" x2="10" y2="18" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

type ViewMode = "list" | "detail" | "grid";

// ── FilesApp ────────────────────────────────────────────────────────────────

export function FilesApp({ window: _win }: { window: WindowInstance }) {
  const isMobile = useDesktopStore((s) => s.isMobile);
  const showModal = useDesktopStore((s) => s.showModal);

  // ── State ──────────────────────────────────────────────────────────────

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    label: string;
    pct: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── DnD state ──────────────────────────────────────────────────────────

  const [dragEntryId, setDragEntryId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // ── Drag-to-select ──────────────────────────────────────────────────────

  const contentRef = useRef<HTMLDivElement>(null);
  const [selectRect, setSelectRect] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const selectStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectRectRef = useRef(selectRect);
  selectRectRef.current = selectRect;

  // ── Context menu ────────────────────────────────────────────────────────

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    entry: FileEntry;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  function closeContextMenu() {
    setContextMenu(null);
  }

  function openContextMenu(e: React.MouseEvent, entry: FileEntry) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }

  // Esc key and click-outside listeners
  useEffect(() => {
    if (!contextMenu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeContextMenu();
    }
    function onClick(e: MouseEvent) {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      )
        closeContextMenu();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [contextMenu]);

  // ── Load folder ────────────────────────────────────────────────────────

  async function loadFolder(folderId: string | null) {
    setLoading(true);
    setError(null);
    try {
      const list = await FileSDKClient.list(folderId);
      setEntries(list);
      setCurrentFolderId(folderId);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message ?? "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  async function reloadCurrent() {
    await loadFolder(currentFolderId);
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  function navigateToFolder(entry: FileEntry) {
    setBreadcrumb((prev) => [...prev, { id: entry.id, name: entry.name }]);
    loadFolder(entry.id);
  }

  function navigateToBreadcrumb(index: number) {
    if (index < 0) {
      // Go to root
      setBreadcrumb([]);
      loadFolder(null);
    } else {
      const crumb = breadcrumb[index];
      setBreadcrumb((prev) => prev.slice(0, index + 1));
      loadFolder(crumb.id);
    }
  }

  useEffect(() => {
    loadFolder(null);
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadProgress({ label: file.name, pct: 0 });
    setError(null);
    try {
      const { entry, uploadUrl } = await FileSDKClient.signUpload(
        file.name,
        file.type || "application/octet-stream",
        currentFolderId,
      );
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream",
        );
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable)
            setUploadProgress({
              label: file.name,
              pct: Math.round((ev.loaded / ev.total) * 100),
            });
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`S3 upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });
      await FileSDKClient.confirmUpload(entry.id, file.size);
      await reloadCurrent();
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
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
      await reloadCurrent();
    } catch (err: any) {
      setError(err.message ?? "Delete failed");
    }
  }

  async function handleDeleteWithConfirm(entry: FileEntry) {
    closeContextMenu();
    const confirmed = await showModal(
      "Delete file",
      `Are you sure you want to delete "${entry.name}"?`,
      "confirm",
    );
    if (confirmed) handleDelete(entry.id);
  }

  async function handleRename(entry: FileEntry) {
    closeContextMenu();
    const newName = await showModal(
      "Rename",
      `Enter a new name for "${entry.name}".`,
      "prompt",
      { placeholder: "New name", defaultValue: entry.name },
    );
    if (!newName || typeof newName !== "string" || !newName.trim()) return;
    if (newName.trim() === entry.name) return;
    try {
      await FileSDKClient.rename(entry.id, newName.trim());
      await reloadCurrent();
    } catch (err: any) {
      setError(err.message ?? "Rename failed");
    }
  }

  async function handleMove(entryId: string, targetFolderId: string | null) {
    // Dropping into root or current folder — skip
    if (!targetFolderId) return;
    try {
      await FileSDKClient.move(entryId, targetFolderId);
      await reloadCurrent();
    } catch (err: any) {
      setError(err.message ?? "Move failed");
    }
  }

  async function handleCreateFolder() {
    const name = await showModal(
      "New folder",
      "Enter a name for the new folder.",
      "prompt",
      {
        placeholder: "Folder name",
        defaultValue: "Untitled folder",
      },
    );
    if (!name || typeof name !== "string" || !name.trim()) return;
    try {
      await FileSDKClient.createFolder(name.trim(), currentFolderId);
      await reloadCurrent();
    } catch (err: any) {
      setError(err.message ?? "Failed to create folder");
    }
  }

  async function handleGroupIntoFolder() {
    if (selectedIds.size === 0) return;

    // Determine next available sub-folder name
    const existingNames = entries
      .filter((e) => e.kind === "folder")
      .map((e) => e.name);
    let max = 0;
    const re = /^new-sub-folder-(\d+)$/;
    for (const name of existingNames) {
      const m = name.match(re);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    const folderName = `new-sub-folder-${String(max + 1).padStart(3, "0")}`;

    const ids = Array.from(selectedIds);
    try {
      // Create the folder
      const folderEntry = await FileSDKClient.createFolder(
        folderName,
        currentFolderId,
      );
      // Move selected items into the new folder in parallel
      await Promise.all(
        ids.map((id) => FileSDKClient.move(id, folderEntry.id)),
      );
      setSelectedIds(new Set());
      await reloadCurrent();
    } catch (err: any) {
      setError(err.message ?? "Failed to group items");
    }
  }

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleUpload(f);
      e.target.value = "";
    },
    [currentFolderId],
  );

  // ── Entry row ──────────────────────────────────────────────────────────

  function entryRow(entry: FileEntry, compact = false) {
    const Icon = fileIcon(entry);
    const isSel = selectedIds.has(entry.id);
    const isDropTarget = dragOverFolderId === entry.id;
    const isDragging = dragEntryId === entry.id;

    function handleClick(e: React.MouseEvent) {
      if (e.metaKey || e.ctrlKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(entry.id)) next.delete(entry.id);
          else next.add(entry.id);
          return next;
        });
      } else {
        setSelectedIds(new Set([entry.id]));
      }
    }

    return (
      <div
        key={entry.id}
        draggable
        onDragStart={() => setDragEntryId(entry.id)}
        onDragEnd={() => {
          setDragEntryId(null);
          setDragOverFolderId(null);
        }}
        onDragOver={
          entry.kind === "folder"
            ? (e) => {
                if (dragEntryId && dragEntryId !== entry.id) {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverFolderId(entry.id);
                }
              }
            : undefined
        }
        onDragLeave={() => setDragOverFolderId(null)}
        onDrop={
          entry.kind === "folder"
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                const eid = dragEntryId;
                setDragEntryId(null);
                setDragOverFolderId(null);
                if (eid && eid !== entry.id) handleMove(eid, entry.id);
              }
            : undefined
        }
        onClick={handleClick}
        onDoubleClick={() => {
          if (entry.kind === "folder") navigateToFolder(entry);
          else if (entry.cdnUrl) window.open(entry.cdnUrl, "_blank");
        }}
        onContextMenu={(e) => openContextMenu(e, entry)}
        data-entry-id={entry.id}
        className={`flex items-center gap-2 transition-colors outline-none cursor-default ${compact ? "px-3 py-1.5 text-[13px]" : "px-4 py-2 text-[14px]"}`}
        style={{
          background: isDropTarget
            ? "rgba(124,111,212,0.25)"
            : isSel
              ? "rgba(124,111,212,0.12)"
              : "transparent",
          color: isSel ? "#1d1a28" : "#3d3a4d",
          opacity: isDragging ? 0.4 : 1,
          outline: isDropTarget ? "2px solid rgba(124,111,212,0.5)" : "none",
          outlineOffset: -2,
          borderBottom: compact
            ? "1px solid rgba(0,0,0,0.03)"
            : "1px solid rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => {
          if (!isSel && !isDropTarget)
            e.currentTarget.style.background = "rgba(0,0,0,0.02)";
        }}
        onMouseLeave={(e) => {
          if (!isSel && !isDropTarget)
            e.currentTarget.style.background = "transparent";
        }}
      >
        <span className="opacity-55 shrink-0">
          <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
        </span>
        <span
          className="truncate flex-1 font-medium"
          style={{ fontSize: compact ? "13px" : "14px" }}
        >
          {entry.name}
        </span>
        {!compact && entry.kind !== "folder" && (
          <>
            <span
              className="text-[12px] shrink-0 w-16 text-right"
              style={{ color: "#9b96a8" }}
            >
              {formatSize(entry.size ?? 0)}
            </span>
            <span
              className="text-[12px] shrink-0 w-28"
              style={{ color: "#9b96a8" }}
            >
              {entry.mimeType ?? "—"}
            </span>
            <span
              className="text-[12px] shrink-0 w-32"
              style={{ color: "#9b96a8" }}
            >
              {formatDate(entry.updatedAt)}
            </span>
          </>
        )}
        {compact && entry.kind !== "folder" && entry.size != null && (
          <span className="text-[11px] shrink-0" style={{ color: "#9b96a8" }}>
            {formatSize(entry.size)}
          </span>
        )}
      </div>
    );
  }

  // ── Toolbar ────────────────────────────────────────────────────────────

  const toolbar = (
    <div
      className="flex items-center gap-1.5 px-3 py-2 shrink-0"
      style={{
        background: "rgba(0,0,0,0.018)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Back */}
      <button
        onClick={() => {
          if (breadcrumb.length === 0) return;
          navigateToBreadcrumb(breadcrumb.length - 2);
        }}
        disabled={breadcrumb.length === 0}
        className="flex items-center justify-center w-7 h-7 rounded-[8px] transition-colors"
        style={{
          color: breadcrumb.length > 0 ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)",
        }}
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center gap-0.5 text-[12px] mx-1 overflow-hidden">
        <button
          className="shrink-0 hover:underline"
          style={{ color: currentFolderId === null ? "#1d1a28" : "#5e5a70" }}
          onClick={() => navigateToBreadcrumb(-1)}
        >
          Home
        </button>
        {breadcrumb.map((c, i) => (
          <span key={c.id} className="flex items-center gap-0.5 shrink-0">
            <span className="opacity-30">›</span>
            <button
              className="hover:underline truncate max-w-[140px]"
              style={{
                color: i === breadcrumb.length - 1 ? "#1d1a28" : "#5e5a70",
              }}
              onClick={() => navigateToBreadcrumb(i)}
            >
              {c.name}
            </button>
          </span>
        ))}
      </div>

      {/* View switcher */}
      <div
        className="flex items-center rounded-[8px] overflow-hidden"
        style={{ border: "1px solid rgba(0,0,0,0.08)" }}
      >
        {(["list", "detail", "grid"] as ViewMode[]).map((m) => (
          <button
            key={m}
            className="flex items-center justify-center w-7 h-6 transition-colors"
            style={{
              background: viewMode === m ? "rgba(0,0,0,0.06)" : "transparent",
              color: viewMode === m ? "#1d1a28" : "rgba(0,0,0,0.3)",
            }}
            onClick={() => setViewMode(m)}
            title={`${m} view`}
          >
            {m === "list" ? (
              <ListIcon />
            ) : m === "detail" ? (
              <DetailIcon />
            ) : (
              <GridIcon />
            )}
          </button>
        ))}
      </div>

      {/* Add file */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 px-2.5 h-6.5 rounded-[8px] text-[11px] font-medium transition-colors"
        style={{
          background: uploading
            ? "rgba(124,111,212,0.05)"
            : "rgba(124,111,212,0.08)",
          color: "#7c6fd4",
          opacity: uploading ? 0.5 : 1,
        }}
      >
        {uploading ? (
          uploadProgress ? (
            `${uploadProgress.pct}%`
          ) : (
            <Spinner />
          )
        ) : (
          <span className="text-[15px] leading-none -mt-px">+</span>
        )}
        <span className="hidden sm:inline ml-0.5">
          {uploading
            ? uploadProgress
              ? uploadProgress.label
              : "Uploading"
            : "File"}
        </span>
      </button>

      {/* Add folder */}
      <button
        onClick={handleCreateFolder}
        className="flex items-center gap-1 px-2.5 h-6.5 rounded-[8px] text-[11px] font-medium transition-colors"
        style={{ background: "rgba(0,0,0,0.04)", color: "#4a4658" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.04)";
        }}
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="hidden sm:inline">Folder</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileInput}
      />
    </div>
  );

  // ── Selection actions toolbar ───────────────────────────────────────────

  const selectionToolbar =
    selectedIds.size > 0 ? (
      <div
        className="flex items-center gap-2 px-3 py-1.5 shrink-0"
        style={{
          background: "rgba(124,111,212,0.06)",
          borderBottom: "1px solid rgba(124,111,212,0.12)",
        }}
      >
        <span className="text-[12px] font-medium" style={{ color: "#5e5a70" }}>
          {selectedIds.size} selected
        </span>

        <button
          onClick={handleGroupIntoFolder}
          className="flex items-center gap-1 px-2.5 h-6.5 rounded-[8px] text-[11px] font-medium transition-colors"
          style={{ background: "rgba(124,111,212,0.1)", color: "#7c6fd4" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(124,111,212,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(124,111,212,0.1)")
          }
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          Group into sub-folder
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setSelectedIds(new Set())}
          className="flex items-center gap-1 px-2 h-6 rounded-[6px] text-[11px] transition-colors"
          style={{ color: "#9b96a8" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Clear
        </button>
      </div>
    ) : null;

  // ── Error banner ───────────────────────────────────────────────────────

  const errorBanner = error ? (
    <div
      className="mx-3 mt-2 rounded-[10px] px-3 py-1.5 text-[12px] flex items-center gap-2"
      style={{ background: "rgba(239,68,68,0.06)", color: "#c41e1e" }}
    >
      <span className="flex-1">{error}</span>
      <button className="underline shrink-0" onClick={reloadCurrent}>
        Retry
      </button>
    </div>
  ) : null;

  // ── Loading ────────────────────────────────────────────────────────────

  const loadingView = loading ? (
    <div
      className="flex items-center justify-center py-16"
      style={{ color: "#9b96a8" }}
    >
      <Spinner />
      <span className="ml-2 text-[14px]">Loading…</span>
    </div>
  ) : null;

  // ── Drag-to-select effect ───────────────────────────────────────────────

  const isDraggingSelect = selectRect !== null;

  useEffect(() => {
    if (!isDraggingSelect) return;
    function onMove(e: MouseEvent) {
      if (!contentRef.current || !selectStartRef.current) return;
      const r = contentRef.current.getBoundingClientRect();
      setSelectRect({
        x1: selectStartRef.current.x,
        y1: selectStartRef.current.y,
        x2: e.clientX - r.left + contentRef.current.scrollLeft,
        y2: e.clientY - r.top + contentRef.current.scrollTop,
      });
    }
    function onUp() {
      const rect = selectRectRef.current;
      if (!rect || !contentRef.current) {
        setSelectRect(null);
        selectStartRef.current = null;
        return;
      }
      // Compute intersection with entry elements
      const entries = contentRef.current.querySelectorAll("[data-entry-id]");
      const ids = new Set<string>();
      const rx1 = Math.min(rect.x1, rect.x2);
      const ry1 = Math.min(rect.y1, rect.y2);
      const rx2 = Math.max(rect.x1, rect.x2);
      const ry2 = Math.max(rect.y1, rect.y2);
      const minArea = 4; // require meaningful drag

      if ((rx2 - rx1) * (ry2 - ry1) >= minArea) {
        for (const el of entries) {
          const b = el.getBoundingClientRect();
          const cr = contentRef.current.getBoundingClientRect();
          const ex1 = b.left - cr.left + contentRef.current.scrollLeft;
          const ey1 = b.top - cr.top + contentRef.current.scrollTop;
          const ex2 = ex1 + b.width;
          const ey2 = ey1 + b.height;
          // Check rectangle intersection
          if (rx1 < ex2 && rx2 > ex1 && ry1 < ey2 && ry2 > ey1) {
            ids.add(el.getAttribute("data-entry-id")!);
          }
        }
      }
      if (ids.size > 0) setSelectedIds(ids);
      setSelectRect(null);
      selectStartRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingSelect]);

  function handleContentMouseDown(e: React.MouseEvent) {
    // Only start selection on left-click on empty space
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-entry-id]")) return;
    if (!contentRef.current) return;
    const r = contentRef.current.getBoundingClientRect();
    selectStartRef.current = {
      x: e.clientX - r.left + contentRef.current.scrollLeft,
      y: e.clientY - r.top + contentRef.current.scrollTop,
    };
    setSelectRect({
      x1: selectStartRef.current.x,
      y1: selectStartRef.current.y,
      x2: selectStartRef.current.x,
      y2: selectStartRef.current.y,
    });
  }

  // ── Content area ───────────────────────────────────────────────────────

  const contentArea = (
    <div
      ref={contentRef}
      className="flex-1 overflow-y-auto relative select-none"
      onMouseDown={handleContentMouseDown}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const eid = dragEntryId;
        setDragEntryId(null);
        setDragOverFolderId(null);
        if (eid) handleMove(eid, currentFolderId);
      }}
    >
      {errorBanner}
      {loadingView}

      {/* Selection rectangle overlay */}
      {selectRect && (
        <div
          className="absolute pointer-events-none z-40"
          style={{
            left: Math.min(selectRect.x1, selectRect.x2),
            top: Math.min(selectRect.y1, selectRect.y2),
            width: Math.abs(selectRect.x2 - selectRect.x1),
            height: Math.abs(selectRect.y2 - selectRect.y1),
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.5)",
          }}
        />
      )}
      {!loading &&
        (viewMode === "grid" ? (
          <div
            className="p-4 grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            }}
          >
            {entries.map((entry) => {
              const Icon = fileIcon(entry);
              const isSel = selectedIds.has(entry.id);
              const isDropTarget = dragOverFolderId === entry.id;
              const isDragging = dragEntryId === entry.id;

              function handleClick(e: React.MouseEvent) {
                if (e.metaKey || e.ctrlKey) {
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(entry.id)) next.delete(entry.id);
                    else next.add(entry.id);
                    return next;
                  });
                } else {
                  setSelectedIds(new Set([entry.id]));
                }
              }

              return (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => setDragEntryId(entry.id)}
                  onDragEnd={() => {
                    setDragEntryId(null);
                    setDragOverFolderId(null);
                  }}
                  onDragOver={
                    entry.kind === "folder"
                      ? (e) => {
                          if (dragEntryId && dragEntryId !== entry.id) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverFolderId(entry.id);
                          }
                        }
                      : undefined
                  }
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={
                    entry.kind === "folder"
                      ? (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const eid = dragEntryId;
                          setDragEntryId(null);
                          setDragOverFolderId(null);
                          if (eid && eid !== entry.id)
                            handleMove(eid, entry.id);
                        }
                      : undefined
                  }
                  data-entry-id={entry.id}
                  className="flex flex-col items-center gap-1 p-2 rounded-[10px] transition-colors cursor-default text-center"
                  style={{
                    background: isDropTarget
                      ? "rgba(124,111,212,0.25)"
                      : isSel
                        ? "rgba(124,111,212,0.12)"
                        : "transparent",
                    opacity: isDragging ? 0.4 : 1,
                    outline: isDropTarget
                      ? "2px solid rgba(124,111,212,0.5)"
                      : "none",
                    outlineOffset: -2,
                  }}
                  onClick={handleClick}
                  onDoubleClick={() => {
                    if (entry.kind === "folder") navigateToFolder(entry);
                    else if (entry.cdnUrl) window.open(entry.cdnUrl, "_blank");
                  }}
                  onContextMenu={(e) => openContextMenu(e, entry)}
                  onMouseEnter={(e) => {
                    if (!isSel && !isDropTarget)
                      e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel && !isDropTarget)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon className="w-10 h-10 opacity-60" />
                  <span
                    className="text-[11px] leading-tight text-center break-all line-clamp-2"
                    style={{ color: "#3d3a4d" }}
                  >
                    {entry.name}
                  </span>
                </div>
              );
            })}
            {entries.length === 0 && !error && (
              <div
                className="col-span-full py-16 text-center text-[13px]"
                style={{ color: "#9b96a8" }}
              >
                Empty folder
              </div>
            )}
          </div>
        ) : viewMode === "detail" ? (
          <div>
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                color: "#9b96a8",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <span className="w-5" />
              <span className="flex-1">Name</span>
              <span className="w-16 text-right">Size</span>
              <span className="w-28">Type</span>
              <span className="w-32">Modified</span>
            </div>
            {entries.map((e) => entryRow(e, false))}
            {entries.length === 0 && !error && (
              <div
                className="py-16 text-center text-[13px]"
                style={{ color: "#9b96a8" }}
              >
                Empty folder
              </div>
            )}
          </div>
        ) : (
          <div>
            {entries.map((e) => entryRow(e, true))}
            {entries.length === 0 && !error && (
              <div
                className="py-16 text-center text-[13px]"
                style={{ color: "#9b96a8" }}
              >
                Empty folder
              </div>
            )}
          </div>
        ))}
    </div>
  );

  // ── Context menu ────────────────────────────────────────────────────────

  const contextMenuEl = contextMenu ? (
    <div
      ref={contextMenuRef}
      className="fixed z-50 min-w-[160px] rounded-[10px] py-1 shadow-lg"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {contextMenu.entry.kind !== "folder" && contextMenu.entry.cdnUrl && (
        <button
          className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] text-left transition-colors"
          style={{ color: "#3d3a4d" }}
          onClick={() => {
            closeContextMenu();
            window.open(contextMenu.entry.cdnUrl!, "_blank");
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <svg
            className="w-3.5 h-3.5 opacity-50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Open
        </button>
      )}
      <button
        className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] text-left transition-colors"
        style={{ color: "#3d3a4d" }}
        onClick={() => handleRename(contextMenu.entry)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(0,0,0,0.04)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <svg
          className="w-3.5 h-3.5 opacity-50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Rename
      </button>
      <hr
        style={{
          margin: "4px 0",
          border: "none",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      />
      <button
        className="flex items-center gap-2 w-full px-3 py-1.5 text-[13px] text-left transition-colors"
        style={{ color: "#d32f2f" }}
        onClick={() => handleDeleteWithConfirm(contextMenu.entry)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(211,47,47,0.06)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <svg
          className="w-3.5 h-3.5 opacity-60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete
      </button>
    </div>
  ) : null;

  // ── Mobile ─────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        {toolbar}
        {selectionToolbar}
        {contentArea}
        {contextMenuEl}
      </div>
    );
  }

  // ── Desktop ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {toolbar}
      {selectionToolbar}
      {contentArea}
      {contextMenuEl}
    </div>
  );
}
