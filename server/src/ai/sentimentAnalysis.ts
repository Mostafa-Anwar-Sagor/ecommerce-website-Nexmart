import openai from '../config/openai';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import logger from '../utils/logger';

export interface ReviewSummary {
  overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  sentimentScore: number; // 0-100
  summary: string;
  pros: string[];
  cons: string[];
  commonTopics: string[];
  recommendationRate: number; // percentage
}

export const analyzeReviews = async (productId: string): Promise<ReviewSummary> => {
  const cacheKey = `review_sentiment:${productId}`;
  const cached = await cacheGet<ReviewSummary>(cacheKey);
  if (cached) return cached;

  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true, comment: true },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  if (reviews.length === 0) {
    return {
      overallSentiment: 'neutral',
      sentimentScore: 50,
      summary: 'No reviews yet. Be the first to review this product!',
      pros: [],
      cons: [],
      commonTopics: [],
      recommendationRate: 0,
    };
  }

  const reviewsText = reviews
    .map((r) => `Rating: ${r.rating}/5 - "${r.comment}"`)
    .join('\n');

  const prompt = `Analyze these product reviews and provide a summary:

${reviewsText}

Respond with JSON:
{
  "overallSentiment": "positive|neutral|negative|mixed",
  "sentimentScore": <0-100>,
  "summary": "2-3 sentence AI summary of what customers think",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2"],
  "commonTopics": ["topic1", "topic2", "topic3"],
  "recommendationRate": <percentage who would recommend>
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content');

    const result = JSON.parse(content) as ReviewSummary;
    await cacheSet(cacheKey, result, 3600 * 6); // Cache 6 hours
    return result;
  } catch (error) {
    logger.error('Review sentiment analysis failed', { error });
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    return {
      overallSentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative',
      sentimentScore: Math.round((avgRating / 5) * 100),
      summary: `Based on ${reviews.length} reviews with an average rating of ${avgRating.toFixed(1)}/5.`,
      pros: [],
      cons: [],
      commonTopics: [],
      recommendationRate: Math.round((reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100),
    };
  }
};

export const detectFakeReview = async (review: { rating: number; comment: string; userId: string; productId: string }): Promise<{ isSuspicious: boolean; confidence: number; reason?: string }> => {
  if (!review.comment || review.comment.length < 10) {
    return { isSuspicious: false, confidence: 0.5 };
  }

  const prompt = `Analyze if this product review is fake or suspicious:
Rating: ${review.rating}/5
Review: "${review.comment}"

Consider: generic text, extreme bias, irrelevant content, bot-like patterns.
Respond with JSON: {"isSuspicious": boolean, "confidence": 0.0-1.0, "reason": "brief reason if suspicious"}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    return content ? JSON.parse(content) : { isSuspicious: false, confidence: 0.5 };
  } catch {
    return { isSuspicious: false, confidence: 0.5 };
  }
};
