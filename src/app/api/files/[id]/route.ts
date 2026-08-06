import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FileSDK } from "../../../../../desktop-ui-app";

// ── GET /api/files/[id]?action=download ─────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const action = req.nextUrl.searchParams.get("action");
  const sdk = new FileSDK(session.user.email);

  try {
    if (action === "download") {
      const url = await sdk.getDownloadUrl(id);
      if (!url) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.redirect(url);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH /api/files/[id] — rename, move, or confirm upload ────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const sdk = new FileSDK(session.user.email);

  try {
    if (body.name !== undefined) {
      const entry = await sdk.rename(id, body.name);
      return NextResponse.json({ entry });
    }

    if (body.folderId !== undefined) {
      const entry = await sdk.move(id, body.folderId);
      return NextResponse.json({ entry });
    }

    if (body.action === "confirm-upload" && typeof body.size === "number") {
      const entry = await sdk.confirmUpload(id, body.size);
      if (!entry) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ entry });
    }

    return NextResponse.json({ error: "No operation specified" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE /api/files/[id] ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sdk = new FileSDK(session.user.email);

  try {
    await sdk.delete(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
