/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Asset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  marginTableId?: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface AssetContext {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string | null;
  oraclePx: string;
  markPx: string;
  midPx: string | null;
  impactPxs: [string, string] | null;
  dayBaseVlm: string;
}

export interface MetaResponse {
  universe: Asset[];
  marginTables: [number, { description: string; marginTiers: any[] }][];
}

export interface MetaAndAssetCtxsResponse extends Array<any> {
  0: MetaResponse;
  1: AssetContext[];
}

export interface Position {
  coin: string;
  szi: string;
  leverage: {
    type: string;
    value: number;
  };
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string;
  marginUsed: string;
  maxLeverage: number;
  cumFunding: {
    allTime: string;
    sinceOpen: string;
    sinceChange: string;
  };
}

export interface AssetPosition {
  type: string;
  position: Position;
}

export interface ClearinghouseState {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPosition[];
  time: number;
}

export interface FundingUpdate {
  time: number;
  hash: string;
  delta: {
    type: "funding";
    coin: string;
    usdc: string;
    szi: string;
    fundingRate: string;
    nSamples?: number | null;
  };
}

export interface LedgerUpdate {
  time: number;
  hash: string;
  delta: {
    type: "deposit" | "withdraw" | "trade";
    usdc?: string;
    nonce?: number;
    fee?: string;
    coin?: string;
    side?: "buy" | "sell";
    sz?: string;
    px?: string;
    closedPnl?: string;
  };
}

export interface CompletedTrade {
  coin: string;
  direction: "long" | "short";
  entryTime: number;
  exitTime: number;
  duration: number;
  realizedPnl: number;
  entryPrice: number;
  exitPrice: number;
  size: number;
}

export interface OrderBookLevel {
  px: string;
  sz: string;
}

export interface OrderBook {
  coin: string;
  levels: [OrderBookLevel[], OrderBookLevel[]]; // [bids, asks]
  time: number;
}

export interface OpenTrade {
  coin: string;
  direction: "long" | "short";
  entryTime: number;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  duration: number;
  isOpen: true;
}

export interface AllTrades {
  openTrades: OpenTrade[];
  completedTrades: CompletedTrade[];
}
