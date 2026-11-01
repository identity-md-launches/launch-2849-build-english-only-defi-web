/**
 * The protocol revenue split. This is the ONLY place the basis points live;
 * every chart, ledger, fund page and example imports from here.
 *
 * On chain the split is fixed in the revenue router's bytecode: neither the UI
 * nor an admin can change it. A different split needs a new contract.
 */
export type FundId = "assurance" | "incentive" | "revenue" | "charity";

export interface FundDef {
  id: FundId;
  name: string;
  short: string;
  bps: number;
  /** Fixed fund color: CSS custom property defined in src/styles.css */
  colorVar: string;
  path: string;
}

export const SPLIT_BPS: Readonly<Record<FundId, number>> = Object.freeze({
  assurance: 3000,
  incentive: 3000,
  revenue: 3000,
  charity: 1000,
});

export const FUNDS: readonly FundDef[] = Object.freeze([
  { id: "assurance", name: "Assurance Fund", short: "Assurance", bps: SPLIT_BPS.assurance, colorVar: "var(--fund-assurance)", path: "#/funds/assurance" },
  { id: "incentive", name: "Advertising & User Incentive Fund", short: "Incentives", bps: SPLIT_BPS.incentive, colorVar: "var(--fund-incentive)", path: "#/funds/incentive" },
  { id: "revenue", name: "Revenue Fund", short: "Revenue", bps: SPLIT_BPS.revenue, colorVar: "var(--fund-revenue)", path: "#/funds/revenue" },
  { id: "charity", name: "Charity Fund", short: "Charity", bps: SPLIT_BPS.charity, colorVar: "var(--fund-charity)", path: "#/charity" },
] as const);

export const BPS_DENOMINATOR = 10_000;

const total = Object.values(SPLIT_BPS).reduce((a, b) => a + b, 0);
if (total !== BPS_DENOMINATOR) throw new Error(`Revenue split must sum to 10000 bps, got ${total}`);
for (const f of FUNDS) {
  if (f.bps !== SPLIT_BPS[f.id]) throw new Error(`Fund ${f.id} bps mismatch`);
}

/** Incentive fund spend policy (policy only, not enforced on chain). */
export const INCENTIVE_POLICY = Object.freeze({ rewardsPct: 70, adsPct: 30 });

/** Protocol fee on borrower interest (demo: 10%). Lenders keep the rest. */
export const PROTOCOL_FEE_BPS = 1000;

export const pct = (bps: number) => `${bps / 100}%`;

/**
 * Split an amount in USDC micro-units (6 decimals) exactly like the router:
 * floor each share, any rounding dust goes to the Assurance Fund.
 */
export function splitAmount(micro: bigint): Record<FundId, bigint> {
  const out = {} as Record<FundId, bigint>;
  let used = 0n;
  for (const f of FUNDS) {
    out[f.id] = (micro * BigInt(SPLIT_BPS[f.id])) / BigInt(BPS_DENOMINATOR);
    used += out[f.id];
  }
  out.assurance += micro - used;
  return out;
}

/** The worked example shown on Home, Revenue Split and How it works. */
export const EXAMPLE_INTEREST = 100_000;
export const EXAMPLE = (() => {
  const protocol = (EXAMPLE_INTEREST * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
  const lenders = EXAMPLE_INTEREST - protocol;
  const funds = FUNDS.map((f) => ({ ...f, amount: (protocol * f.bps) / BPS_DENOMINATOR }));
  return { interest: EXAMPLE_INTEREST, lenders, protocol, funds };
})();
