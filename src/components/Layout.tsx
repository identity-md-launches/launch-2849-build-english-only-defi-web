import { useState, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { CHAIN_ID, IS_DEMO, PROJECT_NAME } from "../config/site";
import { ConnectSheet } from "./ConnectSheet";

const NAV = [
  { href: "#/markets", label: "Markets" },
  { href: "#/revenue", label: "Revenue Split" },
  { href: "#/funds", label: "Funds" },
  { href: "#/charity", label: "Charity" },
  { href: "#/portfolio", label: "Portfolio" },
  { href: "#/how", label: "How it works" },
  { href: "#/security", label: "Security" },
];

function Network() {
  const { isConnected, chainId } = useAccount();
  const wrong = isConnected && chainId !== CHAIN_ID;
  return (
    <span className={`net ${wrong ? "net-wrong" : ""}`}>
      <span className="dot" aria-hidden="true" />
      {wrong ? "Wrong network" : "Ethereum"}
    </span>
  );
}

export function Layout({ route, children }: { route: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const active = (href: string) => route === href.slice(1) || (href !== "#/" && route.startsWith(href.slice(1) + "/"));
  return (
    <>
      <div id="app-shell">
        <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLElement>("main h1")?.focus(); }}>Skip to content</a>
        {IS_DEMO && <p className="banner">Demo mode — simulated Ethereum data, no real funds.</p>}
        <header className="top">
          <div className="top-inner">
            <a className="brand" href="#/">
              <img src="./favicon.svg" width="24" height="24" alt="" />
              <span>{PROJECT_NAME}</span>
            </a>
            <nav aria-label="Main" className={open ? "nav nav-open" : "nav"} id="main-nav">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} onClick={() => setOpen(false)}>{n.label}</a>
              ))}
              <Network />
            </nav>
            <div className="top-end">
              <Network />
              <ConnectSheet />
              <button className="btn btn-quiet menu-btn" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen((o) => !o)}>
                {open ? "Close" : "Menu"}
              </button>
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="foot">
          <div className="wrap">
            <p className="foot-risk">Digital-asset lending can result in partial or total loss. RWA tokens can default, be frozen by an issuer, or be mispriced by an oracle.</p>
            <p className="small muted">{PROJECT_NAME} is {IS_DEMO ? "running in demo mode with simulated data. Demo issuers and charity recipients are fictional." : "reading Ethereum mainnet."} No audit is claimed. APY is variable.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
