import { EXAMPLE, FUNDS, pct } from "../config/split";
import { fmt0, pctFmt } from "../lib/format";
import { borrowApr, supplyApy } from "../lib/math";
import type { MarketDef } from "../data/markets";

/** Borrower interest → lenders → protocol revenue → four funds, with the fixed example. */
export function FlowDiagram() {
  const e = EXAMPLE;
  return (
    <figure className="flow" aria-label="How borrower interest is split">
      <ol className="flow-steps">
        <li className="flow-node">
          <span className="flow-k">Borrower interest</span>
          <span className="flow-v num">{fmt0(e.interest)} USDC</span>
        </li>
        <li className="flow-node flow-lender">
          <span className="flow-k">To lenders (supply APY)</span>
          <span className="flow-v num">{fmt0(e.lenders)} USDC</span>
        </li>
        <li className="flow-node">
          <span className="flow-k">Protocol revenue (10% fee)</span>
          <span className="flow-v num">{fmt0(e.protocol)} USDC</span>
        </li>
      </ol>
      <ul className="flow-funds">
        {e.funds.map((f) => (
          <li key={f.id} style={{ borderColor: f.colorVar }}>
            <span className="swatch" style={{ background: f.colorVar }} aria-hidden="true" />
            <span className="flow-k">{f.short} {pct(f.bps)}</span>
            <span className="flow-v num">{fmt0(f.amount)}</span>
          </li>
        ))}
      </ul>
      <figcaption className="muted small">
        Lenders keep their {fmt0(e.lenders)} USDC. The split applies only to the {fmt0(e.protocol)} USDC of protocol revenue.
      </figcaption>
    </figure>
  );
}

/** Stacked bar locked to the configured basis points. No controls: the split cannot be edited. */
export function SplitBar() {
  return (
    <figure className="splitbar">
      <div className="splitbar-track" role="img" aria-label={FUNDS.map((f) => `${f.name} ${pct(f.bps)}`).join(", ")}>
        {FUNDS.map((f) => (
          <span key={f.id} style={{ width: pct(f.bps), background: f.colorVar }} />
        ))}
      </div>
      <ul className="legend">
        {FUNDS.map((f) => (
          <li key={f.id}><span className="swatch" style={{ background: f.colorVar }} aria-hidden="true" />{f.name} <span className="num">{pct(f.bps)}</span></li>
        ))}
      </ul>
    </figure>
  );
}

/** Borrow APR and supply APY against utilization, with the current point. */
export function UtilCurve({ market, u }: { market: MarketDef; u: number }) {
  const W = 320, H = 160, P = 28;
  const pts = Array.from({ length: 51 }, (_, i) => i / 50);
  const maxY = borrowApr(market, 1);
  const x = (v: number) => P + v * (W - P - 8);
  const y = (v: number) => H - P - (v / maxY) * (H - P - 8);
  const line = (f: (u: number) => number) => pts.map((p, i) => `${i ? "L" : "M"}${x(p).toFixed(1)},${y(f(p)).toFixed(1)}`).join(" ");
  return (
    <figure className="curve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Utilization curve. At ${pctFmt(u, 1)} utilization: borrow APR ${pctFmt(borrowApr(market, u))}, supply APY ${pctFmt(supplyApy(market, u))}.`}>
        <line x1={P} y1={H - P} x2={W - 8} y2={H - P} className="axis" />
        <line x1={P} y1={8} x2={P} y2={H - P} className="axis" />
        <line x1={x(market.rate.kink)} y1={8} x2={x(market.rate.kink)} y2={H - P} className="grid" />
        <path d={line((p) => borrowApr(market, p))} className="c-borrow" />
        <path d={line((p) => supplyApy(market, p))} className="c-supply" />
        <circle cx={x(u)} cy={y(borrowApr(market, u))} r="4" className="c-dot" />
        <text x={P} y={H - 8} className="tick">0%</text>
        <text x={W - 8} y={H - 8} className="tick" textAnchor="end">100% utilization</text>
      </svg>
      <figcaption className="legend small">
        <span><span className="key key-borrow" aria-hidden="true" />Borrow APR</span>
        <span><span className="key key-supply" aria-hidden="true" />Supply APY</span>
        <span>Kink at {pctFmt(market.rate.kink, 0)}</span>
      </figcaption>
    </figure>
  );
}
