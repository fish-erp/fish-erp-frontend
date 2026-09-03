import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, backendUrl, clearTokenCookies } from "@/lib/server/backend";

export async function POST() {
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (access) await fetch(backendUrl("auth/logout"), { method: "POST", headers: { Authorization: `Bearer ${access}` }, cache: "no-store" }).catch(() => undefined);
  const response = new NextResponse(null, { status: 204 });
  clearTokenCookies(response);
  return response;
}
