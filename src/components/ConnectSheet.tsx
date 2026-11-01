import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAccount, useConnect, useDisconnect, useSwitchChain, type Connector } from "wagmi";
import { WALLET_ICONS, iconSrc } from "../lib/wallet-icons";
import { OPEN_IN, isMobileBrowser } from "../lib/open-in";
import { CHAIN, CHAIN_ID } from "../config/site";
import { shortAddr } from "../lib/format";

/** Switch the wallet to Ethereum; adds the chain if the wallet does not know it. */
export function useEnsureMainnet() {
  const { switchChainAsync, isPending } = useSwitchChain();
  const { connector } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    setError(null);
    try {
      await switchChainAsync({ chainId: CHAIN_ID });
    } catch (e) {
      try {
        const provider = (await connector?.getProvider()) as { request: (a: unknown) => Promise<unknown> } | undefined;
        await provider?.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: "0x1", chainName: CHAIN.name, nativeCurrency: CHAIN.nativeCurrency,
            rpcUrls: [CHAIN.rpcUrls.default.http[0]], blockExplorerUrls: ["https://etherscan.io"] }],
        });
      } catch {
        setError("The wallet did not switch. Choose Ethereum Mainnet in your wallet.");
      }
      void e;
    }
  };
  return { run, isPending, error };
}

/** The connect control and its sheet: the site's own type and colors, the network's structure. */
export function ConnectSheet() {
  const mobile = isMobileBrowser();
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, variables, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const sw = useEnsureMainnet();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("keydown", onKey);
    const main = document.getElementById("app-shell");
    main?.setAttribute("inert", "");
    sheet.current?.querySelector<HTMLElement>("button, a")?.focus();
    return () => {
      removeEventListener("keydown", onKey);
      main?.removeAttribute("inert");
      trigger.current?.focus();
    };
  }, [open]);
  useEffect(() => { if (isConnected) setOpen(false); }, [isConnected]);

  // EIP-6963 names each installed extension; wagmi's generic injected row is only for a browser
  // where discovery found nothing, and then it is called what it is.
  const named = connectors.some((c) => c.type === "injected" && c.id !== "injected");
  const listed = [...connectors.filter((c) => c.type === "injected"), ...connectors.filter((c) => c.type !== "injected")]
    .filter((c) => !(c.id === "injected" && named));
  const label = (c: Connector) => (c.id === "injected" ? "Browser wallet" : c.id === "coinbaseWalletSDK" && mobile ? "Coinbase Smart Wallet" : c.name);
  const icon = (c: Connector) => c.icon ?? (WALLET_ICONS[c.id] ? iconSrc(WALLET_ICONS[c.id]) : undefined);

  if (isConnected && address) {
    if (chainId !== CHAIN_ID) {
      return (
        <span className="connect-wrap">
          <button className="btn btn-warn" onClick={sw.run} disabled={sw.isPending}>
            {sw.isPending ? "Switching…" : `Switch to ${CHAIN.name}`}
          </button>
          {sw.error && <span className="sr-only" role="status">{sw.error}</span>}
        </span>
      );
    }
    return (
      <span className="connect-wrap">
        <button className="btn btn-quiet mono-num" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>{shortAddr(address)}</button>
        {menu && (
          <span className="menu">
            <button className="btn btn-quiet" onClick={() => { setMenu(false); disconnect(); }}>Disconnect</button>
          </span>
        )}
      </span>
    );
  }
  return (
    <>
      <button ref={trigger} className="btn btn-primary" onClick={() => { reset(); setOpen(true); }}>Connect</button>
      {open && createPortal(
        <div className="sheet-bg" onClick={() => setOpen(false)}>
          <div ref={sheet} className="sheet" role="dialog" aria-modal="true" aria-labelledby="connect-title" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2 id="connect-title">Connect a wallet</h2>
              <button className="x" aria-label="Close" onClick={() => setOpen(false)}>×</button>
            </div>
            {mobile && OPEN_IN.map((w) => (
              <a key={w.id} className="wallet-row" href={w.href(location.href)}>
                <span className="ic"><img width={28} height={28} src={iconSrc(WALLET_ICONS[w.id])} alt="" /></span>
                <span>Open in {w.name}</span>
              </a>
            ))}
            {listed.filter((c) => !mobile || c.type !== "injected").map((c) => (
              <button key={c.uid} className="wallet-row" onClick={() => connect({ connector: c, chainId: CHAIN_ID })} disabled={isPending}>
                <span className="ic">{icon(c) ? <img width={28} height={28} src={icon(c)} alt="" /> : null}</span>
                <span>{label(c)}{isPending && variables?.connector === c ? " · opening…" : ""}</span>
              </button>
            ))}
            <p className="sheet-note" role="status">
              {error ? "Connection was not approved. Choose a wallet to try again." : "No email or seed phrase. Your keys stay in your wallet."}
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
