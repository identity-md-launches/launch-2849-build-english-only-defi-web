import { MARKETS, marketById, type MarketDef } from "../data/markets";
import type { MarketState, UserState, Position } from "../data/demo";
import { healthFactor, liquidationPrice, liquidity, maxBorrow } from "./math";
import { HF_AT_RISK, HF_LIQUIDATABLE } from "../config/site";
import { fmt2 } from "./format";

export type ActionKind = "supply" | "withdraw" | "borrow" | "repay";
export type Asset = "USDC" | "collateral";

export interface TxAction {
  kind: ActionKind | "toggle" | "claim" | "distribute";
  market?: MarketDef["id"];
  asset?: Asset;
  amount?: number;
  /** For toggle: the collateral setting after the change. */
  enable?: boolean;
}

export interface Preview {
  title: string;
  amountLabel: string;
  fee: number;
  feeLabel: string;
  hfBefore: number;
  hfAfter: number;
  liqBefore: number | null;
  liqAfter: number | null;
  warning?: string;
  /** null = valid; otherwise the reason the submit is disabled. */
  blocked: string | null;
}

export const actionTitle = (a: TxAction, m?: MarketDef) => {
  switch (a.kind) {
    case "supply": return a.asset === "collateral" ? `Deposit ${m?.symbol} collateral` : `Supply USDC to the ${m?.symbol} market`;
    case "withdraw": return a.asset === "collateral" ? `Withdraw ${m?.symbol} collateral` : `Withdraw USDC from the ${m?.symbol} market`;
    case "borrow": return `Borrow USDC against ${m?.symbol}`;
    case "repay": return `Repay USDC debt in the ${m?.symbol} market`;
    case "toggle": return `Change ${m?.symbol} collateral setting`;
    case "claim": return "Claim incentive rewards";
    case "distribute": return "Distribute accrued protocol revenue";
  }
};

export function nextPosition(a: TxAction, p: Position, fee: number): Position {
  const amt = a.amount ?? 0;
  const n = { ...p };
  if (a.kind === "supply") a.asset === "collateral" ? (n.collateral += amt) : (n.supplied += amt);
  if (a.kind === "withdraw") a.asset === "collateral" ? (n.collateral -= amt) : (n.supplied -= amt);
  if (a.kind === "borrow") n.debt += amt;
  if (a.kind === "repay") n.debt = Math.max(n.debt - amt, 0);
  if (a.kind === "toggle") n.collateralOn = !n.collateralOn;
  void fee;
  return n;
}

/** Validate an action against the market and user state, and build the pre-signing summary. */
export function previewAction(a: TxAction, markets: Record<string, MarketState>, user: UserState): Preview {
  const m = a.market ? marketById(a.market)! : MARKETS[0];
  const s = markets[m.id];
  const p = user.positions[m.id];
  const amt = a.amount ?? 0;
  const sym = a.asset === "collateral" ? m.symbol : "USDC";
  const fee = a.kind === "borrow" ? amt * m.originationFee : 0;
  const after = nextPosition(a, p, fee);
  const hfBefore = healthFactor(m, s.price, p);
  const hfAfter = healthFactor(m, s.price, after);
  const pv: Preview = {
    title: actionTitle(a, m),
    amountLabel: `${fmt2(amt)} ${sym}`,
    fee,
    feeLabel: a.kind === "borrow" ? `${fmt2(fee)} USDC origination fee (${(m.originationFee * 100).toFixed(2)}%), routed to the revenue split` : "No protocol fee",
    hfBefore, hfAfter,
    liqBefore: liquidationPrice(m, p),
    liqAfter: liquidationPrice(m, after),
    blocked: null,
  };
  const needsAmount = a.kind === "supply" || a.kind === "withdraw" || a.kind === "borrow" || a.kind === "repay";
  if (needsAmount) {
    if (!isFinite(amt) || amt <= 0) pv.blocked = "Enter an amount greater than 0.";
    else if (a.kind === "supply") {
      const bal = a.asset === "collateral" ? user.wallet[m.id] : user.wallet.USDC;
      if (amt > bal) pv.blocked = `Amount is more than your wallet balance of ${fmt2(bal)} ${sym}.`;
    } else if (a.kind === "withdraw") {
      if (a.asset === "collateral") {
        if (amt > p.collateral) pv.blocked = `You have ${fmt2(p.collateral)} ${m.symbol} deposited.`;
      } else {
        if (amt > p.supplied) pv.blocked = `You have ${fmt2(p.supplied)} USDC supplied.`;
        else if (amt > liquidity(s)) pv.blocked = `Only ${fmt2(liquidity(s))} USDC is available to withdraw right now. Utilization is high; try a smaller amount.`;
      }
    } else if (a.kind === "borrow") {
      const cap = maxBorrow(m, s.price, p);
      if (!p.collateralOn || p.collateral <= 0) pv.blocked = `Deposit ${m.symbol} and turn it on as collateral first.`;
      else if (amt > liquidity(s)) pv.blocked = `Only ${fmt2(liquidity(s))} USDC is available to borrow.`;
      else if (amt > cap + 1e-9) pv.blocked = `Above the ${(m.ltv * 100).toFixed(0)}% LTV limit. You can borrow up to ${fmt2(cap)} USDC.`;
    } else if (a.kind === "repay") {
      if (p.debt <= 0) pv.blocked = "You have no debt in this market.";
      else if (amt > p.debt + 1e-9) pv.blocked = `Your debt is ${fmt2(p.debt)} USDC. Enter that amount or less.`;
      else if (amt > user.wallet.USDC) pv.blocked = `Amount is more than your wallet balance of ${fmt2(user.wallet.USDC)} USDC.`;
    }
  }
  if (!pv.blocked && hfAfter < HF_LIQUIDATABLE && hfAfter < hfBefore) {
    pv.blocked = `Health factor would fall to ${hfAfter.toFixed(2)}, below 1.00, and the position could be liquidated.`;
  } else if (!pv.blocked && a.kind === "toggle" && p.debt > 0 && !after.collateralOn) {
    pv.blocked = "Repay this market's debt before turning collateral off.";
  } else if (!pv.blocked && hfAfter < HF_AT_RISK && hfAfter < hfBefore) {
    pv.warning = `Health factor would fall to ${hfAfter.toFixed(2)}, below 1.20. A small drop in the ${m.symbol} oracle price could trigger liquidation.`;
  }
  return pv;
}
