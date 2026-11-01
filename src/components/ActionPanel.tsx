import { useId, useMemo, useState } from "react";
import type { MarketDef } from "../data/markets";
import { previewAction, type ActionKind, type Asset, type TxAction } from "../lib/actions";
import { useStore } from "../state/store";
import { useTxGate } from "../lib/tx";
import { fmt2 } from "../lib/format";
import { liquidity, maxBorrow } from "../lib/math";
import { IS_DEMO } from "../config/site";
import { Health } from "./ui";
import { ReviewDialog } from "./Review";

const TABS: { id: ActionKind; label: string }[] = [
  { id: "supply", label: "Supply" },
  { id: "withdraw", label: "Withdraw" },
  { id: "borrow", label: "Borrow" },
  { id: "repay", label: "Repay" },
];

export function ActionPanel({ market, initial = "supply" }: { market: MarketDef; initial?: ActionKind }) {
  const store = useStore();
  const [kind, setKind] = useState<ActionKind>(initial);
  const [asset, setAsset] = useState<Asset>(initial === "supply" ? "USDC" : "USDC");
  const [raw, setRaw] = useState("");
  const [review, setReview] = useState(false);
  const [done, setDone] = useState("");
  const inputId = useId();
  const reasonId = useId();

  const hasAsset = kind === "supply" || kind === "withdraw";
  const action: TxAction = { kind, market: market.id, asset: hasAsset ? asset : "USDC", amount: Number(raw.replace(/,/g, "")) };
  const pv = useMemo(() => previewAction(action, store.markets, store.user), [kind, asset, raw, store.markets, store.user, market.id]); // eslint-disable-line
  const gate = useTxGate(action);
  const reason = gate ?? (raw === "" ? "Enter an amount to see the summary." : pv.blocked);
  const sym = hasAsset && asset === "collateral" ? market.symbol : "USDC";

  const p = store.user.positions[market.id];
  const s = store.markets[market.id];
  const max = (() => {
    if (kind === "supply") return asset === "collateral" ? store.user.wallet[market.id] : store.user.wallet.USDC;
    if (kind === "withdraw") return asset === "collateral" ? p.collateral : Math.min(p.supplied, liquidity(s));
    if (kind === "borrow") return Math.min(maxBorrow(market, s.price, p), liquidity(s));
    return Math.min(p.debt, store.user.wallet.USDC);
  })();

  return (
    <section className="panel" aria-labelledby={`${inputId}-h`}>
      <h2 id={`${inputId}-h`} className="h3">Manage position</h2>
      <div className="tabs" role="group" aria-label="Action">
        {TABS.map((t) => (
          <button key={t.id} className="tab" aria-pressed={kind === t.id} onClick={() => { setKind(t.id); setDone(""); }}>{t.label}</button>
        ))}
      </div>
      {hasAsset && (
        <fieldset className="seg">
          <legend className="small muted">Asset</legend>
          <label><input type="radio" name={`${inputId}-asset`} checked={asset === "USDC"} onChange={() => setAsset("USDC")} /> USDC (lend)</label>
          <label><input type="radio" name={`${inputId}-asset`} checked={asset === "collateral"} onChange={() => setAsset("collateral")} /> {market.symbol} (collateral)</label>
        </fieldset>
      )}
      <label htmlFor={inputId} className="field-label">Amount in {sym}</label>
      <div className="amount">
        <input id={inputId} inputMode="decimal" autoComplete="off" placeholder="0.00" value={raw}
          aria-describedby={reasonId} aria-invalid={!!pv.blocked && raw !== ""}
          onChange={(e) => { setRaw(e.target.value.replace(/[^0-9.,]/g, "")); setDone(""); }} />
        <button className="btn btn-quiet" type="button" onClick={() => setRaw(String(Math.floor(max * 100) / 100))}>Max</button>
      </div>
      <p className="small muted num">Available: {fmt2(max)} {sym}{IS_DEMO ? " (simulated wallet)" : ""}</p>

      <dl className="kv kv-tight">
        <div><dt>Fee</dt><dd className="num">{kind === "borrow" ? `${fmt2(pv.fee)} USDC (${(market.originationFee * 100).toFixed(2)}%)` : "None"}</dd></div>
        <div><dt>Health factor</dt><dd><Health hf={pv.hfBefore} /> → <Health hf={pv.hfAfter} /></dd></div>
        <div><dt>Liquidation price</dt><dd className="num">{pv.liqAfter ? `${fmt2(pv.liqAfter)} USDC per ${market.symbol}` : "None"}</dd></div>
      </dl>
      {pv.warning && !pv.blocked && <p className="warn">{pv.warning}</p>}
      <button className="btn btn-primary btn-block" disabled={!!reason} aria-describedby={reasonId} onClick={() => setReview(true)}>
        Review {TABS.find((t) => t.id === kind)!.label.toLowerCase()}
      </button>
      <p id={reasonId} className={reason && raw !== "" && pv.blocked ? "err" : "small muted"} aria-live="polite">{reason ?? "Ready to review."}</p>
      <p className="ok" role="status">{done}</p>
      {review && (
        <ReviewDialog action={action} preview={pv} onClose={() => setReview(false)}
          onDone={(m) => { setReview(false); setRaw(""); setDone(m); }} />
      )}
    </section>
  );
}
