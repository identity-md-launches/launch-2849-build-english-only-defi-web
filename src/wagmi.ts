import { createConfig, http } from "wagmi";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";
import { CHAIN, PROJECT_NAME, PUBLIC_RPC_URL, SITE_DESCRIPTION, WALLETCONNECT_PROJECT_ID } from "./config/site";

export const config = createConfig({
  chains: [CHAIN],
  // EIP-6963 discovery lists every installed extension under its own name
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected(),
    ...(WALLETCONNECT_PROJECT_ID
      ? [walletConnect({
          projectId: WALLETCONNECT_PROJECT_ID, showQrModal: true,
          metadata: { name: PROJECT_NAME, description: SITE_DESCRIPTION, url: location.origin, icons: [new URL("favicon.svg", location.href).href] },
        })]
      : []),
    coinbaseWallet({ appName: PROJECT_NAME }),
  ],
  transports: { [CHAIN.id]: http(PUBLIC_RPC_URL) },
});

declare module "wagmi" {
  interface Register { config: typeof config }
}
