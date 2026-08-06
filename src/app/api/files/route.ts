import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FileSDK, type CreateFileInput } from "../../../../desktop-ui-app";

// ── GET /api/files?folderId=… ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sdk = new FileSDK(session.user.email);
  const folderId = req.nextUrl.searchParams.get("folderId");

  try {
    const entries = await sdk.list(folderId ?? null);
    return NextResponse.json({ entries });
  } catch (err: any) {
    console.error("[GET /api/files]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/files — upload a file or create a folder ──────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sdk = new FileSDK(session.user.email);
  const contentType = req.headers.get("content-type") ?? "";

  try {
    // ── Create folder (JSON body) ────────────────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await req.json();

      if (body.action === "createFolder" && body.name) {
        const entry = await sdk.createFolder(body.name, body.folderId ?? null);
        return NextResponse.json({ entry });
      }

      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // ── Upload file (multipart) ──────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const input: CreateFileInput = {
      name: file.name,
      folderId: folderId ?? null,
      body: buffer,
      mimeType: file.type || "application/octet-stream",
    };

    const entry = await sdk.upload(input);
    return NextResponse.json({ entry });
  } catch (err: any) {
    console.error("[POST /api/files]", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
