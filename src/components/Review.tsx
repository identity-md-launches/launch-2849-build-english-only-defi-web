import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IS_DEMO } from "../config/site";
import type { Preview, TxAction } from "../lib/actions";
import { fmt2 } from "../lib/format";
import { isUserRejection, useExecute } from "../lib/tx";
import { Health } from "./ui";

/** Pre-signing summary. Rejections keep the caller's form intact and show a one-line note. */
export function ReviewDialog({ action, preview, onClose, onDone }: {
  action: TxAction; preview: Preview; onClose: () => void; onDone: (msg: string) => void;
}) {
  const exec = useExecute();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(document.activeElement);

  const busyRef = useRef(busy); busyRef.current = busy;
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busyRef.current) closeRef.current(); };
    addEventListener("keydown", onKey);
    const shell = document.getElementById("app-shell");
    shell?.setAttribute("inert", "");
    box.current?.querySelector<HTMLElement>("h2")?.focus();
    const back = opener.current;
    return () => {
      removeEventListener("keydown", onKey);
      shell?.removeAttribute("inert");
      (back as HTMLElement | null)?.focus?.();
    };
  }, []);

  const sign = async () => {
    setBusy(true); setErr(null);
    try {
      await exec(action, preview.title, preview.amountLabel);
      onDone(IS_DEMO ? `Simulated transaction recorded: ${preview.title}.` : `Transaction sent: ${preview.title}.`);
    } catch (e) {
      setErr(isUserRejection(e)
        ? "Signature rejected in your wallet. Nothing changed; your entry is kept. Sign again when ready."
        : `Unable to complete: ${(e as { shortMessage?: string })?.shortMessage ?? (e as Error)?.message ?? "unknown error"}. Your entry is kept.`);
      setBusy(false);
    }
  };

  const showAmount = action.kind !== "toggle" && action.kind !== "claim" && action.kind !== "distribute";
  return createPortal(
    <div className="sheet-bg" onClick={() => !busy && onClose()}>
      <div ref={box} className="sheet review" role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 id="review-title" tabIndex={-1}>Review before signing</h2>
          <button className="x" aria-label="Close" onClick={onClose} disabled={busy}>×</button>
        </div>
        <dl className="kv">
          <div><dt>Action</dt><dd>{preview.title}</dd></div>
          {showAmount && <div><dt>Amount</dt><dd className="num">{preview.amountLabel}</dd></div>}
          <div><dt>Fee</dt><dd>{preview.feeLabel}</dd></div>
          <div><dt>Health factor</dt><dd><Health hf={preview.hfBefore} /> → <Health hf={preview.hfAfter} /></dd></div>
          <div><dt>Liquidation price</dt><dd className="num">
            {preview.liqBefore ? fmt2(preview.liqBefore) : "None"} → {preview.liqAfter ? `${fmt2(preview.liqAfter)} USDC` : "None"}
          </dd></div>
          {IS_DEMO && <div><dt>Mode</dt><dd>Simulated transaction. Your wallet signs a free message; no funds move.</dd></div>}
        </dl>
        {preview.warning && <p className="warn" role="alert">{preview.warning}</p>}
        <p className="err" role="status">{err}</p>
        <div className="row-actions">
          <button className="btn btn-primary" onClick={sign} disabled={busy}>{busy ? "Waiting for wallet…" : IS_DEMO ? "Sign simulated transaction" : "Sign transaction"}</button>
          <button className="btn btn-quiet" onClick={onClose} disabled={busy}>Edit</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
