import openai from '../config/openai';
import { prisma } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import logger from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatWithAssistant = async (
  messages: ChatMessage[],
  userId?: string
): Promise<{ reply: string; productSuggestions?: object[] }> => {
  const systemPrompt = `You are NexBot, an intelligent AI shopping assistant for NexMart - a premium AI-powered e-commerce platform. Your role is to:
- Help customers find products that match their needs
- Provide personalized product recommendations
- Answer questions about products, shipping, returns, and policies
- Suggest products based on customer preferences and budget
- Help with order tracking and support queries

NexMart's key policies:
- Free shipping on orders above $30
- 30-day easy returns and exchanges
- 24/7 customer support
- Buyer protection on all orders
- Secure payments with Stripe

When recommending products, be specific about features, benefits, and value for money. Be friendly, helpful, and concise. If a user asks about a specific product category, try to understand their needs first. Format product suggestions clearly.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10), // Keep last 10 turns for context
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const reply = response.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';

    // Extract product suggestions if mentioned
    let productSuggestions: object[] = [];
    if (userId && reply.toLowerCase().includes('recommend') || reply.toLowerCase().includes('suggest')) {
      const keywords = extractKeywords(reply);
      if (keywords.length > 0) {
        productSuggestions = await findRelatedProducts(keywords);
      }
    }

    return { reply, productSuggestions };
  } catch (error) {
    logger.error('OpenAI chat error', { error });
    return { reply: 'I\'m having trouble connecting right now. Please try again in a moment.' };
  }
};

const extractKeywords = (text: string): string[] => {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'as', 'until', 'while', 'I', 'me', 'my', 'we', 'our', 'ours', 'you', 'your', 'he', 'him', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'this', 'that', 'these', 'those']);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .split(' ')
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 5);
};

const findRelatedProducts = async (keywords: string[]): Promise<object[]> => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: keywords.map((k) => ({
          OR: [
            { name: { contains: k, mode: 'insensitive' } },
            { tags: { has: k } },
          ],
        })),
      },
      take: 4,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, soldCount: true,
        shop: { select: { name: true } },
      },
    });
    return products;
  } catch {
    return [];
  }
};
