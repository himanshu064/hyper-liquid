"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HyperLiquidAPI } from "@/lib/hyperliquid-api";
import { formatNumber } from "@/lib/utils";
import type {
  Asset,
  AssetContext,
  MetaAndAssetCtxsResponse,
} from "@/types/hyperliquid";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface OrderBookProps {}

export function OrderBook({}: OrderBookProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetContexts, setAssetContexts] = useState<AssetContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = new HyperLiquidAPI();

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMarketData = async () => {
    try {
      setError(null);
      const data: MetaAndAssetCtxsResponse = await api.getMetaAndAssetCtxs();
      const [meta, contexts] = data;
      setAssets(meta.universe.filter((asset) => !asset.isDelisted));
      setAssetContexts(contexts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load market data"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedAssetData = assets.find(
    (asset) => asset.name === selectedAsset
  );
  const selectedAssetIndex = assets.findIndex(
    (asset) => asset.name === selectedAsset
  );
  const selectedContext =
    selectedAssetIndex >= 0 ? assetContexts[selectedAssetIndex] : null;

  if (loading) {
    return (
      <Card className="w-full mx-auto">
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading market data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-96 flex-col">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={loadMarketData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Asset Selector */}
      <Card className="lg:col-span-1 pb-0">
        <CardHeader className="pb-0">
          <CardTitle>Markets</CardTitle>
        </CardHeader>
        <div className="border-t" />
        <CardContent>
          <div className="space-y-2 max-h-[450px] overflow-y-auto">
            {assets.map((asset, index) => {
              const context = assetContexts[index];
              const priceChange =
                context && context.prevDayPx
                  ? ((parseFloat(context.markPx) -
                      parseFloat(context.prevDayPx)) /
                      parseFloat(context.prevDayPx)) *
                    100
                  : 0;

              return (
                <div
                  key={asset.name}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAsset === asset.name
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedAsset(asset.name)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm opacity-75">
                        {context
                          ? `${formatNumber(
                              parseFloat(context.markPx),
                              asset.szDecimals
                            )}`
                          : "-"}
                      </div>
                    </div>
                    <div
                      className={`text-sm ${
                        priceChange >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {priceChange >= 0 ? "+" : ""}
                      {formatNumber(priceChange, 2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Order Book */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Book - {selectedAsset}</span>
            <div className="text-sm font-normal">
              {selectedContext && (
                <span>
                  Mark: $
                  {formatNumber(
                    parseFloat(selectedContext.markPx),
                    selectedAssetData?.szDecimals || 2
                  )}
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <div className="border-t" />
        <CardContent>
          {selectedContext ? (
            <div className="space-y-4">
              {/* Market Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">
                    24h Volume
                  </div>
                  <div className="font-medium">
                    $
                    {formatNumber(
                      parseFloat(selectedContext.dayNtlVlm) / 1000000,
                      2
                    )}
                    M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Open Interest
                  </div>
                  <div className="font-medium">
                    $
                    {formatNumber(
                      (parseFloat(selectedContext.openInterest) *
                        parseFloat(selectedContext.markPx)) /
                        1000000,
                      2
                    )}
                    M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Funding Rate
                  </div>
                  <div className="font-medium">
                    {(parseFloat(selectedContext.funding) * 100).toFixed(4)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Oracle Price
                  </div>
                  <div className="font-medium">
                    $
                    {formatNumber(
                      parseFloat(selectedContext.oraclePx),
                      selectedAssetData?.szDecimals || 2
                    )}
                  </div>
                </div>
              </div>

              {/* Mock Order Book Data */}
              <div className="grid grid-cols-2 gap-4 ml-1">
                {/* Asks (Sell Orders) */}
                <div>
                  <div className="text-sm font-medium mb-2 text-red-500">
                    Asks (Sell)
                  </div>
                  <div className="space-y-1">
                    {selectedContext.impactPxs &&
                      selectedContext.impactPxs[1] && (
                        <>
                          {[...Array(10)].map((_, i) => {
                            const basePrice = parseFloat(
                              selectedContext.impactPxs![1]
                            );
                            const price = basePrice + i * basePrice * 0.001;
                            const size = Math.random() * 10 + 1;
                            return (
                              <div
                                key={i}
                                className="flex justify-between text-sm p-1 hover:bg-red-500/10 rounded"
                              >
                                <span className="text-red-500">
                                  $
                                  {formatNumber(
                                    price,
                                    selectedAssetData?.szDecimals || 2
                                  )}
                                </span>
                                <span>{formatNumber(size, 3)}</span>
                              </div>
                            );
                          })}
                        </>
                      )}
                  </div>
                </div>

                {/* Bids (Buy Orders) */}
                <div>
                  <div className="text-sm font-medium mb-2 text-green-500">
                    Bids (Buy)
                  </div>
                  <div className="space-y-1">
                    {selectedContext.impactPxs &&
                      selectedContext.impactPxs[0] && (
                        <>
                          {[...Array(10)].map((_, i) => {
                            const basePrice = parseFloat(
                              selectedContext.impactPxs![0]
                            );
                            const price = basePrice - i * basePrice * 0.001;
                            const size = Math.random() * 10 + 1;
                            return (
                              <div
                                key={i}
                                className="flex justify-between text-sm p-1 hover:bg-green-500/10 rounded"
                              >
                                <span className="text-green-500">
                                  $
                                  {formatNumber(
                                    price,
                                    selectedAssetData?.szDecimals || 2
                                  )}
                                </span>
                                <span>{formatNumber(size, 3)}</span>
                              </div>
                            );
                          })}
                        </>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select an asset to view order book
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
