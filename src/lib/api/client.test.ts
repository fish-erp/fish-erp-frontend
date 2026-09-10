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

  it("retries a binary download and preserves its filename", async () => {
    let authorized = false;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/api/auth/refresh")) {
        authorized = true;
        return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
      }
      if (!authorized) return new Response("Unauthorized", { status: 401 });
      return new Response(new Uint8Array([80, 75, 3, 4]), {
        status: 200,
        headers: {
          "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "content-disposition": "attachment; filename=bao-cao.xlsx",
        },
      });
    }));

    const result = await apiClient.download("/api/backend/reports/inventory.xlsx");
    expect(result.fileName).toBe("bao-cao.xlsx");
    expect(result.blob.size).toBe(4);
  });
});
