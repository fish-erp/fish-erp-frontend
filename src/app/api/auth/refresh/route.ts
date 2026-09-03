import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { applyTokenCookies, backendUrl, clearTokenCookies, readJsonSafe, REFRESH_COOKIE } from "@/lib/server/backend";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn" }, { status: 401 });
  const upstream = await fetch(backendUrl("auth/refresh"), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ refreshToken }), cache: "no-store" });
  const data = await readJsonSafe(upstream);
  if (!upstream.ok) { const response = NextResponse.json(data ?? { message: "Không thể làm mới phiên" }, { status: 401 }); clearTokenCookies(response); return response; }
  const tokens = data as { accessToken: string; refreshToken: string; expiresIn: number; user: { role: string } };
  if (!["ADMIN", "SUPER_ADMIN"].includes(tokens.user.role)) {
    await fetch(backendUrl("auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      cache: "no-store",
    }).catch(() => undefined);
    const response = NextResponse.json(
      { message: "Tài khoản không có quyền truy cập Fish ERP" },
      { status: 403 },
    );
    clearTokenCookies(response);
    return response;
  }
  const response = NextResponse.json({ user: tokens.user, expiresIn: tokens.expiresIn });
  applyTokenCookies(response, tokens);
  return response;
}
