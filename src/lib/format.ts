const usd0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export const fmt0 = (n: number) => usd0.format(n);
export const fmt2 = (n: number) => usd2.format(n);
export const fmtUsdc = (n: number) => `${usd2.format(n)} USDC`;
export const fmtCents = (c: number) => usd2.format(c / 100);
export const compact = (n: number) => compactFmt.format(n);
export const pctFmt = (f: number, digits = 2) => `${(f * 100).toFixed(digits)}%`;
export const fmtHf = (hf: number) => (isFinite(hf) ? hf.toFixed(2) : "∞");
export const fmtToken = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(n);
export const shortHash = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`;
export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
