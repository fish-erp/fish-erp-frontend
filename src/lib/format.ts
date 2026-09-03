export function formatVnd(value: number | string | bigint): string {
  const amount = typeof value === "bigint" ? value : BigInt(Math.trunc(Number(value) || 0));
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount)} ₫`;
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

export function initials(value?: string | null): string {
  if (!value) return "BB";
  return value.split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase()).join("");
}
