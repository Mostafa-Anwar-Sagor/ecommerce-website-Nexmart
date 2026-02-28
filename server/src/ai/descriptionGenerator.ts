import openai from '../config/openai';
import logger from '../utils/logger';

export interface GeneratedDescription {
  shortDescription: string;
  fullDescription: string;
  keyFeatures: string[];
  seoTitle: string;
  seoDescription: string;
  suggestedTags: string[];
}

export const generateProductDescription = async (
  productInfo: {
    name: string;
    category: string;
    specifications?: Record<string, string>;
    price?: number;
    targetAudience?: string;
  }
): Promise<GeneratedDescription> => {
  const prompt = `Generate comprehensive e-commerce product content for:
Product Name: ${productInfo.name}
Category: ${productInfo.category}
${productInfo.specifications ? `Specifications: ${JSON.stringify(productInfo.specifications)}` : ''}
${productInfo.price ? `Price: $${productInfo.price}` : ''}
${productInfo.targetAudience ? `Target Audience: ${productInfo.targetAudience}` : ''}

Respond with a JSON object containing:
{
  "shortDescription": "2-3 sentence compelling product summary",
  "fullDescription": "Detailed 150-200 word product description with benefits and use cases",
  "keyFeatures": ["feature1", "feature2", "feature3", "feature4", "feature5"],
  "seoTitle": "SEO optimized title under 60 chars",
  "seoDescription": "SEO meta description under 160 chars",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated');

    return JSON.parse(content) as GeneratedDescription;
  } catch (error) {
    logger.error('Description generation failed', { error });
    throw new Error('Failed to generate product description');
  }
};
