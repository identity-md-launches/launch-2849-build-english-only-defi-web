import { MARKETS } from "../data/markets";
import { useStore } from "../state/store";
import { compact, fmtCents, pctFmt } from "../lib/format";
import { supplyApy, borrowApr, utilization } from "../lib/math";
import { FlowDiagram } from "../components/Charts";
import { Sim, Stat, NotDeployed } from "../components/ui";
import { IS_DEMO, PROJECT_NAME } from "../config/site";

export function Home() {
  const st = useStore();
  const supplied = MARKETS.reduce((a, m) => a + st.markets[m.id].supplied, 0);
  const borrowed = MARKETS.reduce((a, m) => a + st.markets[m.id].borrowed, 0);
  const assurance = st.totals.assurance.balanceCents / 100;
  return (
    <>
      <section className="hero wrap">
        <h1 tabIndex={-1}>Borrow USDC against tokenized assets</h1>
        <p className="lead">
          {PROJECT_NAME} is an Ethereum lending market: supply USDC for a variable APY, or lock tokenized Treasury bills, real estate, gold or invoices to borrow USDC.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#/markets?mode=lend">Supply USDC</a>
          <a className="btn btn-secondary" href="#/markets?mode=borrow">Borrow against RWA</a>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="h-strip">
        <div className="section-head">
          <h2 id="h-strip">Markets</h2><Sim />
        </div>
        {IS_DEMO ? (
          <ul className="strip">
            {MARKETS.map((m) => {
              const s = st.markets[m.id]; const u = utilization(s);
              return (
                <li key={m.id}>
                  <a className="strip-card" href={`#/markets/${m.id}`}>
                    <span className="strip-sym">{m.symbol}</span>
                    <span className="small muted">{m.asset}</span>
                    <span className="strip-nums num">
                      <span>Supply APY {pctFmt(supplyApy(m, u))}</span>
                      <span>Borrow APR {pctFmt(borrowApr(m, u))}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : <NotDeployed />}
      </section>

      <section className="wrap section" aria-labelledby="h-stats">
        <div className="section-head"><h2 id="h-stats">Protocol totals</h2><Sim /></div>
        {IS_DEMO ? (
          <dl className="stats">
            <Stat label="Supplied" value={`${compact(supplied)} USDC`} />
            <Stat label="Borrowed" value={`${compact(borrowed)} USDC`} />
            <Stat label="Revenue routed" value={`${fmtCents(st.routedCents)} USDC`} />
            <Stat label="Assurance coverage" value={`${fmtCents(st.totals.assurance.balanceCents)} USDC`}
              sub={`${pctFmt(assurance / borrowed, 3)} of borrowed. Not insurance.`} />
          </dl>
        ) : <NotDeployed />}
      </section>

      <section className="wrap section" aria-labelledby="h-flow">
        <h2 id="h-flow">Where borrower interest goes</h2>
        <p className="muted measure">Worked example with 100,000 USDC of borrower interest. The split is fixed in the router contract.</p>
        <FlowDiagram />
      </section>
    </>
  );
}
