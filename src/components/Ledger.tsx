import { FUNDS } from "../config/split";
import { marketById } from "../data/markets";
import type { LedgerRow } from "../data/demo";
import { ledgerSplit } from "../state/store";
import { fmtCents, fmtDate } from "../lib/format";
import { TxHash } from "./ui";
import { IS_DEMO } from "../config/site";

const mkName = (id: string) => (id === "all" ? "All markets" : marketById(id)?.symbol ?? id);

export function ledgerCsv(rows: LedgerRow[]) {
  const head = ["id", "date", "source", "market", "protocol_revenue_usdc", ...FUNDS.map((f) => `${f.id}_usdc`), "tx_hash", "mode"];
  const lines = rows.map((r) => {
    const sp = ledgerSplit(r);
    return [r.id, r.date, r.kind, mkName(r.market), (r.cents / 100).toFixed(2), ...FUNDS.map((f) => (sp[f.id] / 100).toFixed(2)), r.hash, IS_DEMO ? "demo-simulated" : "live"].join(",");
  });
  return [head.join(","), ...lines].join("\n");
}

export function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function LedgerTable({ rows, caption }: { rows: LedgerRow[]; caption: string }) {
  if (!rows.length) return <p className="muted">No revenue events yet. They appear here after the router distributes fees.</p>;
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table className="table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th><th scope="col">Source</th><th scope="col">Market</th>
            <th scope="col" className="r">Protocol revenue</th>
            {FUNDS.map((f) => <th key={f.id} scope="col" className="r">{f.short}</th>)}
            <th scope="col">Transaction</th>
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((r) => {
            const sp = ledgerSplit(r);
            return (
              <tr key={r.id}>
                <td className="nowrap">{fmtDate(r.date)}</td>
                <td>{r.kind}</td>
                <td>{mkName(r.market)}</td>
                <td className="r num">{fmtCents(r.cents)}</td>
                {FUNDS.map((f) => <td key={f.id} className="r num">{fmtCents(sp[f.id])}</td>)}
                <td className="nowrap"><TxHash hash={r.hash} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
