import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FileSDK } from "../../../../../desktop-ui-app";

// ── POST /api/files/sign-upload ─────────────────────────────────────────────
// Returns a pre-signed S3 URL so the client can upload directly to S3,
// bypassing the Next.js server. Also creates a pending DB record (size: 0).

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sdk = new FileSDK(session.user.email);

  try {
    const { name, mimeType, folderId } = await req.json();

    if (!name || !mimeType) {
      return NextResponse.json(
        { error: "Missing name or mimeType" },
        { status: 400 },
      );
    }

    const { entry, uploadUrl } = await sdk.createUploadUrl({
      name,
      mimeType,
      folderId: folderId ?? null,
    });

    return NextResponse.json({ entry, uploadUrl });
  } catch (err: any) {
    console.error("[POST /api/files/sign-upload]", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
