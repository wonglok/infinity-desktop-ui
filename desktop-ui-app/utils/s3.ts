import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

// ── Client ─────────────────────────────────────────────────────────────────

const BUCKET_NAME = process.env.B3_S3_AWS_BUCKET_NAME!;
const BUCKET_REGION = process.env.B3_S3_AWS_REGION!;
const CDN_DISTRIBUTION = process.env.CDN_DISTRIBUTION!;

const s3 = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.B3_S3_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.B3_S3_AWS_ACCESS_SECRET!,
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert S3 key → CDN URL */
export function toCdnUrl(key: string): string {
  return `${CDN_DISTRIBUTION}/${key}`;
}

/** Generate a unique S3 key for a given user + file path */
export function makeS3Key(userId: string, filePath: string): string {
  // Normalise: strip leading slash, deduplicate separators
  const clean = filePath.replace(/^\/+/, "").replace(/\/+/g, "/");
  return `users/${userId}/${clean}`;
}

// ── Upload ─────────────────────────────────────────────────────────────────

export async function uploadToS3(
  key: string,
  body: PutObjectCommandInput["Body"],
  contentType: string,
): Promise<{ key: string; cdnUrl: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { key, cdnUrl: toCdnUrl(key) };
}

// ── Delete ─────────────────────────────────────────────────────────────────

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
}

// ── Signed URL (for direct uploads / downloads) ────────────────────────────

export async function getDownloadSignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    { expiresIn: 300 }, // 5 minutes
  );
}

export async function getUploadSignedUrl(
  key: string,
  contentType: string,
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );
}

export { BUCKET_NAME, BUCKET_REGION, s3 };
