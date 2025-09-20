import { HyperLiquidAPI } from "./hyperliquid-api";
import type {
  CompletedTrade,
  UserFill,
} from "@/types/hyperliquid";

export class TradeReconstructor {
  private api: HyperLiquidAPI;

  constructor() {
    this.api = new HyperLiquidAPI();
  }

  async getCompletedTrades(userAddress: string): Promise<CompletedTrade[]> {
    try {
      // Get user fills instead of ledger updates
      const fills = await this.api.getUserFills(userAddress);
      
      if (!fills || fills.length === 0) {
        return [];
      }

      // Group fills by coin and reconstruct trades
      const tradesBySymbol = new Map<string, UserFill[]>();
      
      fills.forEach(fill => {
        const coin = fill.coin;
        if (!tradesBySymbol.has(coin)) {
          tradesBySymbol.set(coin, []);
        }
        tradesBySymbol.get(coin)!.push(fill);
      });

      const completedTrades: CompletedTrade[] = [];

      // Process each coin's fills to reconstruct complete trades
      tradesBySymbol.forEach((coinFills, coin) => {
        // Sort fills by time
        coinFills.sort((a, b) => a.time - b.time);
        
        let position = 0;
        let entryPrice = 0;
        let entryTime = 0;
        let totalEntryValue = 0;

        coinFills.forEach(fill => {
          const size = parseFloat(fill.sz);
          const price = parseFloat(fill.px);
          const side = fill.side; // A = buy, B = sell
          const fillTime = fill.time;
          const closedPnl = parseFloat(fill.closedPnl || "0");

          // Update position based on fill
          const prevPosition = position;
          if (side === "A") { // Buy
            position += size;
          } else { // Sell
            position -= size;
          }

          // If this is opening a new position
          if (prevPosition === 0 && position !== 0) {
            entryTime = fillTime;
            entryPrice = price;
            totalEntryValue = Math.abs(position) * price;
          }
          // If adding to existing position in same direction
          else if (Math.sign(prevPosition) === Math.sign(position) && prevPosition !== 0) {
            // Average the entry price
            const newValue = size * price;
            totalEntryValue += newValue;
            entryPrice = totalEntryValue / Math.abs(position);
          }
          // If this fill has closed PnL, it's a completed trade
          else if (closedPnl !== 0) {
            const exitTime = fillTime;
            const duration = entryTime > 0 ? exitTime - entryTime : 0;
            
            completedTrades.push({
              coin,
              direction: prevPosition > 0 ? "long" : "short",
              entryTime,
              exitTime,
              duration,
              entryPrice,
              exitPrice: price,
              size: Math.abs(prevPosition),
              realizedPnl: closedPnl,
            });

            // Reset for next trade if position is closed
            if (Math.abs(position) < 0.0001) {
              position = 0;
              entryTime = 0;
              entryPrice = 0;
              totalEntryValue = 0;
            }
          }
        });
      });

      return completedTrades.sort((a, b) => b.entryTime - a.entryTime);
    } catch (error) {
      console.error("Error reconstructing trades:", error);
      throw new Error("Failed to reconstruct trade history");
    }
  }
}
