import { getExtendedSession } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/leaderboards"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // Skip static files and API routes
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // ✅ Use extended session that includes onboarded field
    const session = await getExtendedSession(req.headers);

    // If user is logged in but not onboarded, redirect to onboarding (except if already there)
    if (session?.user && !session.user.onboarded && !path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // If user is onboarded but trying to access onboarding, redirect to home
    if (session?.user?.onboarded && path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect certain routes
    const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
    if (isProtectedPath && !session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(loginUrl);
    }

    // If trying to access onboarding without being logged in
    if (path.startsWith("/onboarding") && !session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // If session verification fails, redirect to login for protected routes only
    const isProtectedPath = protectedPaths.some((prefix) => path.startsWith(prefix));
    if (isProtectedPath) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
  // ✅ Force Node.js runtime instead of Edge
  runtime: 'nodejs',
};