export class HyperLiquidWebSocket {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private callbacks = new Map<string, (data: any) => void>();

  constructor(private url: string = "wss://api.hyperliquid.xyz/ws") {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;

          // Resubscribe to previous subscriptions
          this.subscriptions.forEach((sub) => {
            this.ws?.send(sub);
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket disconnected");
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(data: any) {
    // Handle different message types based on the data structure
    if (data.channel) {
      const callback = this.callbacks.get(data.channel);
      if (callback) {
        callback(data.data);
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(
          `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeToOrderBook(coin: string, callback: (data: any) => void) {
    const subscription = JSON.stringify({
      method: "subscribe",
      subscription: {
        type: "l2Book",
        coin,
      },
    });

    this.subscriptions.add(subscription);
    this.callbacks.set(`l2Book:${coin}`, callback);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(subscription);
    }
  }

  unsubscribeFromOrderBook(coin: string) {
    const subscription = JSON.stringify({
      method: "unsubscribe",
      subscription: {
        type: "l2Book",
        coin,
      },
    });

    this.subscriptions.delete(subscription);
    this.callbacks.delete(`l2Book:${coin}`);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(subscription);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.callbacks.clear();
  }
}
