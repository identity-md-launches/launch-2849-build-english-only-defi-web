import { useState } from "react";
import { MARKETS } from "../data/markets";
import { useStore } from "../state/store";
import { compact, pctFmt } from "../lib/format";
import { borrowApr, liquidity, supplyApy, utilization } from "../lib/math";
import { PageHead, Sim } from "../components/ui";
import { IS_DEMO } from "../config/site";

export function Markets() {
  const st = useStore();
  const [mode, setMode] = useState<"lend" | "borrow">(location.hash.includes("mode=borrow") ? "borrow" : "lend");
  const amt = (n: number) => (IS_DEMO ? `${compact(n)}` : "Not deployed");
  return (
    <div className="wrap">
      <PageHead title="Markets" lead="Each market is an isolated USDC pool with one tokenized asset as collateral. Rates are variable and move with utilization." />
      <div className="section-head">
        <div className="tabs" role="group" aria-label="Table view">
          <button className="tab" aria-pressed={mode === "lend"} onClick={() => setMode("lend")}>Lend</button>
          <button className="tab" aria-pressed={mode === "borrow"} onClick={() => setMode("borrow")}>Borrow</button>
        </div>
        <Sim />
      </div>
      <div className="table-scroll" tabIndex={0} role="region" aria-label={`${mode === "lend" ? "Lend" : "Borrow"} markets`}>
        <table className="table table-click">
          <thead>
            {mode === "lend" ? (
              <tr><th scope="col">Market</th><th scope="col" className="r">Supply APY</th><th scope="col" className="r">Utilization</th><th scope="col" className="r">Supplied</th><th scope="col" className="r">Borrowed</th><th scope="col" className="r">Liquidity</th><th scope="col">Oracle</th></tr>
            ) : (
              <tr><th scope="col">Market</th><th scope="col" className="r">Borrow APR</th><th scope="col" className="r">Collateral factor</th><th scope="col" className="r">Liq. threshold</th><th scope="col" className="r">Liq. penalty</th><th scope="col" className="r">Liquidity</th><th scope="col">Oracle</th></tr>
            )}
          </thead>
          <tbody>
            {MARKETS.map((m) => {
              const s = st.markets[m.id]; const u = utilization(s);
              return (
                <tr key={m.id}>
                  <th scope="row">
                    <a href={`#/markets/${m.id}`} className="cell-link">{m.symbol}</a>
                    <span className="small muted block">{m.asset}</span>
                  </th>
                  {mode === "lend" ? (<>
                    <td className="r num">{IS_DEMO ? pctFmt(supplyApy(m, u)) : "Not deployed"}</td>
                    <td className="r num">{IS_DEMO ? pctFmt(u, 1) : "Not deployed"}</td>
                    <td className="r num">{amt(s.supplied)}</td>
                    <td className="r num">{amt(s.borrowed)}</td>
                    <td className="r num">{amt(liquidity(s))}</td>
                  </>) : (<>
                    <td className="r num">{IS_DEMO ? pctFmt(borrowApr(m, u)) : "Not deployed"}</td>
                    <td className="r num">{pctFmt(m.ltv, 0)}</td>
                    <td className="r num">{pctFmt(m.liqThreshold, 0)}</td>
                    <td className="r num">{pctFmt(m.liqPenalty, 0)}</td>
                    <td className="r num">{amt(liquidity(s))}</td>
                  </>)}
                  <td className="small">{m.oracle}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small muted">Amounts in USDC. Select a market to supply, withdraw, borrow or repay. Supply APY is variable and is not reduced by the fund split.</p>
    </div>
  );
}
