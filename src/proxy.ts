import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth guard proxy.
 *
 * We intentionally avoid importing `auth()` from `@/auth` here because it pulls
 * in `jose` which uses CompressionStream / DecompressionStream — Node.js APIs
 * that are not available in the Edge Runtime.
 *
 * Auth gating is handled client-side by `useSession()` in the Desktop component.
 * The LoginScreen is shown when no session is active.
 */
export function proxy(request: NextRequest) {
  // Always allow auth API routes through (sign-in flow)
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/files).*)",
  ],
};
