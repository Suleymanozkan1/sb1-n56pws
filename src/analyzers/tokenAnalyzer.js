import fetch from 'node-fetch';
import { setupLogger } from '../utils/logger.js';

const logger = setupLogger();

export class TokenAnalyzer {
  constructor() {
    this.logger = setupLogger();
  }

  calculateMetrics(tokenInfo) {
    const metrics = {
      volumeScore: this.calculateVolumeScore(tokenInfo.volume24h),
      priceScore: this.calculatePriceScore(tokenInfo.changePercent24h),
      timeScore: this.calculateTimeScore(tokenInfo.firstTradeTime),
    };

    metrics.totalScore = (metrics.volumeScore + metrics.priceScore + metrics.timeScore) / 3;
    return metrics;
  }

  calculateVolumeScore(volume) {
    if (volume > 1000000) return 1.0;
    if (volume > 100000) return 0.8;
    if (volume > 10000) return 0.6;
    if (volume > 1000) return 0.4;
    return 0.2;
  }

  calculatePriceScore(changePercent) {
    if (changePercent > 100) return 1.0;
    if (changePercent > 50) return 0.8;
    if (changePercent > 20) return 0.6;
    if (changePercent > 0) return 0.4;
    return 0.2;
  }

  calculateTimeScore(firstTradeTime) {
    const hoursSinceFirst = (Date.now() - firstTradeTime) / (1000 * 60 * 60);
    if (hoursSinceFirst < 1) return 1.0;
    if (hoursSinceFirst < 6) return 0.8;
    if (hoursSinceFirst < 12) return 0.6;
    if (hoursSinceFirst < 24) return 0.4;
    return 0.2;
  }
}