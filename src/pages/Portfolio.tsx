import { useAccount } from "wagmi";
import { MARKETS } from "../data/markets";
import { useStore } from "../state/store";
import { fmt2, fmtCents, fmtDate, fmtToken, pctFmt } from "../lib/format";
import { healthFactor, liquidationPrice, supplyApy, utilization } from "../lib/math";
import { Health, NotDeployed, PageHead, Sim, TxHash } from "../components/ui";
import { ClaimPanel } from "./Funds";
import { CHAIN_ID, IS_DEMO } from "../config/site";

export function Portfolio() {
  const { isConnected, chainId } = useAccount();
  const st = useStore();
  const lead = "Your supplies, debt, collateral and health factor across markets. Supply APY is not reduced by the fund split: the split only applies to protocol revenue.";
  if (!isConnected) {
    return (
      <div className="wrap">
        <PageHead title="Portfolio" lead={lead} />
        <div className="panel empty">
          <h2 className="h3">Connect a wallet to see your positions</h2>
          <p className="muted">Markets, funds and the revenue ledger are readable without a wallet. Use Connect in the header.</p>
          <a className="btn btn-secondary" href="#/markets">Browse markets</a>
        </div>
      </div>
    );
  }
  if (chainId !== CHAIN_ID) {
    return (
      <div className="wrap">
        <PageHead title="Portfolio" lead={lead} />
        <p className="warn">Wrong network. Switch to Ethereum Mainnet with the button in the header to see positions.</p>
      </div>
    );
  }
  if (!IS_DEMO) return <div className="wrap"><PageHead title="Portfolio" lead={lead} /><NotDeployed /></div>;
  const rows = MARKETS.map((m) => {
    const s = st.markets[m.id]; const p = st.user.positions[m.id];
    return { m, s, p, hf: healthFactor(m, s.price, p), liq: liquidationPrice(m, p), apy: supplyApy(m, utilization(s)) };
  }).filter((r) => r.p.supplied > 0 || r.p.collateral > 0 || r.p.debt > 0);
  const supplied = rows.reduce((a, r) => a + r.p.supplied, 0);
  const debt = rows.reduce((a, r) => a + r.p.debt, 0);

  return (
    <div className="wrap">
      <PageHead title="Portfolio" lead={lead} />
      <div className="section-head"><h2 className="h3">Positions</h2><Sim /></div>
      <dl className="stats">
        <div className="stat"><dt>Total supplied</dt><dd className="num">{fmt2(supplied)} USDC</dd></div>
        <div className="stat"><dt>Total debt</dt><dd className="num">{fmt2(debt)} USDC</dd></div>
        <div className="stat"><dt>Wallet USDC</dt><dd className="num">{fmt2(st.user.wallet.USDC)}</dd><dd className="muted small">Simulated wallet</dd></div>
      </dl>
      {rows.length === 0 ? (
        <div className="panel empty"><h2 className="h3">No positions yet</h2><p className="muted">Supply USDC or deposit collateral in a market.</p><a className="btn btn-primary" href="#/markets">Open markets</a></div>
      ) : (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Positions">
          <table className="table">
            <thead><tr><th scope="col">Market</th><th scope="col" className="r">Supplied (USDC)</th><th scope="col" className="r">Supply APY</th><th scope="col" className="r">Collateral</th><th scope="col" className="r">Debt (USDC)</th><th scope="col">Health factor</th><th scope="col" className="r">Liquidation price</th></tr></thead>
            <tbody>
              {rows.map(({ m, p, hf, liq, apy }) => (
                <tr key={m.id}>
                  <th scope="row"><a href={`#/markets/${m.id}`}>{m.symbol}</a></th>
                  <td className="r num">{fmt2(p.supplied)}</td>
                  <td className="r num">{p.supplied > 0 ? pctFmt(apy) : "–"}</td>
                  <td className="r num">{fmtToken(p.collateral)} {m.symbol}{p.collateral > 0 && !p.collateralOn ? " (off)" : ""}</td>
                  <td className="r num">{fmt2(p.debt)}</td>
                  <td><Health hf={hf} /></td>
                  <td className="r num">{liq ? fmt2(liq) : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="small muted">Health factor below 1.20 is at risk; below 1.00 the position can be liquidated.</p>
      <ClaimPanel />
      <section className="section" aria-labelledby="h-act">
        <div className="section-head"><h2 id="h-act" className="h3">Simulated activity in this browser</h2>
          <button className="btn btn-quiet" onClick={() => st.reset()}>Reset demo data</button></div>
        {st.activity.length === 0 ? <p className="muted">No simulated transactions yet. Actions you sign in a market appear here.</p> : (
          <ul className="activity">
            {st.activity.map((a) => <li key={a.id}><span className="nowrap">{fmtDate(a.date)}</span> <span>{a.title}</span> <TxHash hash={a.hash} /></li>)}
          </ul>
        )}
        <p className="small muted num">Rewards accrue from the Advertising & User Incentive Fund. Claimable now: {fmtCents(st.user.rewardsCents)} USDC.</p>
      </section>
    </div>
  );
}
