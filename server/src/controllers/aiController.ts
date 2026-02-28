import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ApiError, successResponse } from '../middleware/errorHandler';
import { chatWithAssistant } from '../ai/chatbot';
import { generateProductDescription } from '../ai/descriptionGenerator';
import { analyzeReviews, detectFakeReview } from '../ai/sentimentAnalysis';
import { getPersonalizedRecommendations, getSimilarProducts, getTrendingProducts } from '../ai/recommendation';
import { searchByImage } from '../ai/imageSearch';
import { predictPrice } from '../ai/priceOptimizer';
import { getSearchSuggestions, compareProducts, enhanceSearchQuery } from '../ai/searchEnhancer';
import { prisma } from '../config/database';

export const chat = async (req: AuthRequest, res: Response) => {
  const { messages, message } = req.body;
  if (!messages || !Array.isArray(messages)) throw ApiError.badRequest('Messages array required');

  // The frontend sends previous messages in `messages` and the new user message as `message`
  // Append the new message so the chatbot processes the latest input
  const allMessages = message
    ? [...messages, { role: 'user' as const, content: message }]
    : messages;

  if (allMessages.length === 0) throw ApiError.badRequest('At least one message required');

  const result = await chatWithAssistant(allMessages, req.user?.id);
  return successResponse(res, result);
};

export const generateDescription = async (req: AuthRequest, res: Response) => {
  const { name, category, specifications, price, targetAudience } = req.body;
  if (!name || !category) throw ApiError.badRequest('Product name and category required');

  const description = await generateProductDescription({ name, category, specifications, price, targetAudience });
  return successResponse(res, description);
};

export const reviewSummary = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const summary = await analyzeReviews(productId);
  return successResponse(res, summary);
};

export const fakeReviewDetection = async (req: AuthRequest, res: Response) => {
  const { rating, comment, productId } = req.body;
  if (!rating || !productId) throw ApiError.badRequest('Rating and productId required');

  const result = await detectFakeReview({ rating, comment: comment || '', userId: req.user?.id || '', productId });
  return successResponse(res, result);
};

export const recommendations = async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) throw ApiError.unauthorized('Login required for personalized recommendations');

  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const products = await getPersonalizedRecommendations(req.user.id, limit);
  return successResponse(res, products);
};

export const similarProducts = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 6, 12);
  const products = await getSimilarProducts(productId, limit);
  return successResponse(res, products);
};

export const trending = async (req: AuthRequest, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const products = await getTrendingProducts(limit);
  return successResponse(res, products);
};

export const imageSearch = async (req: AuthRequest, res: Response) => {
  const { image } = req.body;
  if (!image) throw ApiError.badRequest('Image data required (base64)');

  const result = await searchByImage(image);
  return successResponse(res, result);
};

export const pricePrediction = async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const prediction = await predictPrice(productId);
  return successResponse(res, prediction);
};

export const searchSuggestions = async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  if (!q) return successResponse(res, []);

  // Save search history for authenticated users
  if (req.user?.id && String(q).length > 2) {
    prisma.searchHistory.create({
      data: { userId: req.user.id, query: String(q) },
    }).catch(() => {});
  }

  const suggestions = await getSearchSuggestions(String(q));
  return successResponse(res, suggestions);
};

export const compareProductsController = async (req: AuthRequest, res: Response) => {
  const { productIds } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
    throw ApiError.badRequest('At least 2 product IDs required');
  }
  if (productIds.length > 4) throw ApiError.badRequest('Maximum 4 products can be compared');

  const comparison = await compareProducts(productIds);
  return successResponse(res, comparison);
};

export const smartSearchController = async (req: AuthRequest, res: Response) => {
  const { q } = req.query;
  if (!q) throw ApiError.badRequest('Search query required');

  const enhanced = await enhanceSearchQuery(String(q));
  return successResponse(res, enhanced);
};
