import ccxt from 'ccxt';
import { setupLogger } from '../utils/logger.js';

const logger = setupLogger();

export class TokenScanner {
  constructor(exchange = 'binance') {
    this.exchange = new ccxt[exchange]({
      enableRateLimit: true,
    });
    this.knownTokens = new Set();
    this.lastScanTime = 0;
  }

  async getNewTokens() {
    try {
      const markets = await this.exchange.loadMarkets();
      const currentTime = Date.now();
      const newTokens = [];

      for (const [symbol, market] of Object.entries(markets)) {
        // Only look at USDT pairs as they're typically used for new listings
        if (!symbol.endsWith('/USDT')) continue;

        // Skip if we already know about this token
        if (this.knownTokens.has(symbol)) continue;

        try {
          const ticker = await this.exchange.fetchTicker(symbol);
          const trades = await this.exchange.fetchTrades(symbol, undefined, 1);
          
          // If first trade is recent (within last 24 hours)
          if (trades.length > 0 && currentTime - trades[0].timestamp < 24 * 60 * 60 * 1000) {
            const tokenInfo = {
              symbol,
              price: ticker.last,
              volume24h: ticker.quoteVolume,
              firstTradeTime: trades[0].timestamp,
              changePercent24h: ticker.percentage,
            };

            newTokens.push(tokenInfo);
            this.knownTokens.add(symbol);
            
            logger.info(`Found new token: ${symbol}`, tokenInfo);
          }
        } catch (error) {
          continue; // Skip problematic tokens
        }
      }

      return newTokens;
    } catch (error) {
      logger.error(`Error scanning for new tokens: ${error.message}`);
      return [];
    }
  }
}