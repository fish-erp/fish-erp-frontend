import { NextResponse } from "next/server";

export const ACCESS_COOKIE = "fish_erp_access";
export const REFRESH_COOKIE = "fish_erp_refresh";
const LEGACY_COOKIES = ["bb_access", "bb_refresh"] as const;

export function backendUrl(path: string): string {
  const origin = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
  return `${origin}/api/v1/${path.replace(/^\//, "")}`;
}

export async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try { return JSON.parse(text); } catch { return text; }
}

export function applyTokenCookies(response: NextResponse, payload: { accessToken: string; refreshToken: string; expiresIn: number }, persistent = true) {
  const common = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
  response.cookies.set(ACCESS_COOKIE, payload.accessToken, { ...common, maxAge: payload.expiresIn });
  response.cookies.set(REFRESH_COOKIE, payload.refreshToken, { ...common, ...(persistent ? { maxAge: 60 * 60 * 24 * 7 } : {}) });
}

export function clearTokenCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { expires: new Date(0), path: "/" });
  response.cookies.set(REFRESH_COOKIE, "", { expires: new Date(0), path: "/" });
  for (const cookie of LEGACY_COOKIES) {
    response.cookies.set(cookie, "", { expires: new Date(0), path: "/" });
  }
}
