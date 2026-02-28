import openai from '../config/openai';
import { prisma } from '../config/database';
import logger from '../utils/logger';

export const enhanceSearchQuery = async (query: string): Promise<{ enhanced: string; synonyms: string[]; expandedTerms: string[] }> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Enhance this e-commerce search query for better product matching: "${query}". Respond with JSON: {"enhanced": "improved query", "synonyms": ["syn1", "syn2"], "expandedTerms": ["term1", "term2", "term3"]}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response');
    return JSON.parse(content);
  } catch {
    return { enhanced: query, synonyms: [], expandedTerms: [] };
  }
};

export const getSearchSuggestions = async (partialQuery: string): Promise<string[]> => {
  if (!partialQuery || partialQuery.length < 2) return [];

  try {
    // First check recent popular searches in DB
    const searches = await prisma.searchHistory.findMany({
      where: { query: { contains: partialQuery, mode: 'insensitive' } },
      select: { query: true },
      distinct: ['query'],
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const dbSuggestions = searches.map((s) => s.query);

    // Supplement with product names
    const products = await prisma.product.findMany({
      where: { name: { contains: partialQuery, mode: 'insensitive' }, isActive: true },
      select: { name: true },
      take: 5,
    });

    const productSuggestions = products.map((p) => p.name);

    const allSuggestions = [...new Set([...dbSuggestions, ...productSuggestions])].slice(0, 8);
    return allSuggestions;
  } catch (error) {
    logger.error('Search suggestions error', { error });
    return [];
  }
};

export const compareProducts = async (productIds: string[]): Promise<object> => {
  if (productIds.length < 2) throw new Error('Need at least 2 products to compare');

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true, shop: true },
  });

  if (products.length < 2) throw new Error('Products not found');

  const productSummaries = products.map((p) => ({
    name: p.name,
    price: p.discountPrice || p.price,
    rating: p.rating,
    soldCount: p.soldCount,
    category: p.category?.name,
    shop: p.shop.name,
    specifications: p.specifications,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Compare these products and provide a recommendation:
${JSON.stringify(productSummaries, null, 2)}

Respond with JSON:
{
  "recommendation": "which product is best and why",
  "bestValue": "product name with best value for money",
  "comparison": {
    "price": "comparison insight",
    "rating": "comparison insight",
    "popularity": "comparison insight"
  },
  "winner": "product name"
}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    const aiAnalysis = content ? JSON.parse(content) : {};

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.discountPrice || p.price,
        originalPrice: p.price,
        rating: p.rating,
        soldCount: p.soldCount,
        images: p.images,
        slug: p.slug,
        specifications: p.specifications,
        shop: { name: p.shop.name, id: p.shopId },
      })),
      aiAnalysis,
    };
  } catch (error) {
    logger.error('Product comparison AI failed', { error });
    return {
      products: products.map((p) => ({
        id: p.id, name: p.name, price: p.discountPrice || p.price,
        originalPrice: p.price, rating: p.rating, soldCount: p.soldCount,
        images: p.images, slug: p.slug, specifications: p.specifications,
      })),
      aiAnalysis: null,
    };
  }
};
