// ── Client-safe types (duplicated to avoid pulling Mongoose into the browser) ──

export interface FileEntry {
  id: string;
  name: string;
  kind: "folder" | "file";
  size?: number;
  mimeType?: string;
  ext?: string;
  cdnUrl?: string | null;
  children?: FileEntry[];
  updatedAt?: string;
}

/**
 * Client-side FileSDK — calls the /api/files endpoints.
 *
 * Use this in client components where the server-side FileSDK (Mongoose + S3)
 * cannot run directly.
 */
export class FileSDKClient {
  // ── List ──────────────────────────────────────────────────────────────

  static async list(folderId: string | null = null): Promise<FileEntry[]> {
    const params = new URLSearchParams();
    if (folderId) params.set("folderId", folderId);

    const res = await fetch(`/api/files?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Network error" }));
      throw new Error(err.error ?? "Failed to list files");
    }

    const data = await res.json();
    return data.entries ?? [];
  }

  // ── Pre-signed upload (client → S3 directly, bypassing Next.js server) ──

  /** Step 1: get a pre-signed S3 upload URL + create a pending DB record. */
  static async signUpload(
    name: string,
    mimeType: string,
    folderId: string | null = null,
  ): Promise<{ entry: FileEntry; uploadUrl: string }> {
    const res = await fetch("/api/files/sign-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType, folderId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Sign upload failed" }));
      throw new Error(err.error ?? "Sign upload failed");
    }
    return res.json();
  }

  /** Step 2: confirm a completed S3 upload by updating the file size. */
  static async confirmUpload(id: string, size: number): Promise<FileEntry> {
    const res = await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm-upload", size }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Confirm upload failed" }));
      throw new Error(err.error ?? "Confirm upload failed");
    }
    const data = await res.json();
    return data.entry;
  }

  // ── Upload (legacy: via server — kept for small files) ────────────────

  static async upload(file: File, folderId: string | null = null): Promise<FileEntry> {
    const form = new FormData();
    form.append("file", file);
    if (folderId) form.append("folderId", folderId);

    const res = await fetch("/api/files", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error ?? "Upload failed");
    }

    const data = await res.json();
    return data.entry;
  }

  // ── Delete ────────────────────────────────────────────────────────────

  static async delete(id: string): Promise<void> {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Delete failed" }));
      throw new Error(err.error ?? "Delete failed");
    }
  }

  // ── Rename ────────────────────────────────────────────────────────────

  static async rename(id: string, name: string): Promise<FileEntry> {
    const res = await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Rename failed" }));
      throw new Error(err.error ?? "Rename failed");
    }

    const data = await res.json();
    return data.entry;
  }

  // ── Move ──────────────────────────────────────────────────────────────

  static async move(id: string, folderId: string | null): Promise<FileEntry> {
    const res = await fetch(`/api/files/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Move failed" }));
      throw new Error(err.error ?? "Move failed");
    }

    const data = await res.json();
    return data.entry;
  }

  // ── Create folder ──────────────────────────────────────────────────────

  static async createFolder(name: string, folderId: string | null = null): Promise<FileEntry> {
    const res = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createFolder", name, folderId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Create folder failed" }));
      throw new Error(err.error ?? "Create folder failed");
    }

    const data = await res.json();
    return data.entry;
  }

  // ── Download URL ──────────────────────────────────────────────────────

  static getDownloadUrl(id: string): string {
    return `/api/files/${id}?action=download`;
  }
}
