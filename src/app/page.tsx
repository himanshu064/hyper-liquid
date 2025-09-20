import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderBook } from "@/components/OrderBook";
import { TradeHistory } from "@/components/TradeHistory";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-4 lg:mb-8 text-center">
          HyperLiquid Trading App
        </h1>

        <Tabs defaultValue="orderbook" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orderbook">Order Book</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
          </TabsList>

          <TabsContent value="orderbook" className="mt-6">
            <OrderBook />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <TradeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
