// UI/request identifiers only, never credentials. getRandomValues works on HTTP too.
let sequence = 0;
export function clientId(): string {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    return Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8, "0")).join("");
  }
  return `${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2)}`;
}
