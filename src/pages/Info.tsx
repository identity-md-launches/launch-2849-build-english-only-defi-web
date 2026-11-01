import { FlowDiagram } from "../components/Charts";
import { PageHead } from "../components/ui";
import { PROJECT_NAME } from "../config/site";

export function HowItWorks() {
  return (
    <div className="wrap">
      <PageHead title="How it works" lead="Five steps, from tokenized collateral to the revenue split." />
      <ol className="steps measure">
        <li>
          <h2 className="h3">Tokenized assets carry issuer risk</h2>
          <p>Each collateral token represents an off-chain asset held by an issuer. The issuer can freeze transfers, and the asset can default. A frozen or defaulted token may be impossible to sell at its oracle price.</p>
        </li>
        <li>
          <h2 className="h3">Lenders earn a variable APY</h2>
          <p>You supply USDC to one market's pool. Borrowers pay interest; lenders receive 90% of it. The APY moves with utilization and is never fixed.</p>
        </li>
        <li>
          <h2 className="h3">Borrowers lock collateral</h2>
          <p>You lock an RWA token and borrow USDC up to its collateral factor. The health factor compares collateral at the liquidation threshold with your debt. Below 1.20 is at risk; below 1.00 is liquidatable.</p>
        </li>
        <li>
          <h2 className="h3">Liquidations feed the router</h2>
          <p>When health falls below 1.00, a liquidator repays debt and takes collateral plus a penalty. The protocol's share of that penalty, origination fees and the 10% interest fee all go to the revenue router.</p>
        </li>
        <li>
          <h2 className="h3">The router splits revenue 30/30/30/10</h2>
          <p>In one transaction the router sends protocol revenue to the Assurance, Advertising & User Incentive, Revenue and Charity funds. The same example as on the home page:</p>
          <FlowDiagram />
        </li>
      </ol>
    </div>
  );
}

export function Security() {
  return (
    <div className="wrap">
      <PageHead title="Security" lead={`What can go wrong when you use ${PROJECT_NAME}, and what the admin can and cannot do.`} />
      <section className="section measure" aria-labelledby="h-risks">
        <h2 id="h-risks">Risks</h2>
        <dl className="risk-list">
          <dt>Contract bugs</dt><dd>No audit is claimed. Smart contracts can contain bugs that lose some or all deposits.</dd>
          <dt>Oracle risk</dt><dd>Prices come from issuer or market feeds. A stale, wrong or manipulated price can liquidate healthy positions or leave bad debt.</dd>
          <dt>Issuer default or freeze</dt><dd>An issuer can default on the underlying asset or freeze token transfers, which can block liquidations.</dd>
          <dt>Illiquid withdrawals</dt><dd>Lenders can withdraw only what is not borrowed. At high utilization, withdrawals wait until borrowers repay or are liquidated.</dd>
          <dt>Reserve shortfall</dt><dd>The Assurance Fund may be smaller than a loss. It is a first-loss reserve, not insurance, and does not guarantee principal.</dd>
        </dl>
      </section>
      <section className="section measure" aria-labelledby="h-admin">
        <h2 id="h-admin">Admin powers</h2>
        <div className="two-col">
          <div className="panel">
            <h3 className="h3">The admin can</h3>
            <ul className="bullets"><li>Pause a market.</li><li>Change a market's oracle.</li></ul>
          </div>
          <div className="panel">
            <h3 className="h3">The admin cannot</h3>
            <ul className="bullets"><li>Change the 30/30/30/10 revenue split. That needs a new contract.</li><li>Take lender deposits.</li></ul>
          </div>
        </div>
      </section>
    </div>
  );
}
