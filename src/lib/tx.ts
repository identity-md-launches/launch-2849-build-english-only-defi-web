import { useAccount, useSignMessage, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { CHAIN_ID, IS_DEMO, LIVE_ADDRESSES, USDC_ADDRESS } from "../config/site";
import { POOL_ABI, ROUTER_ABI, ERC20_ABI } from "../config/abi";
import { useStore } from "../state/store";
import type { TxAction } from "./actions";

/** Why a signing control is unavailable, or null when it can be used. */
export function useTxGate(a?: TxAction): string | null {
  const { isConnected, chainId } = useAccount();
  if (!isConnected) return "Connect a wallet to continue. Reading the pages does not need one.";
  if (chainId !== CHAIN_ID) return "Wrong network. Switch your wallet to Ethereum Mainnet to continue.";
  if (!IS_DEMO) {
    const deployed = a?.kind === "distribute" || a?.kind === "claim"
      ? !!LIVE_ADDRESSES.router
      : !!(a?.market && LIVE_ADDRESSES.markets[a.market]?.pool);
    if (!deployed) return "Contracts not deployed. Live actions open after deployment.";
  }
  return null;
}

export const isUserRejection = (e: unknown) =>
  /reject|denied|cancel/i.test(String((e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? e));

/** Sign and execute. Demo: a free message signature records a simulated transaction. Live: contract writes. */
export function useExecute() {
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const { address } = useAccount();
  const store = useStore();

  return async (a: TxAction, title: string, amountLabel: string) => {
    if (IS_DEMO) {
      await signMessageAsync({
        message: `VAULTLINE demo\nSimulated transaction, no funds move.\nAction: ${title}\nAmount: ${amountLabel}\nChain: Ethereum (1)`,
      });
      store.apply(a, title);
      return;
    }
    if (a.kind === "distribute") {
      await writeContractAsync({ address: LIVE_ADDRESSES.router as `0x${string}`, abi: ROUTER_ABI, functionName: "distribute" });
      return;
    }
    const mk = LIVE_ADDRESSES.markets[a.market!];
    const pool = mk.pool as `0x${string}`;
    const amount = parseUnits(String(a.amount ?? 0), a.asset === "collateral" ? 18 : 6);
    const needsApproval = a.kind === "repay" || a.kind === "supply";
    if (needsApproval && address && client) {
      const token = (a.asset === "collateral" ? mk.collateral : USDC_ADDRESS) as `0x${string}`;
      const allowance = await client.readContract({ address: token, abi: ERC20_ABI, functionName: "allowance", args: [address, pool] });
      if (allowance < amount) await writeContractAsync({ address: token, abi: ERC20_ABI, functionName: "approve", args: [pool, amount] });
    }
    if (a.kind === "toggle") {
      await writeContractAsync({ address: pool, abi: POOL_ABI, functionName: "setUseAsCollateral", args: [a.enable ?? true] });
      return;
    }
    const fn = a.asset === "collateral"
      ? (a.kind === "supply" ? "depositCollateral" : "withdrawCollateral")
      : (a.kind as "supply" | "withdraw" | "borrow" | "repay");
    await writeContractAsync({ address: pool, abi: POOL_ABI, functionName: fn, args: [amount] });
  };
}
