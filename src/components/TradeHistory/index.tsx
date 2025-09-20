"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TradeReconstructor } from "@/lib/trade-reconstruction";
import { HyperLiquidAPI } from "@/lib/hyperliquid-api";
import { formatNumber, formatDuration } from "@/lib/utils";
import type { CompletedTrade, ClearinghouseState } from "@/types/hyperliquid";
import {
  Search,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Wallet,
  PieChart,
} from "lucide-react";
import { format } from "date-fns";

export function TradeHistory() {
  const [walletAddress, setWalletAddress] = useState("");
  const [trades, setTrades] = useState<CompletedTrade[]>([]);
  const [accountState, setAccountState] = useState<ClearinghouseState | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tradeReconstructor = new TradeReconstructor();
  const api = new HyperLiquidAPI();

  const handleSearch = async () => {
    if (!walletAddress.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Please enter a valid Ethereum address");
      return;
    }

    setLoading(true);
    setError(null);
    setTrades([]);
    setAccountState(null);

    try {
      // Fetch both trade history and account state
      const [completedTrades, clearinghouseState] = await Promise.all([
        tradeReconstructor.getCompletedTrades(walletAddress),
        api.getClearinghouseState(walletAddress),
      ]);

      setTrades(completedTrades);
      setAccountState(clearinghouseState);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load trade history"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Calculate trade statistics
  const totalPnl = trades.reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const winningTrades = trades.filter((trade) => trade.realizedPnl > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  // Account statistics from clearinghouse state
  const accountStats = accountState
    ? {
        accountValue: parseFloat(accountState.marginSummary.accountValue),
        totalPositionValue: parseFloat(accountState.marginSummary.totalNtlPos),
        totalRawUsd: parseFloat(accountState.marginSummary.totalRawUsd),
        marginUsed: parseFloat(accountState.marginSummary.totalMarginUsed),
        withdrawable: parseFloat(accountState.withdrawable),
        maintenanceMargin: parseFloat(accountState.crossMaintenanceMarginUsed),
      }
    : null;

  const totalUnrealizedPnl = accountState
    ? accountState.assetPositions.reduce(
        (sum, pos) => sum + parseFloat(pos.position.unrealizedPnl),
        0
      )
    : 0;

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History & Account Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter wallet address (0x...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Account Overview */}
      {accountState && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Wallet className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Account Value
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 font-mono">
                ${formatNumber(accountStats!.accountValue, 2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Position Value
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 font-mono">
                ${formatNumber(accountStats!.totalPositionValue, 2)}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg ${
              totalUnrealizedPnl >= 0
                ? "bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20"
                : "bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    totalUnrealizedPnl >= 0
                      ? "bg-green-500/10"
                      : "bg-red-500/10"
                  }`}
                >
                  <TrendingUp
                    className={`h-4 w-4 ${
                      totalUnrealizedPnl >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Unrealized PnL
                </div>
              </div>
              <div
                className={`text-2xl font-bold font-mono ${
                  totalUnrealizedPnl >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${formatNumber(totalUnrealizedPnl, 2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Target className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Margin Used
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600 font-mono">
                ${formatNumber(accountStats!.marginUsed, 2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <DollarSign className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Withdrawable
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 font-mono">
                ${formatNumber(accountStats!.withdrawable, 2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <PieChart className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Maintenance Margin
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-600 font-mono">
                ${formatNumber(accountStats!.maintenanceMargin, 2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Positions */}
      {accountState && accountState.assetPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Position Value</TableHead>
                  <TableHead>Unrealized PnL</TableHead>
                  <TableHead>ROE</TableHead>
                  <TableHead>Leverage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountState.assetPositions.map((assetPos, index) => {
                  const pos = assetPos.position;
                  const size = parseFloat(pos.szi);
                  const isLong = size > 0;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{pos.coin}</TableCell>
                      <TableCell>
                        <Badge variant={isLong ? "default" : "destructive"}>
                          {isLong ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {isLong ? "LONG" : "SHORT"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatNumber(Math.abs(size), 4)}</TableCell>
                      <TableCell>
                        ${formatNumber(parseFloat(pos.entryPx), 4)}
                      </TableCell>
                      <TableCell>
                        ${formatNumber(parseFloat(pos.positionValue), 2)}
                      </TableCell>
                      <TableCell
                        className={
                          parseFloat(pos.unrealizedPnl) >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        ${formatNumber(parseFloat(pos.unrealizedPnl), 2)}
                      </TableCell>
                      <TableCell
                        className={
                          parseFloat(pos.returnOnEquity) >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {formatNumber(parseFloat(pos.returnOnEquity) * 100, 2)}%
                      </TableCell>
                      <TableCell>{pos.leverage.value}x</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Trade Statistics */}
      {trades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{trades.length}</div>
              <p className="text-xs text-muted-foreground">Completed Trades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div
                className={`text-2xl font-bold ${
                  totalPnl >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                ${formatNumber(totalPnl, 2)}
              </div>
              <p className="text-xs text-muted-foreground">Realized PnL</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {formatNumber(winRate, 1)}%
              </div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {trades.length > 0
                  ? formatNumber(totalPnl / trades.length, 2)
                  : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">Avg PnL per Trade</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completed Trades Table */}
      {trades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Trades History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coin</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Exit Price</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Realized PnL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{trade.coin}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trade.direction === "long" ? "default" : "destructive"
                        }
                      >
                        {trade.direction === "long" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {trade.direction.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(trade.entryTime), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{formatDuration(trade.duration)}</TableCell>
                    <TableCell>${formatNumber(trade.entryPrice, 4)}</TableCell>
                    <TableCell>${formatNumber(trade.exitPrice, 4)}</TableCell>
                    <TableCell>{formatNumber(trade.size, 4)}</TableCell>
                    <TableCell
                      className={
                        trade.realizedPnl >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      ${formatNumber(trade.realizedPnl, 2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && trades.length === 0 && walletAddress && !error && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {accountState ? "No completed trades found for this address." : "No data found for this address."}
              </p>
              {accountState && (
                <div className="text-sm text-muted-foreground">
                  <p>This address has current positions but no completed trade history.</p>
                  <p>Completed trades will appear here after positions are closed.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
