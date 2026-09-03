import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";

describe("ApiClient auth refresh", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("deduplicates concurrent refresh requests and retries once", async () => {
    let authorized = false;
    let refreshCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/auth/refresh")) {
        refreshCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        authorized = true;
        return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
      }
      if (!authorized) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
      return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers: { "content-type": "application/json" } });
    }));
    const responses = await Promise.all([apiClient.get<{ status: string }>("/api/backend/users"), apiClient.get<{ status: string }>("/api/backend/users")]);
    expect(responses).toEqual([{ status: "ok" }, { status: "ok" }]);
    expect(refreshCalls).toBe(1);
  });
});
