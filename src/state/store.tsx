import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SEED_GRANTS, SEED_LEDGER, SEED_MARKETS, SEED_OUTFLOWS, SEED_PENDING_CENTS, SEED_USER, demoHash,
  type Grant, type LedgerRow, type MarketState, type Outflow, type UserState } from "../data/demo";
import { FUNDS, splitAmount, type FundId } from "../config/split";
import { marketById } from "../data/markets";
import { nextPosition, type TxAction } from "../lib/actions";

const KEY = "vaultline-demo-v1";

interface DemoState {
  markets: Record<string, MarketState>;
  ledger: LedgerRow[];
  pendingCents: number;
  outflows: Outflow[];
  grants: Grant[];
  user: UserState;
  /** Simulated transactions made in this browser, newest first. */
  activity: { id: string; date: string; title: string; hash: string }[];
}

const seed = (): DemoState => structuredClone({
  markets: SEED_MARKETS, ledger: SEED_LEDGER, pendingCents: SEED_PENDING_CENTS,
  outflows: SEED_OUTFLOWS, grants: SEED_GRANTS, user: SEED_USER, activity: [],
});

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch { /* storage unavailable: fall back to the seed */ }
  return seed();
}

export interface FundTotals { inflowCents: number; outflowCents: number; balanceCents: number }

interface Store extends DemoState {
  totals: Record<FundId, FundTotals>;
  routedCents: number;
  apply: (a: TxAction, title: string) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export const ledgerSplit = (row: LedgerRow) => {
  const s = splitAmount(BigInt(row.cents));
  return Object.fromEntries(FUNDS.map((f) => [f.id, Number(s[f.id])])) as Record<FundId, number>;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<DemoState>(load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ }
  }, [st]);

  const apply = useCallback((a: TxAction, title: string) => {
    setSt((prev) => {
      const s = structuredClone(prev);
      const today = new Date().toISOString().slice(0, 10);
      const id = `U${s.activity.length + 1}-${Date.now()}`;
      s.activity.unshift({ id, date: today, title, hash: demoHash(id) });
      if (a.kind === "claim") {
        s.user.wallet.USDC += s.user.rewardsCents / 100;
        s.outflows.push({ id, fund: "incentive", date: today, label: "Reward claim (simulated, this browser)", cents: s.user.rewardsCents, status: "sent", hash: demoHash(id) });
        s.user.rewardsCents = 0;
        return s;
      }
      if (a.kind === "distribute") {
        if (s.pendingCents > 0) {
          s.ledger.push({ id: `R${String(s.ledger.length + 1).padStart(3, "0")}`, date: today, kind: "Accrued fees", market: "all", cents: s.pendingCents, hash: demoHash(id) });
          s.pendingCents = 0;
        }
        return s;
      }
      const m = marketById(a.market!)!;
      const ms = s.markets[m.id];
      const p = s.user.positions[m.id];
      const amt = a.amount ?? 0;
      const fee = a.kind === "borrow" ? amt * m.originationFee : 0;
      s.user.positions[m.id] = nextPosition(a, p, fee);
      if (a.kind === "supply") {
        if (a.asset === "collateral") { s.user.wallet[m.id] -= amt; ms.collateral += amt; }
        else { s.user.wallet.USDC -= amt; ms.supplied += amt; }
      } else if (a.kind === "withdraw") {
        if (a.asset === "collateral") { s.user.wallet[m.id] += amt; ms.collateral -= amt; }
        else { s.user.wallet.USDC += amt; ms.supplied -= amt; }
      } else if (a.kind === "borrow") {
        s.user.wallet.USDC += amt - fee;
        ms.borrowed += amt;
        s.pendingCents += Math.round(fee * 100);
      } else if (a.kind === "repay") {
        s.user.wallet.USDC -= amt;
        ms.borrowed = Math.max(ms.borrowed - amt, 0);
      }
      return s;
    });
  }, []);

  const reset = useCallback(() => setSt(seed()), []);

  const value = useMemo<Store>(() => {
    const totals = Object.fromEntries(FUNDS.map((f) => [f.id, { inflowCents: 0, outflowCents: 0, balanceCents: 0 }])) as Record<FundId, FundTotals>;
    let routedCents = 0;
    for (const row of st.ledger) {
      routedCents += row.cents;
      const sp = ledgerSplit(row);
      for (const f of FUNDS) totals[f.id].inflowCents += sp[f.id];
    }
    for (const o of st.outflows) if (o.status === "sent") totals[o.fund].outflowCents += o.cents;
    for (const g of st.grants) if (g.status === "sent") totals.charity.outflowCents += g.cents;
    for (const f of FUNDS) totals[f.id].balanceCents = totals[f.id].inflowCents - totals[f.id].outflowCents;
    return { ...st, totals, routedCents, apply, reset };
  }, [st, apply, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
