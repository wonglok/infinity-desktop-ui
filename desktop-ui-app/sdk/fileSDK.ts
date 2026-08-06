import { dbConnect } from "../utils/dbConnect";
import { FileModel, type IFile, type IFileDocument } from "../models/File";
import {
  uploadToS3,
  deleteFromS3,
  makeS3Key,
  toCdnUrl,
  getDownloadSignedUrl,
  getUploadSignedUrl,
} from "../utils/s3";

// ── Public types ───────────────────────────────────────────────────────────

export interface FileEntry {
  id: string;
  name: string;
  kind: "folder" | "file";
  size?: number; // bytes
  mimeType?: string;
  ext?: string;
  cdnUrl?: string | null;
  children?: FileEntry[];
  updatedAt?: string;
}

export interface CreateFileInput {
  name: string;
  folderId?: string | null;
  body: Buffer | Blob | string;
  mimeType?: string;
}

export interface UploadSignedUrlInput {
  name: string;
  folderId?: string | null;
  mimeType: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toEntry(doc: IFileDocument): FileEntry {
  const ext = doc.isFolder ? undefined : doc.name.split(".").pop()?.toLowerCase();
  return {
    id: String(doc._id),
    name: doc.name,
    kind: doc.isFolder ? "folder" : "file",
    size: doc.size,
    mimeType: doc.mimeType,
    ext,
    cdnUrl: doc.cdnUrl,
    updatedAt: (doc.updatedAt ?? doc.createdAt)?.toISOString(),
  };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── SDK ────────────────────────────────────────────────────────────────────

export class FileSDK {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ── List ──────────────────────────────────────────────────────────────

  /** List files and folders inside a given folder (null = root). */
  async list(folderId: string | null = null): Promise<FileEntry[]> {
    await dbConnect();

    const docs = await FileModel.find({
      userId: this.userId,
      folderId: folderId ?? null,
    })
      .sort({ isFolder: -1, name: 1 }) // folders first, then alpha
      .lean();

    return docs.map(toEntry);
  }

  /** Build a full tree from root (for initial load). */
  async tree(): Promise<FileEntry[]> {
    await dbConnect();

    const docs = await FileModel.find({ userId: this.userId })
      .sort({ isFolder: -1, name: 1 })
      .lean();

    const map = new Map<string, FileEntry[]>();
    const roots: FileEntry[] = [];

    for (const doc of docs) {
      const entry = toEntry(doc as IFileDocument);
      const parentId = doc.folderId ? String(doc.folderId) : "__root__";

      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(entry);

      if (doc.isFolder) {
        entry.children = [];
      }
    }

    // Wire children
    for (const doc of docs) {
      if (doc.isFolder) {
        const id = String(doc._id);
        const entry = findById(map, id);
        if (entry) {
          entry.children = map.get(id) ?? [];
        }
      }
    }

    return map.get("__root__") ?? [];
  }

  // ── Create folder ─────────────────────────────────────────────────────

  async createFolder(name: string, folderId: string | null = null): Promise<FileEntry> {
    await dbConnect();

    const folderKey = `folders/${this.userId}/${Date.now()}-${name}`;

    const doc = await FileModel.create({
      name,
      key: folderKey,
      size: 0,
      mimeType: "application/x-directory",
      folderId: folderId ?? null,
      userId: this.userId,
      isFolder: true,
      cdnUrl: null,
    });

    return toEntry(doc);
  }

  // ── Upload (server-side) ──────────────────────────────────────────────

  /** Upload a file (buffer) and create the DB record. */
  async upload(input: CreateFileInput): Promise<FileEntry> {
    await dbConnect();

    const s3Key = makeS3Key(
      this.userId,
      `${input.name}-${Date.now()}`,
    );
    const mimeType = input.mimeType ?? "application/octet-stream";

    const { cdnUrl } = await uploadToS3(s3Key, input.body, mimeType);
    const size =
      typeof input.body === "string"
        ? Buffer.byteLength(input.body)
        : "length" in input.body
          ? input.body.length
          : 0;

    const doc = await FileModel.create({
      name: input.name,
      key: s3Key,
      size,
      mimeType,
      folderId: input.folderId ?? null,
      userId: this.userId,
      isFolder: false,
      cdnUrl,
    });

    return toEntry(doc);
  }

  // ── Presigned upload URL ──────────────────────────────────────────────

  /** Get a pre-signed upload URL + create a pending DB record. */
  async createUploadUrl(input: UploadSignedUrlInput): Promise<{
    entry: FileEntry;
    uploadUrl: string;
  }> {
    await dbConnect();

    const s3Key = makeS3Key(
      this.userId,
      `${input.name}-${Date.now()}`,
    );

    const uploadUrl = await getUploadSignedUrl(s3Key, input.mimeType);
    const cdnUrl = toCdnUrl(s3Key);

    const doc = await FileModel.create({
      name: input.name,
      key: s3Key,
      size: 0, // updated after upload via confirmUpload
      mimeType: input.mimeType,
      folderId: input.folderId ?? null,
      userId: this.userId,
      isFolder: false,
      cdnUrl,
    });

    return { entry: toEntry(doc), uploadUrl };
  }

  /** Confirm a client-side S3 upload and update the file record size. */
  async confirmUpload(id: string, size: number): Promise<FileEntry | null> {
    await dbConnect();

    const doc = await FileModel.findById(id);
    if (!doc || doc.userId !== this.userId) return null;

    doc.size = size;
    await doc.save();

    return toEntry(doc);
  }

  // ── Download URL ──────────────────────────────────────────────────────

  async getDownloadUrl(fileId: string): Promise<string | null> {
    await dbConnect();

    const doc = await FileModel.findById(fileId);
    if (!doc || doc.userId !== this.userId || doc.isFolder) return null;

    // Prefer CDN, fall back to signed S3 URL
    if (doc.cdnUrl) return doc.cdnUrl;
    return getDownloadSignedUrl(doc.key);
  }

  // ── Delete ────────────────────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    await dbConnect();

    const doc = await FileModel.findById(id);
    if (!doc || doc.userId !== this.userId) return;

    // Recursively delete children if folder
    if (doc.isFolder) {
      const children = await FileModel.find({
        userId: this.userId,
        folderId: id,
      });
      for (const child of children) {
        await this.delete(String(child._id));
      }
    }

    // Delete from S3 if it's a file
    if (!doc.isFolder) {
      try {
        await deleteFromS3(doc.key);
      } catch {
        // S3 delete is best-effort — DB record is the source of truth
      }
    }

    await FileModel.deleteOne({ _id: doc._id });
  }

  // ── Rename / Move ─────────────────────────────────────────────────────

  async rename(id: string, newName: string): Promise<FileEntry | null> {
    await dbConnect();

    const doc = await FileModel.findById(id);
    if (!doc || doc.userId !== this.userId) return null;

    doc.name = newName;
    await doc.save();

    return toEntry(doc);
  }

  async move(id: string, targetFolderId: string | null): Promise<FileEntry | null> {
    await dbConnect();

    const doc = await FileModel.findById(id);
    if (!doc || doc.userId !== this.userId) return null;

    // Prevent moving a folder into itself
    if (doc.isFolder && targetFolderId) {
      let parent: string | null = targetFolderId;
      while (parent) {
        if (parent === String(doc._id)) return null;
        const parentDoc: IFileDocument | null = await FileModel.findById(parent);
        parent = parentDoc?.folderId ? String(parentDoc.folderId) : null;
      }
    }

    doc.folderId = targetFolderId ?? null;
    await doc.save();

    return toEntry(doc);
  }

  // ── Stats ─────────────────────────────────────────────────────────────

  async stats(): Promise<{ fileCount: number; folderCount: number; totalBytes: number }> {
    await dbConnect();

    const [files, folders] = await Promise.all([
      FileModel.find({ userId: this.userId, isFolder: false }).lean(),
      FileModel.find({ userId: this.userId, isFolder: true }).lean(),
    ]);

    return {
      fileCount: files.length,
      folderCount: folders.length,
      totalBytes: files.reduce((sum, f) => sum + (f.size ?? 0), 0),
    };
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────

function findById(
  map: Map<string, FileEntry[]>,
  id: string,
): FileEntry | undefined {
  for (const entries of map.values()) {
    const found = entries.find((e) => e.id === id);
    if (found) return found;
  }
  return undefined;
}
