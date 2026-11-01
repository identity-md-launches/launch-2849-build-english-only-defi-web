import type { MarketDef } from "../data/markets";
import type { MarketState, Position } from "../data/demo";
import { PROTOCOL_FEE_BPS, BPS_DENOMINATOR } from "../config/split";
import { HF_AT_RISK, HF_LIQUIDATABLE } from "../config/site";

export const utilization = (s: MarketState) => (s.supplied > 0 ? Math.min(s.borrowed / s.supplied, 1) : 0);

export function borrowApr(m: MarketDef, u: number) {
  const { base, slope1, slope2, kink } = m.rate;
  return u <= kink ? base + slope1 * (u / kink) : base + slope1 + slope2 * ((u - kink) / (1 - kink));
}

/** Supply APY: borrower interest times utilization, minus the protocol fee. The fund split is NOT applied to it. */
export function supplyApy(m: MarketDef, u: number) {
  return borrowApr(m, u) * u * (1 - PROTOCOL_FEE_BPS / BPS_DENOMINATOR);
}

export const liquidity = (s: MarketState) => Math.max(s.supplied - s.borrowed, 0);

/** Health factor; Infinity when there is no debt. */
export function healthFactor(m: MarketDef, price: number, p: Pick<Position, "collateral" | "collateralOn" | "debt">) {
  if (p.debt <= 0) return Infinity;
  const coll = p.collateralOn ? p.collateral * price : 0;
  return (coll * m.liqThreshold) / p.debt;
}

/** Collateral price at which HF reaches 1.0. */
export function liquidationPrice(m: MarketDef, p: Pick<Position, "collateral" | "collateralOn" | "debt">) {
  if (p.debt <= 0 || !p.collateralOn || p.collateral <= 0) return null;
  return p.debt / (p.collateral * m.liqThreshold);
}

export function maxBorrow(m: MarketDef, price: number, p: Position) {
  const coll = p.collateralOn ? p.collateral * price : 0;
  return Math.max(coll * m.ltv - p.debt, 0);
}

export type HealthLevel = "none" | "ok" | "risk" | "liquidatable";
export function healthLevel(hf: number): HealthLevel {
  if (!isFinite(hf)) return "none";
  if (hf < HF_LIQUIDATABLE) return "liquidatable";
  if (hf < HF_AT_RISK) return "risk";
  return "ok";
}
export const healthLabel: Record<HealthLevel, string> = {
  none: "No debt",
  ok: "Healthy",
  risk: "At risk",
  liquidatable: "Liquidatable",
};
