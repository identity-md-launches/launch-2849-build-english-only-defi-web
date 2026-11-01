import { useState } from "react";
import { FUNDS, pct } from "../config/split";
import { useStore } from "../state/store";
import { fmtCents } from "../lib/format";
import { previewAction } from "../lib/actions";
import { useTxGate } from "../lib/tx";
import { FlowDiagram, SplitBar } from "../components/Charts";
import { LedgerTable, downloadCsv, ledgerCsv } from "../components/Ledger";
import { ReviewDialog } from "../components/Review";
import { NotDeployed, PageHead, Sim } from "../components/ui";
import { IS_DEMO } from "../config/site";

export function Revenue() {
  const st = useStore();
  const [review, setReview] = useState(false);
  const [msg, setMsg] = useState("");
  const action = { kind: "distribute" as const };
  const gate = useTxGate(action);
  const pv = { ...previewAction(action, st.markets, st.user), title: "Distribute accrued protocol revenue", amountLabel: `${fmtCents(st.pendingCents)} USDC`, feeLabel: "No fee. Anyone may call distribute." };
  const why = gate ?? (st.pendingCents <= 0 ? "Nothing to distribute: the router holds no accrued revenue." : null);

  return (
    <div className="wrap">
      <PageHead title="Revenue Split" lead="Protocol revenue is split 30/30/30/10 in the same transaction that collects it. The split is fixed in the router contract; neither this interface nor an admin can change it." />
      <section className="section" aria-labelledby="h-split">
        <h2 id="h-split" className="h3">The split</h2>
        <SplitBar />
      </section>
      <section className="section" aria-labelledby="h-ex">
        <h2 id="h-ex" className="h3">Example: 100,000 USDC of borrower interest</h2>
        <FlowDiagram />
        <p className="small muted measure">Protocol revenue is the 10% fee on borrower interest, plus all origination fees, plus the protocol's share of liquidation penalties.</p>
      </section>

      <section className="section" aria-labelledby="h-tot">
        <div className="section-head"><h2 id="h-tot" className="h3">Cumulative totals per fund</h2><Sim /></div>
        {IS_DEMO ? (
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Cumulative totals">
            <table className="table">
              <thead><tr><th scope="col">Fund</th><th scope="col" className="r">Share</th><th scope="col" className="r">Received</th><th scope="col" className="r">Spent</th><th scope="col" className="r">Vault balance</th></tr></thead>
              <tbody>
                {FUNDS.map((f) => {
                  const t = st.totals[f.id];
                  return (
                    <tr key={f.id}>
                      <th scope="row"><span className="swatch" style={{ background: f.colorVar }} aria-hidden="true" /> <a href={f.path}>{f.name}</a></th>
                      <td className="r num">{pct(f.bps)}</td>
                      <td className="r num">{fmtCents(t.inflowCents)}</td>
                      <td className="r num">{fmtCents(t.outflowCents)}</td>
                      <td className="r num">{fmtCents(t.balanceCents)}</td>
                    </tr>
                  );
                })}
                <tr className="total"><th scope="row">All funds</th><td className="r num">100%</td>
                  <td className="r num">{fmtCents(st.routedCents)}</td>
                  <td className="r num">{fmtCents(FUNDS.reduce((a, f) => a + st.totals[f.id].outflowCents, 0))}</td>
                  <td className="r num">{fmtCents(FUNDS.reduce((a, f) => a + st.totals[f.id].balanceCents, 0))}</td></tr>
              </tbody>
            </table>
          </div>
        ) : <NotDeployed />}
      </section>

      <section className="section panel" aria-labelledby="h-router">
        <div className="section-head"><h2 id="h-router" className="h3">Revenue router</h2><Sim /></div>
        <p className="num">Accrued, not yet distributed: <strong>{IS_DEMO ? `${fmtCents(st.pendingCents)} USDC` : "Contracts not deployed"}</strong></p>
        <button className="btn btn-primary" disabled={!!why} aria-describedby="dist-why" onClick={() => setReview(true)}>Distribute</button>
        <p id="dist-why" className="small muted">{why ?? "Sends accrued revenue to the four fund vaults in one transaction."}</p>
        <p className="ok" role="status">{msg}</p>
        {review && <ReviewDialog action={action} preview={pv} onClose={() => setReview(false)} onDone={(t) => { setReview(false); setMsg(t); }} />}
      </section>

      <section className="section" aria-labelledby="h-ledger">
        <div className="section-head">
          <h2 id="h-ledger" className="h3">Distribution ledger</h2>
          {IS_DEMO && <button className="btn btn-secondary" onClick={() => downloadCsv("vaultline-revenue-ledger.csv", ledgerCsv(st.ledger))}>Download CSV</button>}
        </div>
        {IS_DEMO ? (<>
          <LedgerTable rows={st.ledger} caption="Revenue distribution ledger" />
          <p className="small muted">Demo hashes are not Ethereum transactions and are not linked. In live mode each hash links to etherscan.io.</p>
        </>) : <NotDeployed />}
      </section>
    </div>
  );
}
