import { describe, expect, it } from "vitest";
import { formatDateTime, formatVnd, initials } from "@/lib/format";

describe("formatters", () => {
  it("formats integer VND with Vietnamese separators", () => { expect(formatVnd(134300)).toBe("134.300 ₫"); expect(formatVnd(-500000)).toBe("-500.000 ₫"); });
  it("formats dates in the configured timezone", () => { const value = formatDateTime("2026-08-27T08:20:53Z"); expect(value).toContain("27/8/26"); expect(value).toContain("15:20"); });
  it("creates stable initials", () => { expect(initials("Nguyễn Văn An")).toBe("VA"); expect(initials(null)).toBe("BB"); });
});
