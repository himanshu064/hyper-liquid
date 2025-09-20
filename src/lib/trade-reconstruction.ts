import { HyperLiquidAPI } from "./hyperliquid-api";
import type {
  CompletedTrade,
  LedgerUpdate,
  FundingUpdate,
} from "@/types/hyperliquid";

export class TradeReconstructor {
  private api: HyperLiquidAPI;

  constructor() {
    this.api = new HyperLiquidAPI();
  }

  async getCompletedTrades(userAddress: string): Promise<CompletedTrade[]> {
    const endTime = Date.now();
    const startTime = endTime - 2 * 365 * 24 * 60 * 60 * 1000; // 2 years ago

    try {
      // Get all ledger updates for the user
      const ledgerUpdates = await this.api.getUserNonFundingLedgerUpdates(
        userAddress,
        startTime,
        endTime
      );

      // Get current positions to exclude them
      const currentState = await this.api.getClearinghouseState(userAddress);
      const currentPositions = new Set(
        currentState.assetPositions.map((pos) => pos.position.coin)
      );

      // Process trades by grouping by coin
      const tradesByCoin = this.groupTradesByCoin(ledgerUpdates);
      const completedTrades: CompletedTrade[] = [];

      for (const [coin, trades] of tradesByCoin.entries()) {
        // Skip if user still has an open position in this coin
        if (currentPositions.has(coin)) continue;

        const coinCompletedTrades = this.reconstructCompletedTrades(
          coin,
          trades
        );
        completedTrades.push(...coinCompletedTrades);
      }

      return completedTrades.sort((a, b) => b.exitTime - a.exitTime);
    } catch (error) {
      console.error("Error reconstructing trades:", error);
      throw error;
    }
  }

  private groupTradesByCoin(
    ledgerUpdates: LedgerUpdate[]
  ): Map<string, LedgerUpdate[]> {
    const tradesByCoin = new Map<string, LedgerUpdate[]>();

    for (const update of ledgerUpdates) {
      if (update.delta.type === "trade" && update.delta.coin) {
        const coin = update.delta.coin;
        if (!tradesByCoin.has(coin)) {
          tradesByCoin.set(coin, []);
        }
        tradesByCoin.get(coin)!.push(update);
      }
    }

    return tradesByCoin;
  }

  private reconstructCompletedTrades(
    coin: string,
    trades: LedgerUpdate[]
  ): CompletedTrade[] {
    const completedTrades: CompletedTrade[] = [];
    let position = 0; // Current position size (positive = long, negative = short)
    let entryTime = 0;
    let entryPrice = 0;
    let totalEntryValue = 0;

    for (const trade of trades.sort((a, b) => a.time - b.time)) {
      const delta = trade.delta;
      if (!delta.sz || !delta.px || !delta.side) continue;

      const size = parseFloat(delta.sz);
      const price = parseFloat(delta.px);
      const tradeSize = delta.side === "buy" ? size : -size;

      const prevPosition = position;
      position += tradeSize;

      // Opening a new position
      if (prevPosition === 0 && position !== 0) {
        entryTime = trade.time;
        entryPrice = price;
        totalEntryValue = Math.abs(position) * price;
      }
      // Adding to existing position
      else if (
        Math.sign(prevPosition) === Math.sign(position) &&
        prevPosition !== 0
      ) {
        // Average the entry price
        const newValue = size * price;
        totalEntryValue += newValue;
        entryPrice = totalEntryValue / Math.abs(position);
      }
      // Closing position (partial or complete)
      else if (
        Math.sign(prevPosition) !== Math.sign(tradeSize) &&
        prevPosition !== 0
      ) {
        const closeSize = Math.min(Math.abs(prevPosition), Math.abs(tradeSize));
        const direction = prevPosition > 0 ? "long" : "short";

        let realizedPnl: number;
        if (direction === "long") {
          realizedPnl = closeSize * (price - entryPrice);
        } else {
          realizedPnl = closeSize * (entryPrice - price);
        }

        // If position is completely closed
        if (Math.abs(position) < 0.0001) {
          // Account for floating point precision
          completedTrades.push({
            coin,
            direction,
            entryTime,
            exitTime: trade.time,
            duration: trade.time - entryTime,
            realizedPnl,
            entryPrice,
            exitPrice: price,
            size: Math.abs(prevPosition),
          });

          // Reset for next position
          position = 0;
          entryTime = 0;
          entryPrice = 0;
          totalEntryValue = 0;
        }
        // If position is partially closed, adjust entry value
        else {
          const remainingRatio = Math.abs(position) / Math.abs(prevPosition);
          totalEntryValue *= remainingRatio;
        }
      }
    }

    return completedTrades;
  }
}
