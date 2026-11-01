import { mainnet } from "viem/chains";

/** Product name: change this one field to rename the app. */
export const PROJECT_NAME = "VAULTLINE";

export const SITE_DESCRIPTION =
  "Institutional lending for tokenized real-world assets on Ethereum: supply USDC for a variable APY, or borrow USDC against tokenized Treasury bills, real estate, gold and invoices.";

/** demo | live. Set NEXT_PUBLIC_DATA_MODE at build time; default demo. */
export const DATA_MODE: "demo" | "live" =
  import.meta.env.NEXT_PUBLIC_DATA_MODE === "live" ? "live" : "demo";
export const IS_DEMO = DATA_MODE === "demo";

/** Ethereum mainnet only. */
export const CHAIN = mainnet;
export const CHAIN_ID = 1 as const;
export const PUBLIC_RPC_URL = "https://ethereum-rpc.publicnode.com";
export const EXPLORER = "https://etherscan.io";

/** Only set when the requester supplies a WalletConnect Cloud project id. */
export const WALLETCONNECT_PROJECT_ID = "";

/** Canonical Circle USDC on Ethereum mainnet. */
export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;

type Addr = `0x${string}` | "";

/**
 * Live-mode contract addresses. Empty means "Contracts not deployed": the UI
 * then shows that state instead of balances. Fill in after deployment.
 */
export const LIVE_ADDRESSES: {
  router: Addr;
  vaults: Record<"assurance" | "incentive" | "revenue" | "charity", Addr>;
  markets: Record<string, { pool: Addr; collateral: Addr; oracle: Addr }>;
} = {
  router: "",
  vaults: { assurance: "", incentive: "", revenue: "", charity: "" },
  markets: {
    tbill: { pool: "", collateral: "", oracle: "" },
    treal: { pool: "", collateral: "", oracle: "" },
    tgold: { pool: "", collateral: "", oracle: "" },
    tinvoice: { pool: "", collateral: "", oracle: "" },
  },
};

export const HF_LIQUIDATABLE = 1.0;
export const HF_AT_RISK = 1.2;
