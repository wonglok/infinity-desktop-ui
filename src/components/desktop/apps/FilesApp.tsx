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

// ── Chevron ─────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className="w-3 h-3 shrink-0 transition-transform"
      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 5 7 7-7 7" />
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

// ── Tree node ───────────────────────────────────────────────────────────────

interface TreeNode {
  entry: FileEntry;
  children: TreeNode[];
  loaded: boolean;
}

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

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [treeExpanded, setTreeExpanded] = useState<Set<string>>(new Set());
  const [treeRoot, setTreeRoot] = useState<TreeNode[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    label: string;
    pct: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── DnD state ──────────────────────────────────────────────────────────

  const [dragEntryId, setDragEntryId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // ── Load folder ────────────────────────────────────────────────────────

  async function loadFolder(folderId: string | null) {
    setLoading(true);
    setError(null);
    try {
      const list = await FileSDKClient.list(folderId);
      setEntries(list);
      setCurrentFolderId(folderId);
      setSelectedEntryId(null);
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

  // ── Tree ───────────────────────────────────────────────────────────────

  async function loadTreeNode(
    folderId: string | null,
    autoExpand = false,
  ): Promise<TreeNode[]> {
    const list = await FileSDKClient.list(folderId);
    const folders = list.filter((e) => e.kind === "folder");
    const nodes: TreeNode[] = folders.map((e) => ({
      entry: e,
      children: [],
      loaded: false,
    }));

    // Auto-expand first level: load children for each root folder
    if (autoExpand) {
      const expandIds = new Set<string>();
      for (const node of nodes) {
        node.children = await loadTreeNode(node.entry.id, false);
        node.loaded = true;
        expandIds.add(node.entry.id);
      }
      setTreeExpanded(expandIds);
    }

    return nodes;
  }

  useEffect(() => {
    loadFolder(null);
    loadTreeNode(null, true).then(setTreeRoot);
  }, []);

  async function toggleTreeExpand(node: TreeNode) {
    const id = node.entry.id;

    if (treeExpanded.has(id)) {
      // Collapse
      setTreeExpanded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      // Expand — load children if needed
      if (!node.loaded) {
        node.children = await loadTreeNode(id);
        node.loaded = true;
      }
      setTreeExpanded((prev) => new Set(prev).add(id));
      setTreeRoot([...treeRoot]); // trigger re-render for loaded children
    }

    // Navigate into this folder
    navigateToFolder(node.entry);
  }

  function TreeBranch({ nodes, depth }: { nodes: TreeNode[]; depth: number }) {
    return (
      <>
        {nodes.map((node) => {
          const expanded = treeExpanded.has(node.entry.id);
          const isActive = currentFolderId === node.entry.id;
          return (
            <div key={node.entry.id}>
              <button
                className="flex items-center gap-1 w-full py-1 pr-2 text-[12px] text-left transition-colors rounded-[6px]"
                style={{
                  paddingLeft: 8 + depth * 16,
                  background: isActive
                    ? "rgba(124,111,212,0.15)"
                    : "transparent",
                  color: isActive ? "#1d1a28" : "#4a4658",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
                onClick={() => toggleTreeExpand(node)}
                draggable
                onDragStart={() => setDragEntryId(node.entry.id)}
                onDragEnd={() => {
                  setDragEntryId(null);
                  setDragOverFolderId(null);
                }}
                onDragOver={(e) => {
                  if (dragEntryId && dragEntryId !== node.entry.id) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverFolderId(node.entry.id);
                  }
                }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const entryId = dragEntryId;
                  setDragEntryId(null);
                  setDragOverFolderId(null);
                  if (entryId && entryId !== node.entry.id)
                    handleMove(entryId, node.entry.id);
                }}
              >
                <Chevron open={expanded} />
                <FolderIcon className="w-3.5 h-3.5 shrink-0 opacity-50" />
                <span className="truncate">{node.entry.name}</span>
              </button>
              {expanded && node.children.length > 0 && (
                <TreeBranch nodes={node.children} depth={depth + 1} />
              )}
            </div>
          );
        })}
      </>
    );
  }

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
      // Refresh tree
      loadTreeNode(null).then(setTreeRoot);
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
      setSelectedEntryId(null);
      await reloadCurrent();
      loadTreeNode(null).then(setTreeRoot);
    } catch (err: any) {
      setError(err.message ?? "Delete failed");
    }
  }

  async function handleMove(entryId: string, targetFolderId: string | null) {
    // Dropping into root or current folder — skip
    if (!targetFolderId) return;
    try {
      await FileSDKClient.move(entryId, targetFolderId);
      await reloadCurrent();
      loadTreeNode(null).then(setTreeRoot);
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
      loadTreeNode(null).then(setTreeRoot);
    } catch (err: any) {
      setError(err.message ?? "Failed to create folder");
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
    const isSel = selectedEntryId === entry.id;
    const isDropTarget = dragOverFolderId === entry.id;
    const isDragging = dragEntryId === entry.id;

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
        onClick={() => {
          setSelectedEntryId(entry.id);
          if (entry.kind === "folder") navigateToFolder(entry);
        }}
        onDoubleClick={() => {
          if (entry.kind === "folder") navigateToFolder(entry);
          else if (entry.cdnUrl) window.open(entry.cdnUrl, "_blank");
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (confirm(`Delete "${entry.name}"?`)) handleDelete(entry.id);
        }}
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

  // ── Content area ───────────────────────────────────────────────────────

  const contentArea = (
    <div
      className="flex-1 overflow-y-auto"
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
              const isSel = selectedEntryId === entry.id;
              const isDropTarget = dragOverFolderId === entry.id;
              const isDragging = dragEntryId === entry.id;
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
                  onClick={() => {
                    setSelectedEntryId(entry.id);
                    if (entry.kind === "folder") navigateToFolder(entry);
                  }}
                  onDoubleClick={() => {
                    if (entry.kind === "folder") navigateToFolder(entry);
                    else if (entry.cdnUrl) window.open(entry.cdnUrl, "_blank");
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (confirm(`Delete "${entry.name}"?`))
                      handleDelete(entry.id);
                  }}
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

  // ── Sidebar ────────────────────────────────────────────────────────────

  const sidebar = sidebarOpen ? (
    <div
      className="shrink-0 overflow-y-auto"
      style={{ width: 200, borderRight: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div
        className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "#9b96a8" }}
      >
        Folders
      </div>
      <TreeBranch nodes={treeRoot} depth={0} />
    </div>
  ) : null;

  // ── Mobile ─────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        {toolbar}
        {contentArea}
      </div>
    );
  }

  // ── Desktop ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col">
      {toolbar}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar toggle */}
        <button
          className="shrink-0 flex items-center justify-center transition-colors"
          style={{
            width: 12,
            background: "rgba(0,0,0,0.015)",
            borderRight: "1px solid rgba(0,0,0,0.06)",
          }}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <svg
            className="w-2.5 h-2.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              color: "rgba(0,0,0,0.25)",
              transform: sidebarOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path d="m9 5 7 7-7 7" />
          </svg>
        </button>
        {sidebar}
        {contentArea}
      </div>
    </div>
  );
}
