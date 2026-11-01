import type { ReactNode } from "react";
import { IS_DEMO } from "../config/site";
import { healthLabel, healthLevel } from "../lib/math";
import { fmtHf, shortHash } from "../lib/format";

export function Sim() {
  return IS_DEMO ? <span className="badge badge-sim" title="Demo data, not real balances">SIMULATED</span> : null;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className="num">{value}</dd>
      {sub && <dd className="muted small">{sub}</dd>}
    </div>
  );
}

export function Health({ hf }: { hf: number }) {
  const lvl = healthLevel(hf);
  return (
    <span className={`health health-${lvl}`}>
      <span className="num">{fmtHf(hf)}</span> <span className="health-label">{healthLabel[lvl]}</span>
    </span>
  );
}

/** Live hashes link to Etherscan; demo hashes are labelled and never linked. */
export function TxHash({ hash }: { hash: string }) {
  if (IS_DEMO) return <span className="mono-num muted" title={`Demo hash ${hash}: not an Ethereum transaction`}>{shortHash(hash)} <span className="small">(demo)</span></span>;
  return <a className="mono-num" href={`https://etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">{shortHash(hash)}</a>;
}

export function NotDeployed({ what = "Contracts" }: { what?: string }) {
  return (
    <div className="notice">
      <strong>{what} not deployed.</strong> Live mode shows on-chain balances once the addresses in
      <code> src/config/site.ts</code> are set. No balances are shown until then.
    </div>
  );
}

export function PageHead({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-head">
      <h1 tabIndex={-1}>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </header>
  );
}
