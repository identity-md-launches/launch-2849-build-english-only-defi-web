import { useState } from "react";
import { marketById } from "../data/markets";
import { useStore } from "../state/store";
import { fmt0, fmt2, fmtCents, pctFmt, fmtToken } from "../lib/format";
import { borrowApr, healthFactor, liquidationPrice, liquidity, supplyApy, utilization } from "../lib/math";
import { previewAction } from "../lib/actions";
import { useTxGate } from "../lib/tx";
import { ActionPanel } from "../components/ActionPanel";
import { ReviewDialog } from "../components/Review";
import { UtilCurve } from "../components/Charts";
import { LedgerTable } from "../components/Ledger";
import { Health, NotDeployed, PageHead, Sim, Stat } from "../components/ui";
import { IS_DEMO } from "../config/site";
import { NotFound } from "./NotFound";

export function MarketDetail({ id }: { id: string }) {
  const m = marketById(id);
  const st = useStore();
  const [toggle, setToggle] = useState(false);
  const [msg, setMsg] = useState("");
  const toggleAction = m ? { kind: "toggle" as const, market: m.id, enable: !st.user.positions[m.id].collateralOn } : undefined;
  const gate = useTxGate(toggleAction);
  if (!m) return <NotFound />;
  const s = st.markets[m.id]; const u = utilization(s);
  const p = st.user.positions[m.id];
  const hf = healthFactor(m, s.price, p);
  const liq = liquidationPrice(m, p);
  const tpv = previewAction(toggleAction!, st.markets, st.user);
  const events = st.ledger.filter((r) => r.market === m.id);

  return (
    <div className="wrap">
      <p className="crumb"><a href="#/markets">Markets</a> / {m.symbol}</p>
      <PageHead title={`${m.symbol} market`} lead={`${m.asset}. Issued by a ${m.issuer.toLowerCase()}. Lend USDC to this pool, or lock ${m.symbol} to borrow USDC.`} />

      <div className="section-head"><h2 className="h3">Market</h2><Sim /></div>
      {IS_DEMO ? (
        <dl className="stats">
          <Stat label="Oracle price" value={`${fmt2(s.price)} USDC`} sub={m.oracle} />
          <Stat label="Supply APY (variable)" value={pctFmt(supplyApy(m, u))} />
          <Stat label="Borrow APR (variable)" value={pctFmt(borrowApr(m, u))} />
          <Stat label="Utilization" value={pctFmt(u, 1)} />
          <Stat label="Supplied" value={fmt0(s.supplied)} sub="USDC" />
          <Stat label="Borrowed" value={fmt0(s.borrowed)} sub="USDC" />
          <Stat label="Liquidity" value={fmt0(liquidity(s))} sub="USDC" />
        </dl>
      ) : <NotDeployed />}

      <div className="grid-2">
        <ActionPanel market={m} />
        <div className="stack">
          <section className="panel" aria-labelledby="h-pos">
            <div className="section-head"><h2 id="h-pos" className="h3">Your position</h2><Sim /></div>
            <dl className="kv kv-tight">
              <div><dt>Supplied</dt><dd className="num">{fmt2(p.supplied)} USDC</dd></div>
              <div><dt>Collateral</dt><dd className="num">{fmtToken(p.collateral)} {m.symbol}</dd></div>
              <div><dt>Debt</dt><dd className="num">{fmt2(p.debt)} USDC</dd></div>
              <div><dt>Health factor</dt><dd><Health hf={hf} /></dd></div>
              <div><dt>Liquidation price</dt><dd className="num">{liq ? `${fmt2(liq)} USDC` : "None"}</dd></div>
            </dl>
            <div className="toggle-row">
              <span id="coll-label">Use {m.symbol} as collateral</span>
              <button role="switch" aria-checked={p.collateralOn} aria-labelledby="coll-label" className="switch"
                disabled={!!gate || !!tpv.blocked} aria-describedby="coll-why" onClick={() => setToggle(true)}>
                <span>{p.collateralOn ? "On" : "Off"}</span>
              </button>
            </div>
            <p id="coll-why" className="small muted">{gate ?? tpv.blocked ?? "Turning collateral off is allowed only while health stays above 1.00."}</p>
            <p className="ok" role="status">{msg}</p>
            {toggle && <ReviewDialog action={toggleAction!} preview={tpv} onClose={() => setToggle(false)} onDone={(t) => { setToggle(false); setMsg(t); }} />}
          </section>
          <section className="panel" aria-labelledby="h-risk">
            <h2 id="h-risk" className="h3">Risk parameters</h2>
            <dl className="kv kv-tight">
              <div><dt>Oracle</dt><dd>{m.oracle}. {m.oracleHeartbeat}.</dd></div>
              <div><dt>Collateral factor (max LTV)</dt><dd className="num">{pctFmt(m.ltv, 0)}</dd></div>
              <div><dt>Liquidation threshold</dt><dd className="num">{pctFmt(m.liqThreshold, 0)}</dd></div>
              <div><dt>Liquidation penalty</dt><dd className="num">{pctFmt(m.liqPenalty, 0)}, of which {pctFmt(m.protocolPenaltyShare, 0)} goes to the revenue router</dd></div>
              <div><dt>Origination fee</dt><dd className="num">{pctFmt(m.originationFee, 2)} of each borrow</dd></div>
            </dl>
          </section>
        </div>
      </div>

      <section className="section" aria-labelledby="h-curve">
        <h2 id="h-curve" className="h3">Utilization curve</h2>
        <UtilCurve market={m} u={u} />
      </section>

      <section className="section" aria-labelledby="h-fees">
        <div className="section-head"><h2 id="h-fees" className="h3">Fee events</h2><Sim /></div>
        {IS_DEMO ? <LedgerTable rows={events} caption={`${m.symbol} fee events`} /> : <NotDeployed />}
        {IS_DEMO && <p className="small muted num">Total routed from this market: {fmtCents(events.reduce((a, r) => a + r.cents, 0))} USDC</p>}
      </section>
    </div>
  );
}
