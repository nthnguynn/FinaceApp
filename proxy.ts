import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";

// Các đường dẫn chỉ dành cho khách (chưa đăng nhập)
const authRoutes = ["/login"];

// Các đường dẫn yêu cầu đăng nhập (khớp với nhóm route (dashboard))
const protectedRoutes = ["/dashboard", "/transactions", "/bills", "/stats", "/bank-sync", "/categories", "/wallets", "/profile"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_session")?.value;

  // Kiểm tra tính hợp lệ của Token
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session;

  // 1. Chuyển hướng người dùng đã đăng nhập khỏi trang /login sang /dashboard
  if (isAuthenticated && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Chuyển hướng người dùng chưa đăng nhập khi cố truy cập các trang bảo mật sang /login
  if (!isAuthenticated && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
