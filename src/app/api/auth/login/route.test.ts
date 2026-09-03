import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

const loginRequest = () =>
  new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      password: "password123",
      remember: true,
    }),
  });

const tokens = (role: "USER" | "ADMIN" | "SUPER_ADMIN") => ({
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresIn: 900,
  user: { id: "user-id", email: "user@example.com", role },
});

describe("POST /api/auth/login", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores Fish ERP cookies for an administrator", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(tokens("ADMIN"), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("set-cookie")).toContain("fish_erp_access");
    expect(response.headers.get("set-cookie")).toContain("fish_erp_refresh");
  });

  it("revokes a USER session and does not store cookies", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(tokens("USER"), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(loginRequest());

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toContain("auth/logout");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
