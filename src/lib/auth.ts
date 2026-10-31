import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "auth_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET
);

export interface JWTPayload {
  userId: string;
  email: string;
  username?: string;
  name: string;
}

/**
 * Tạo JWT token chứa thông tin user
 */
export async function createSessionToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

/**
 * Xác thực và giải mã JWT token
 */
export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Thiết lập HTTP-Only Cookie chứa JWT token
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 ngày
  });
}

/**
 * Lấy thông tin Session của User đang đăng nhập từ Cookie
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  return await verifySessionToken(token);
}

/**
 * Đăng xuất - Xóa HTTP-Only Cookie Session
 */
export async function destroySessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
