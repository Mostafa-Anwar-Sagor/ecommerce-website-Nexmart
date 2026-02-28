import api from './api';
import {
  AIChatMessage,
  AIRecommendation,
  AIImageSearchResult,
  PricePrediction,
  ReviewSummary,
  Product,
} from '../types';

export const aiService = {
  // AI Shopping Assistant Chatbot
  async chat(messages: AIChatMessage[], userMessage: string): Promise<AIChatMessage> {
    const { data } = await api.post('/ai/chat', {
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      message: userMessage,
    });
    const result = data.data || {};
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: result.reply || result.content || 'Sorry, I could not generate a response.',
      products: result.productSuggestions || result.products || [],
      createdAt: new Date().toISOString(),
    };
  },

  // AI Product Recommendations
  async getRecommendations(context: {
    productId?: string;
    userId?: string;
    categoryId?: string;
    limit?: number;
  }): Promise<AIRecommendation> {
    const params = new URLSearchParams();
    if (context.limit) params.set('limit', String(context.limit));
    const { data } = await api.get(`/ai/recommendations?${params.toString()}`);
    // Backend returns an array of products directly
    const products = Array.isArray(data.data) ? data.data : (data.data?.products || []);
    return { products, reason: 'Based on your browsing & purchase history', confidence: 0.85 };
  },

  // AI Visual / Image Search
  async imageSearch(imageFile: File): Promise<AIImageSearchResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    const { data } = await api.post('/ai/image-search', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  // AI Review Summary
  async getReviewSummary(productId: string): Promise<ReviewSummary> {
    const { data } = await api.get(`/ai/review-summary/${productId}`);
    return data.data;
  },

  // AI Price Prediction / Price Drop Alert
  async getPricePrediction(productId: string): Promise<PricePrediction> {
    const { data } = await api.get(`/ai/price-prediction/${productId}`);
    return data.data;
  },

  // AI Product Description Generator (for sellers)
  async generateProductDescription(input: {
    name: string;
    category: string;
    features: string[];
    brand?: string;
  }): Promise<{ description: string; shortDescription: string; tags: string[] }> {
    const { data } = await api.post('/ai/generate-description', input);
    return data.data;
  },

  // AI Smart Search - semantic product search
  async smartSearch(query: string, page = 1, limit = 20): Promise<{
    products: Product[];
    total: number;
    suggestions: string[];
    relatedQueries: string[];
  }> {
    const { data } = await api.post('/ai/smart-search', { query, page, limit });
    return data.data;
  },

  // AI Fake Review Detector
  async detectFakeReview(reviewText: string): Promise<{
    isFake: boolean;
    confidence: number;
    reasons: string[];
  }> {
    const { data } = await api.post('/ai/detect-fake-review', { text: reviewText });
    return data.data;
  },

  // AI Product Comparison
  async compareProducts(productIds: string[]): Promise<{
    comparison: Record<string, unknown>[];
    winner: string;
    verdict: string;
  }> {
    const { data } = await api.post('/ai/compare-products', { productIds });
    return data.data;
  },

  // AI Size/Fit Recommendation
  async getSizeRecommendation(productId: string, measurements: Record<string, number>): Promise<{
    recommendedSize: string;
    confidence: number;
    fit: string;
  }> {
    const { data } = await api.post('/ai/size-recommendation', { productId, measurements });
    return data.data;
  },

  // AI Autocomplete search suggestions
  async getSearchSuggestions(query: string): Promise<{ suggestions: string[]; trending: string[] }> {
    const { data } = await api.get(`/ai/search-suggestions?q=${encodeURIComponent(query)}`);
    return data.data;
  },
};
