import { useState } from "react";
import { FUNDS, INCENTIVE_POLICY, pct, type FundId } from "../config/split";
import { useStore, ledgerSplit } from "../state/store";
import { fmtCents, fmtDate } from "../lib/format";
import { useTxGate } from "../lib/tx";
import { previewAction } from "../lib/actions";
import { ReviewDialog } from "../components/Review";
import { NotDeployed, PageHead, Sim, Stat, TxHash } from "../components/ui";
import { IS_DEMO } from "../config/site";

const MANDATE: Record<Exclude<FundId, "charity">, { mandate: string; policy: string[] }> = {
  assurance: {
    mandate: "First-loss reserve for bad debt, oracle failure and RWA default. It is not insurance and does not guarantee principal.",
    policy: [
      "Pays only for shortfalls left after a liquidation, an oracle failure or an issuer default.",
      "Pays up to its balance at the time of the loss. Losses above the reserve are not covered and fall on lenders in that market.",
      "Never pays operating costs and never returns to the Revenue Fund.",
    ],
  },
  incentive: {
    mandate: "Rewards, rebates, referrals and advertising for users of the protocol.",
    policy: [
      `Demo policy: ${INCENTIVE_POLICY.rewardsPct}% rewards and rebates, ${INCENTIVE_POLICY.adsPct}% advertising. This is a spending policy, not a contract rule.`,
      "Rewards are claimable by wallet. Claimed rewards do not change supply APY.",
      "No token sale and no extra fees.",
    ],
  },
  revenue: {
    mandate: "Operations, development and treasury. It is not user yield.",
    policy: [
      "Pays infrastructure, development and other operating costs.",
      "Never pays lenders and never tops up the Assurance Fund's losses.",
      "Charity Fund money is never mixed back into this fund.",
    ],
  },
};

export function FundsIndex() {
  const st = useStore();
  return (
    <div className="wrap">
      <PageHead title="Funds" lead="Four USDC vaults receive 100% of protocol revenue. Lender yield never enters them." />
      <div className="section-head"><h2 className="h3">Vaults</h2><Sim /></div>
      <ul className="fund-grid">
        {FUNDS.map((f) => (
          <li key={f.id} className="fund-card" style={{ borderTopColor: f.colorVar }}>
            <h3><a href={f.path}>{f.name}</a></h3>
            <p className="num">{pct(f.bps)} of protocol revenue</p>
            <p className="num strong">{IS_DEMO ? `${fmtCents(st.totals[f.id].balanceCents)} USDC` : "Contracts not deployed"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FundPage({ id }: { id: Exclude<FundId, "charity"> }) {
  const st = useStore();
  const f = FUNDS.find((x) => x.id === id)!;
  const t = st.totals[id];
  const info = MANDATE[id];
  const inflows = st.ledger.map((r) => ({ r, c: ledgerSplit(r)[id] }));
  const outs = st.outflows.filter((o) => o.fund === id);
  const bal = t.balanceCents / 100;
  const exLoss = Math.ceil((bal * 1.6) / 1000) * 1000;

  return (
    <div className="wrap">
      <p className="crumb"><a href="#/funds">Funds</a> / {f.name}</p>
      <PageHead title={f.name} lead={info.mandate}>
        <p className="fund-tag"><span className="swatch" style={{ background: f.colorVar }} aria-hidden="true" /> Receives {pct(f.bps)} of protocol revenue</p>
      </PageHead>

      <div className="section-head"><h2 className="h3">Balance</h2><Sim /></div>
      {IS_DEMO ? (
        <dl className="stats">
          <Stat label="Vault balance" value={`${fmtCents(t.balanceCents)} USDC`} />
          <Stat label="Total received" value={`${fmtCents(t.inflowCents)} USDC`} />
          <Stat label="Total spent" value={`${fmtCents(t.outflowCents)} USDC`} sub="Balance = received − spent" />
        </dl>
      ) : <NotDeployed />}

      <section className="section" aria-labelledby="h-policy">
        <h2 id="h-policy" className="h3">Spend policy</h2>
        <ul className="bullets measure">{info.policy.map((p) => <li key={p}>{p}</li>)}</ul>
      </section>

      {id === "assurance" && IS_DEMO && (
        <section className="section panel" aria-labelledby="h-default">
          <h2 id="h-default" className="h3">Default example</h2>
          <p className="measure">Suppose a tINVOICE issuer defaults and liquidation leaves <span className="num">{exLoss.toLocaleString("en-US")} USDC</span> of bad debt.
            The reserve holds <span className="num">{fmtCents(t.balanceCents)} USDC</span> and pays that much. The remaining <strong className="num">{(exLoss - bal).toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC</strong> is not covered and is a loss to tINVOICE lenders.</p>
        </section>
      )}

      {id === "incentive" && <ClaimPanel />}

      <section className="section" aria-labelledby="h-tx">
        <div className="section-head"><h2 id="h-tx" className="h3">Transactions</h2><Sim /></div>
        {IS_DEMO ? (
          <div className="table-scroll" tabIndex={0} role="region" aria-label={`${f.name} transactions`}>
            <table className="table">
              <thead><tr><th scope="col">Date</th><th scope="col">Type</th><th scope="col">Detail</th><th scope="col" className="r">Amount (USDC)</th><th scope="col">Transaction</th></tr></thead>
              <tbody>
                {[...inflows.map(({ r, c }) => ({ key: r.id, date: r.date, type: "Inflow", detail: `${r.kind} split`, cents: c, hash: r.hash })),
                  ...outs.map((o) => ({ key: o.id, date: o.date, type: "Spend", detail: o.label, cents: -o.cents, hash: o.hash }))]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((x) => (
                    <tr key={x.key}>
                      <td className="nowrap">{fmtDate(x.date)}</td><td>{x.type}</td><td>{x.detail}</td>
                      <td className="r num">{x.cents < 0 ? `−${fmtCents(-x.cents)}` : `+${fmtCents(x.cents)}`}</td>
                      <td className="nowrap"><TxHash hash={x.hash} /></td>
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

export function ClaimPanel() {
  const st = useStore();
  const [review, setReview] = useState(false);
  const [msg, setMsg] = useState("");
  const action = { kind: "claim" as const };
  const gate = useTxGate(action);
  const why = gate ?? (st.user.rewardsCents <= 0 ? "No rewards to claim right now." : null);
  const pv = { ...previewAction(action, st.markets, st.user), title: "Claim incentive rewards", amountLabel: `${fmtCents(st.user.rewardsCents)} USDC`, feeLabel: "No fee" };
  return (
    <section className="section panel" aria-labelledby="h-claim">
      <div className="section-head"><h2 id="h-claim" className="h3">Claim rewards</h2><Sim /></div>
      <p className="num">Claimable: <strong>{IS_DEMO ? `${fmtCents(st.user.rewardsCents)} USDC` : "Contracts not deployed"}</strong></p>
      <div className="row-actions">
        <button className="btn btn-primary" disabled={!!why} aria-describedby="claim-why" onClick={() => setReview(true)}>Claim rewards</button>
        {IS_DEMO && <span className="badge badge-sim">Simulated transaction</span>}
      </div>
      <p id="claim-why" className="small muted">{why ?? (IS_DEMO ? "Your wallet signs a free message. No funds move." : "Claims from the Advertising & User Incentive Fund.")}</p>
      <p className="ok" role="status">{msg}</p>
      {review && <ReviewDialog action={action} preview={pv} onClose={() => setReview(false)} onDone={(t) => { setReview(false); setMsg(t); }} />}
    </section>
  );
}
