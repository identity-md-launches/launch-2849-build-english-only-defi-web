/** Market definitions. Risk parameters are protocol settings; amounts in demo mode are SIMULATED. */
export interface MarketDef {
  id: "tbill" | "treal" | "tgold" | "tinvoice";
  symbol: string;
  name: string;
  asset: string;
  issuer: string;
  oracle: string;
  oracleHeartbeat: string;
  /** Max loan-to-value (collateral factor), fraction. */
  ltv: number;
  liqThreshold: number;
  liqPenalty: number;
  /** Share of the liquidation penalty routed to the protocol; rest to the liquidator. */
  protocolPenaltyShare: number;
  originationFee: number;
  /** Kinked rate model, all APR fractions. */
  rate: { base: number; slope1: number; slope2: number; kink: number };
}

export const MARKETS: readonly MarketDef[] = [
  {
    id: "tbill", symbol: "tT-BILL", name: "Tokenized T-bills", asset: "Short-term U.S. Treasury bills",
    issuer: "Demo issuer", oracle: "Issuer NAV feed (demo)", oracleHeartbeat: "24h heartbeat, 0.5% deviation",
    ltv: 0.9, liqThreshold: 0.93, liqPenalty: 0.03, protocolPenaltyShare: 0.25, originationFee: 0.001,
    rate: { base: 0.01, slope1: 0.05, slope2: 0.6, kink: 0.9 },
  },
  {
    id: "treal", symbol: "tREAL", name: "Tokenized real estate", asset: "Investment-grade real estate",
    issuer: "Demo issuer", oracle: "Appraisal NAV feed (demo)", oracleHeartbeat: "Monthly appraisal, 7-day staleness limit",
    ltv: 0.6, liqThreshold: 0.7, liqPenalty: 0.08, protocolPenaltyShare: 0.25, originationFee: 0.0025,
    rate: { base: 0.02, slope1: 0.08, slope2: 0.9, kink: 0.75 },
  },
  {
    id: "tgold", symbol: "tGOLD", name: "Tokenized gold", asset: "Allocated gold, 1 token = 1 troy oz",
    issuer: "Demo issuer", oracle: "Spot gold feed (demo)", oracleHeartbeat: "1h heartbeat, 1% deviation",
    ltv: 0.75, liqThreshold: 0.82, liqPenalty: 0.05, protocolPenaltyShare: 0.25, originationFee: 0.0015,
    rate: { base: 0.015, slope1: 0.06, slope2: 0.75, kink: 0.8 },
  },
  {
    id: "tinvoice", symbol: "tINVOICE", name: "Tokenized invoices", asset: "Trade receivables",
    issuer: "Demo issuer", oracle: "Receivables NAV feed (demo)", oracleHeartbeat: "Daily, discounted for days past due",
    ltv: 0.55, liqThreshold: 0.65, liqPenalty: 0.1, protocolPenaltyShare: 0.25, originationFee: 0.003,
    rate: { base: 0.03, slope1: 0.1, slope2: 1.0, kink: 0.8 },
  },
];

export const marketById = (id: string) => MARKETS.find((m) => m.id === id);
