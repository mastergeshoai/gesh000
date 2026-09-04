import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const isProduction = process.env.NODE_ENV === "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
// Extract origin from app URL (e.g. "https://my-app.com" from "https://my-app.com/")
const appOrigin = appUrl ? new URL(appUrl).origin : "";
const requestBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

/**
 * Check if an origin is allowed for CORS
 * - Development: any origin
 * - Production: NEXT_PUBLIC_APP_URL, *.totalum-project.com, or same-host (custom domains)
 */
function isAllowedOrigin(origin: string, request: NextRequest): boolean {
  if (!isProduction) {
    const devOrigins = [appOrigin, process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL].filter(Boolean);
    return devOrigins.length === 0 || devOrigins.includes(origin);
  }
  if (appOrigin && origin === appOrigin) return true;
  if (/^https:\/\/[^/]+\.totalum-project\.com$/.test(origin)) return true;

  // Trust same-host requests — custom domains served by this same server
  const host = request.headers.get("host");
  if (host && origin === `https://${host}`) return true;

  return false;
}

// Add CORS headers if the origin is allowed
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && isAllowedOrigin(origin, request)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

// Set CSP to allow iframe embedding from any domain and remove X-Frame-Options
function addCspHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProduction) response.headers.set("Strict-Transport-Security", "max-age=63072000");
  response.headers.delete("X-Frame-Options");
  return response;
}

// Authentication and response hardening are enforced centrally for every request.
export async function proxy(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    addCorsHeaders(response, request);
    addCspHeaders(response);
    return response;
  }

  if (request.nextUrl.pathname.startsWith("/api/") && isRateLimited(request)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  const pathname = request.nextUrl.pathname;
  const isPublic = pathname === "/" || pathname === "/projects" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password") || pathname.startsWith("/about") || pathname.startsWith("/contact") || pathname.startsWith("/pricing") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/config") || pathname === "/api/health";
  if (!isPublic) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }
  const response = NextResponse.next();
  addCorsHeaders(response, request);
  addCspHeaders(response);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
