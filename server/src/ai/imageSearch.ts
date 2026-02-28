import openai from '../config/openai';
import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface ImageSearchResult {
  products: object[];
  detectedLabels: string[];
  searchQuery: string;
}

export const searchByImage = async (imageBase64: string): Promise<ImageSearchResult> => {
  try {
    // Use GPT-4 Vision to analyze the image and extract product features
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                detail: 'low',
              },
            },
            {
              type: 'text',
              text: 'Analyze this product image. Identify: 1) What product is this? 2) Key visual characteristics (color, style, material, brand if visible). 3) Product category. Respond with JSON: {"productType": "...", "labels": ["label1","label2",...], "searchQuery": "concise search query", "category": "..."}',
            },
          ],
        },
      ],
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = visionResponse.choices[0]?.message?.content;
    if (!content) throw new Error('No vision response');

    const { productType, labels, searchQuery, category } = JSON.parse(content) as {
      productType: string;
      labels: string[];
      searchQuery: string;
      category: string;
    };

    // Search database with extracted info
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: productType, mode: 'insensitive' } },
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { tags: { hasSome: labels.slice(0, 5) } },
          { category: { name: { contains: category, mode: 'insensitive' } } },
        ],
      },
      orderBy: [{ rating: 'desc' }, { soldCount: 'desc' }],
      take: 12,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, soldCount: true,
        shop: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return { products, detectedLabels: labels, searchQuery };
  } catch (error) {
    logger.error('Image search failed', { error });
    return { products: [], detectedLabels: [], searchQuery: '' };
  }
};
