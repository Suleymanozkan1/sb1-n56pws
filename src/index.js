import { TokenScanner } from './scanners/tokenScanner.js';
import { TokenAnalyzer } from './analyzers/tokenAnalyzer.js';
import { setupLogger } from './utils/logger.js';

const logger = setupLogger();
const scanner = new TokenScanner();
const analyzer = new TokenAnalyzer();

async function run() {
  logger.info('Starting token scanner...');

  while (true) {
    try {
      // Scan for new tokens
      const newTokens = await scanner.getNewTokens();

      // Analyze each new token
      for (const token of newTokens) {
        const metrics = analyzer.calculateMetrics(token);
        
        // Log interesting tokens (high score)
        if (metrics.totalScore >= 0.7) {
          logger.info('Found promising new token:', {
            symbol: token.symbol,
            price: token.price,
            volume24h: token.volume24h,
            changePercent24h: token.changePercent24h,
            metrics: metrics
          });
        }
      }

      // Wait for 5 minutes before next scan
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    } catch (error) {
      logger.error(`Error in main loop: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
}

// Start the scanner
run().catch(error => {
  logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});