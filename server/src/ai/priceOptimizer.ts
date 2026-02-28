import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import logger from '../utils/logger';

export interface PricePrediction {
  currentPrice: number;
  predictedPrice: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  recommendation: string;
  bestTimeToBuy: string;
}

export const predictPrice = async (productId: string): Promise<PricePrediction> => {
  const cacheKey = `price_prediction:${productId}`;
  const cached = await cacheGet<PricePrediction>(cacheKey);
  if (cached) return cached;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true, discountPrice: true },
  });

  if (!product) throw new Error('Product not found');

  const priceHistory = await prisma.priceHistory.findMany({
    where: { productId },
    orderBy: { date: 'asc' },
    take: 30,
  });

  const currentPrice = product.discountPrice || product.price;

  if (priceHistory.length < 3) {
    const result: PricePrediction = {
      currentPrice,
      predictedPrice: currentPrice,
      trend: 'stable',
      confidence: 0.5,
      recommendation: 'Not enough price history to make a prediction. The current price appears fair.',
      bestTimeToBuy: 'Now is a good time to buy.',
    };
    await cacheSet(cacheKey, result, 3600);
    return result;
  }

  // Simple moving average trend analysis
  const prices = priceHistory.map((h) => h.price);
  const recentAvg = prices.slice(-5).reduce((s, p) => s + p, 0) / Math.min(prices.length, 5);
  const olderAvg = prices.slice(0, Math.floor(prices.length / 2)).reduce((s, p) => s + p, 0) / Math.floor(prices.length / 2);

  const trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
  const trend: 'up' | 'down' | 'stable' = trendPercent > 2 ? 'up' : trendPercent < -2 ? 'down' : 'stable';

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  let predictedPrice = currentPrice;
  let recommendation = '';
  let bestTimeToBuy = '';

  if (trend === 'down') {
    predictedPrice = currentPrice * 0.95;
    recommendation = 'Price is trending down. You might get a better deal if you wait a few days.';
    bestTimeToBuy = 'Wait 3-5 days for a potentially lower price.';
  } else if (trend === 'up') {
    predictedPrice = currentPrice * 1.03;
    recommendation = 'Price is trending up. Buy now to get the current price.';
    bestTimeToBuy = 'Buy now — price may increase soon.';
  } else {
    recommendation = 'Price is stable. The current price is fair.';
    bestTimeToBuy = currentPrice <= (minPrice + priceRange * 0.25) ? 'Great time to buy — near historical low!' : 'Price is stable, buy when you\'re ready.';
  }

  const result: PricePrediction = {
    currentPrice,
    predictedPrice: Math.round(predictedPrice * 100) / 100,
    trend,
    confidence: Math.min(0.85, 0.4 + (priceHistory.length / 30) * 0.45),
    recommendation,
    bestTimeToBuy,
  };

  await cacheSet(cacheKey, result, 3600 * 4);
  return result;
};
