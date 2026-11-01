import { parseAbi } from "viem";

/**
 * Interface the live contracts are expected to expose. Nothing is deployed yet:
 * with empty addresses in src/config/site.ts the UI shows "Contracts not deployed".
 */
export const POOL_ABI = parseAbi([
  "function supply(uint256 assets)",
  "function withdraw(uint256 assets)",
  "function depositCollateral(uint256 amount)",
  "function withdrawCollateral(uint256 amount)",
  "function borrow(uint256 assets)",
  "function repay(uint256 assets)",
  "function setUseAsCollateral(bool enabled)",
  "function totalSupplied() view returns (uint256)",
  "function totalBorrowed() view returns (uint256)",
  "function healthFactor(address account) view returns (uint256)",
]);

export const ROUTER_ABI = parseAbi([
  "function distribute()",
  "function pending() view returns (uint256)",
  "function totalDistributed(uint8 fund) view returns (uint256)",
]);

export const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
]);
