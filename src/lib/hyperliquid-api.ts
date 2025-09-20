import { ClearinghouseState } from "@/types/hyperliquid";
import { LedgerUpdate } from "@/types/hyperliquid";
import { OrderBook } from "@/types/hyperliquid";
import { FundingUpdate } from "@/types/hyperliquid";
import { MetaAndAssetCtxsResponse } from "@/types/hyperliquid";
import { MetaResponse } from "@/types/hyperliquid";

// lib/hyperliquid-api.ts
const API_BASE = "https://api.hyperliquid.xyz";

export class HyperLiquidAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getMeta(): Promise<MetaResponse> {
    return this.post("/info", { type: "meta" });
  }

  async getMetaAndAssetCtxs(): Promise<MetaAndAssetCtxsResponse> {
    return this.post("/info", { type: "metaAndAssetCtxs" });
  }

  async getClearinghouseState(user: string): Promise<ClearinghouseState> {
    return this.post("/info", {
      type: "clearinghouseState",
      user,
    });
  }

  async getUserFunding(
    user: string,
    startTime: number,
    endTime?: number
  ): Promise<FundingUpdate[]> {
    return this.post("/info", {
      type: "userFunding",
      user,
      startTime,
      ...(endTime && { endTime }),
    });
  }

  async getUserNonFundingLedgerUpdates(
    user: string,
    startTime: number,
    endTime?: number
  ): Promise<LedgerUpdate[]> {
    return this.post("/info", {
      type: "userNonFundingLedgerUpdates",
      user,
      startTime,
      ...(endTime && { endTime }),
    });
  }

  // For order book, we'll need WebSocket connection
  // This is a placeholder for the order book data structure
  getOrderBookSnapshot(coin: string): Promise<OrderBook> {
    // In a real implementation, this would connect to WebSocket
    // For now, we'll return mock data
    return Promise.resolve({
      coin,
      levels: [[], []],
      time: Date.now(),
    });
  }
}
