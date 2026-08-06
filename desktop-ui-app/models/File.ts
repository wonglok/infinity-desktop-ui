import mongoose, { type Document, type Model } from "mongoose";

// ── Types ──────────────────────────────────────────────────────────────────

export interface IFile {
  name: string;
  key: string; // S3 object key (path within the bucket)
  size: number; // bytes
  mimeType: string;
  folderId: string | null; // parent folder ID, null = root
  userId: string; // owner
  isFolder: boolean;
  cdnUrl: string | null; // cached CDN URL
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileDocument extends IFile, Document {
  _id: mongoose.Types.ObjectId;
}

// ── Schema ─────────────────────────────────────────────────────────────────

const FileSchema = new mongoose.Schema<IFileDocument>(
  {
    name: { type: String, required: true, index: true },
    key: { type: String, required: true, unique: true },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: "application/octet-stream" },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    isFolder: { type: Boolean, default: false },
    cdnUrl: { type: String, default: null },
  },
  {
    timestamps: true,
    collection: "files",
  },
);

// Compound indexes for efficient listing
FileSchema.index({ userId: 1, folderId: 1 });
FileSchema.index({ userId: 1, isFolder: 1 });

// ── Model ──────────────────────────────────────────────────────────────────

export const FileModel: Model<IFileDocument> =
  (mongoose.models?.File as Model<IFileDocument>) ??
  mongoose.model<IFileDocument>("File", FileSchema);
