/**
 * Seeded demo data. Deterministic: the same numbers on every load.
 * Every amount here is SIMULATED; demo issuers, transactions and charity
 * recipients are fictional.
 */
import type { FundId } from "../config/split";
import type { MarketDef } from "./markets";

export interface MarketState {
  price: number; // USDC per collateral token
  supplied: number; // USDC supplied by lenders
  borrowed: number; // USDC borrowed
  collateral: number; // collateral tokens locked
}

export const SEED_MARKETS: Record<MarketDef["id"], MarketState> = {
  tbill: { price: 101.24, supplied: 48_200_000, borrowed: 38_100_000, collateral: 452_000 },
  treal: { price: 52.8, supplied: 21_500_000, borrowed: 12_400_000, collateral: 410_000 },
  tgold: { price: 2415.3, supplied: 16_800_000, borrowed: 10_900_000, collateral: 6_400 },
  tinvoice: { price: 0.982, supplied: 9_600_000, borrowed: 7_700_000, collateral: 13_100_000 },
};

export type RevenueKind = "Interest fee" | "Origination fee" | "Liquidation penalty share" | "Accrued fees";

export interface LedgerRow {
  id: string;
  date: string; // ISO date
  kind: RevenueKind;
  market: MarketDef["id"] | "all";
  /** Protocol revenue routed, in USDC cents. */
  cents: number;
  hash: string;
}

/** Deterministic pseudo hash for demo rows. Not a real transaction. */
export function demoHash(seed: string): string {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  let out = "";
  for (let round = 0; out.length < 64; round++) {
    for (const ch of seed + round) {
      h1 = Math.imul(h1 ^ ch.charCodeAt(0), 16777619) >>> 0;
      h2 = Math.imul(h2 + ch.charCodeAt(0), 2246822519) >>> 0;
    }
    out += (h1 ^ h2).toString(16).padStart(8, "0");
  }
  return "0x" + out.slice(0, 64);
}

const rows: [string, RevenueKind, MarketDef["id"], number][] = [
  ["2026-07-03", "Interest fee", "tbill", 18_420],
  ["2026-07-03", "Origination fee", "treal", 2_150],
  ["2026-07-17", "Interest fee", "tgold", 9_860],
  ["2026-07-31", "Interest fee", "treal", 12_340],
  ["2026-08-08", "Liquidation penalty share", "tinvoice", 4_780],
  ["2026-08-14", "Interest fee", "tinvoice", 7_910],
  ["2026-08-28", "Interest fee", "tbill", 19_050],
  ["2026-09-04", "Origination fee", "tbill", 3_600],
  ["2026-09-18", "Interest fee", "tgold", 10_220],
  ["2026-09-25", "Liquidation penalty share", "tgold", 2_630],
  ["2026-10-02", "Interest fee", "treal", 12_980],
  ["2026-10-16", "Interest fee", "tbill", 19_700],
  ["2026-10-23", "Origination fee", "tinvoice", 1_240],
  ["2026-10-30", "Interest fee", "tinvoice", 8_150],
];

export const SEED_LEDGER: LedgerRow[] = rows.map(([date, kind, market, usdc], i) => {
  const id = `R${String(i + 1).padStart(3, "0")}`;
  return { id, date, kind, market, cents: usdc * 100, hash: demoHash(id) };
});

/** Protocol revenue accrued in the router but not yet distributed (cents). */
export const SEED_PENDING_CENTS = 6_420_00;

export interface Outflow {
  id: string;
  fund: FundId;
  date: string;
  label: string;
  cents: number;
  status: "sent" | "pledged";
  hash: string;
}

const out = (id: string, fund: FundId, date: string, label: string, usdc: number, status: "sent" | "pledged" = "sent"): Outflow =>
  ({ id, fund, date, label, cents: usdc * 100, status, hash: demoHash(id) });

export const SEED_OUTFLOWS: Outflow[] = [
  out("A1", "assurance", "2026-08-08", "Bad-debt cover after tINVOICE liquidation shortfall", 1_120),
  out("I1", "incentive", "2026-08-31", "Supplier rebates (rewards)", 8_400),
  out("I2", "incentive", "2026-09-15", "Research newsletter sponsorship (ads)", 3_000),
  out("I3", "incentive", "2026-10-15", "Referral rewards (rewards)", 6_200),
  out("V1", "revenue", "2026-08-01", "Node and RPC infrastructure", 4_500),
  out("V2", "revenue", "2026-09-30", "Smart contract development", 12_000),
];

export interface Grant {
  id: string;
  cause: string;
  recipient: string;
  cents: number;
  date: string;
  status: "sent" | "pledged";
  hash: string;
}

const grant = (id: string, cause: string, recipient: string, usdc: number, date: string, status: "sent" | "pledged"): Grant =>
  ({ id, cause, recipient, cents: usdc * 100, date, status, hash: demoHash(id) });

/** Fictional recipients for the demo. */
export const SEED_GRANTS: Grant[] = [
  grant("C1", "Adult literacy", "Harbor Literacy Trust (fictional)", 3_000, "2026-08-20", "sent"),
  grant("C2", "Clean water", "Northfield Clean Water Project (fictional)", 4_000, "2026-10-05", "sent"),
  grant("C3", "Food security", "Riverside Food Bank Network (fictional)", 2_500, "2026-11-15", "pledged"),
];

/** Seeded wallet and positions used for any connected wallet in demo mode. */
export interface Position { supplied: number; collateral: number; collateralOn: boolean; debt: number }
export interface UserState {
  wallet: Record<"USDC" | MarketDef["id"], number>;
  positions: Record<MarketDef["id"], Position>;
  rewardsCents: number;
}

export const SEED_USER: UserState = {
  wallet: { USDC: 250_000, tbill: 2_000, treal: 3_000, tgold: 40, tinvoice: 50_000 },
  positions: {
    tbill: { supplied: 75_000, collateral: 1_500, collateralOn: true, debt: 100_000 },
    treal: { supplied: 0, collateral: 0, collateralOn: true, debt: 0 },
    tgold: { supplied: 0, collateral: 20, collateralOn: true, debt: 34_000 },
    tinvoice: { supplied: 20_000, collateral: 0, collateralOn: true, debt: 0 },
  },
  rewardsCents: 142_37,
};
