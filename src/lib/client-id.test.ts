import { afterEach, describe, expect, it, vi } from "vitest";
import { clientId } from "./client-id";
afterEach(() => vi.unstubAllGlobals());
describe("HTTP-compatible client identifiers", () => {
  it("does not need crypto.randomUUID", () => { vi.stubGlobal("crypto", { getRandomValues: (array: Uint32Array) => { array.set([1, 2, 3, 4]); return array; } }); expect(clientId()).toBe("00000001000000020000000300000004"); });
  it("keeps keys distinct without any Web Crypto API", () => { vi.stubGlobal("crypto", undefined); expect(new Set(Array.from({ length: 1000 }, clientId)).size).toBe(1000); });
});
