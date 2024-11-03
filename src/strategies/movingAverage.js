export class MovingAverageStrategy {
  constructor(shortPeriod = 9, longPeriod = 21) {
    this.shortPeriod = shortPeriod;
    this.longPeriod = longPeriod;
  }

  calculateMA(data, period) {
    const closes = data.map(candle => candle.close);
    const mas = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      mas.push(sum / period);
    }
    
    return mas;
  }

  analyze(data) {
    if (data.length < this.longPeriod) {
      return null;
    }

    const shortMA = this.calculateMA(data, this.shortPeriod);
    const longMA = this.calculateMA(data, this.longPeriod);

    // Get the two most recent MA values
    const currentShortMA = shortMA[shortMA.length - 1];
    const previousShortMA = shortMA[shortMA.length - 2];
    const currentLongMA = longMA[longMA.length - 1];
    const previousLongMA = longMA[longMA.length - 2];

    // Generate signals based on MA crossovers
    if (previousShortMA <= previousLongMA && currentShortMA > currentLongMA) {
      return {
        type: 'BUY',
        price: data[data.length - 1].close,
        timestamp: data[data.length - 1].timestamp,
        reason: 'Short MA crossed above Long MA'
      };
    }

    if (previousShortMA >= previousLongMA && currentShortMA < currentLongMA) {
      return {
        type: 'SELL',
        price: data[data.length - 1].close,
        timestamp: data[data.length - 1].timestamp,
        reason: 'Short MA crossed below Long MA'
      };
    }

    return null;
  }
}