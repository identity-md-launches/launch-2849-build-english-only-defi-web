import { FUNDS, pct } from "../config/split";
import { useStore } from "../state/store";
import { fmtCents, fmtDate } from "../lib/format";
import { NotDeployed, PageHead, Sim, Stat, TxHash } from "../components/ui";
import { IS_DEMO } from "../config/site";

export function Charity() {
  const st = useStore();
  const f = FUNDS.find((x) => x.id === "charity")!;
  const t = st.totals.charity;
  const pledged = st.grants.filter((g) => g.status === "pledged").reduce((a, g) => a + g.cents, 0);
  return (
    <div className="wrap">
      <p className="crumb"><a href="#/funds">Funds</a> / {f.name}</p>
      <PageHead title={f.name} lead="USDC grants to named causes. Charity money is kept in its own vault and never mixed back into the Revenue Fund.">
        <p className="fund-tag"><span className="swatch" style={{ background: f.colorVar }} aria-hidden="true" /> Receives {pct(f.bps)} of protocol revenue</p>
      </PageHead>
      <div className="section-head"><h2 className="h3">Balance</h2><Sim /></div>
      {IS_DEMO ? (
        <dl className="stats">
          <Stat label="Vault balance" value={`${fmtCents(t.balanceCents)} USDC`} />
          <Stat label="Total received" value={`${fmtCents(t.inflowCents)} USDC`} />
          <Stat label="Grants sent" value={`${fmtCents(t.outflowCents)} USDC`} />
          <Stat label="Pledged, not yet sent" value={`${fmtCents(pledged)} USDC`} />
        </dl>
      ) : <NotDeployed />}
      <section className="section" aria-labelledby="h-pol">
        <h2 id="h-pol" className="h3">Spend policy</h2>
        <ul className="bullets measure">
          <li>Grants are paid in USDC to a named recipient for a named cause.</li>
          <li>A pledge becomes "sent" only when the transfer leaves the vault.</li>
          <li>Demo recipients are fictional organisations used to show the format.</li>
        </ul>
      </section>
      <section className="section" aria-labelledby="h-grants">
        <div className="section-head"><h2 id="h-grants" className="h3">Grants</h2><Sim /></div>
        {IS_DEMO ? (
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Charity grants">
            <table className="table">
              <thead><tr><th scope="col">Cause</th><th scope="col">Recipient</th><th scope="col" className="r">Amount (USDC)</th><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Transaction</th></tr></thead>
              <tbody>
                {st.grants.map((g) => (
                  <tr key={g.id}>
                    <td>{g.cause}</td><td>{g.recipient}</td><td className="r num">{fmtCents(g.cents)}</td>
                    <td className="nowrap">{fmtDate(g.date)}</td>
                    <td><span className={`badge ${g.status === "sent" ? "badge-ok" : "badge-neutral"}`}>{g.status === "sent" ? "Sent" : "Pledged"}</span></td>
                    <td className="nowrap">{g.status === "sent" ? <TxHash hash={g.hash} /> : <span className="muted">Not sent yet</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <NotDeployed />}
      </section>
    </div>
  );
}
