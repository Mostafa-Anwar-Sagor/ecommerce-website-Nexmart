import openai from '../config/openai';
import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResult {
  reply: string;
  productSuggestions?: object[];
}

// ─── Simple in-memory rate limiter (per-server, resets on restart) ────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;        // max requests per window
const RATE_WINDOW = 60_000;   // 1 minute window

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ─── Main entry point ─────────────────────────────
export const chatWithAssistant = async (
  messages: ChatMessage[],
  userId?: string
): Promise<ChatResult> => {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUserMsg) return { reply: 'Hi there! 👋 How can I help you today?' };

  const input = lastUserMsg.content.trim();
  const lower = input.toLowerCase();

  // Always search for products if the query looks product-related
  const productResults = await smartProductSearch(input);

  // ── Try GPT first (with rate limiting) ──
  const rateLimitKey = userId || 'anonymous';
  if (!isRateLimited(rateLimitKey)) {
    try {
      const gptReply = await withTimeout(callGPT(messages, productResults), 8000);
      if (gptReply) {
        return { reply: gptReply, productSuggestions: productResults };
      }
    } catch (error) {
      logger.warn('GPT call failed, falling back to NLP', { error: (error as Error).message });
    }
  }

  // ── NLP Fallback: handle locally with conversation context ──
  return await handleWithNLP(input, lower, productResults, userId, messages);
};

// ─── Timeout wrapper ──────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('GPT timeout')), ms)),
  ]);
}

// ─── GPT Integration (cost-efficient) ─────────────
async function callGPT(messages: ChatMessage[], products: object[]): Promise<string | null> {
  // Build product context if we have results
  let productContext = '';
  if (products.length > 0) {
    productContext = '\n\nAvailable products from our database that match the query:\n' +
      (products as any[]).map((p, i) =>
        `${i + 1}. "${p.name}" - $${p.discountPrice || p.price}${p.discountPrice ? ` (was $${p.price})` : ''} | Rating: ${p.rating}/5 | ${p.soldCount} sold | Shop: ${p.shop?.name || 'NexMart'}`
      ).join('\n');
  }

  const systemPrompt = `You are NexBot, the AI shopping assistant for NexMart (an e-commerce platform). Be conversational, friendly, and helpful — like ChatGPT but focused on shopping.

Rules:
- Keep replies concise (2-4 paragraphs max) but warm and personable
- Use markdown bold (**text**) and emojis naturally
- If products are provided below, reference them naturally in your response with names and prices
- For non-shopping questions (weather, jokes, general knowledge), answer briefly then gently steer back to shopping
- Handle greetings, thanks, goodbyes naturally
- For order queries, tell users to check "My Orders" page
- NexMart policies: Free shipping over $30, 30-day returns, Stripe + COD payment, 24/7 support${productContext}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 400,
  });

  return response.choices[0]?.message?.content || null;
}

// ─── NLP Fallback (no API needed) ─────────────────
async function handleWithNLP(input: string, lower: string, products: object[], userId?: string, history: ChatMessage[] = []): Promise<ChatResult> {
  // Priority 1: Policy questions (check BEFORE greetings to avoid false matches)
  if (matchAny(lower, ['return', 'refund', 'exchange', 'money back', 'cancel order'])) {
    return { reply: '🔄 **Returns & Refunds:**\n\n• **30-day** easy return policy\n• Free returns on defective items\n• Full refund within **5-7 business days**\n• Go to **My Orders** → select order → **Request Return**\n\nAnything else?' };
  }

  if (matchAny(lower, ['shipping', 'delivery', 'ship', 'deliver', 'free shipping', 'how long'])) {
    return { reply: '🚚 **Shipping Policies:**\n\n• **Free shipping** on orders above **$30**\n• Standard delivery: **3-7 business days**\n• Express delivery: **1-3 business days** (extra fee)\n• Real-time tracking on all orders\n\nNeed anything else?' };
  }

  if (matchAny(lower, ['payment', 'pay', 'stripe', 'credit card', 'cash on delivery', 'cod', 'payment method'])) {
    return { reply: '💳 **Payment Options:**\n\n• **Credit/Debit Cards** via Stripe (Visa, Mastercard, Amex)\n• **Cash on Delivery (COD)**\n• 100% secure with buyer protection\n\nWhat else can I help with?' };
  }

  // Orders
  if (matchAny(lower, ['order', 'track', 'tracking', 'where is my', 'my order', 'delivery status'])) {
    return { reply: userId
      ? '📦 You can check your order status on the **My Orders** page. Go to your profile → **My Orders** to see real-time tracking!\n\nIs there anything else I can help with?'
      : '📦 Please **log in** first to check your order status. Once logged in, visit **My Orders** from your profile!\n\nNeed help with anything else?'
    };
  }

  // Priority 2: Greetings (use stricter matching — only match when it IS a greeting)
  const trimmed = lower.replace(/[^a-z\s']/g, '').trim();
  const isGreeting = /^(hi|hey|hello|howdy|yo|sup|hola|greetings|good\s+(morning|afternoon|evening|day)|what'?s\s+up)(\s|$|!|\?)/.test(trimmed);
  if (isGreeting && trimmed.split(/\s+/).length <= 6) {
    return { reply: getGreeting() };
  }

  // Identity / about (strict patterns)
  if (/\b(who|what)\s+(are|is)\s+you\b/.test(lower) || matchAny(lower, ['your name', "what's your name", 'who made you', 'who created you'])) {
    return { reply: "I'm **NexBot** — your AI shopping assistant here at NexMart! 🤖 I'm doing great, ready to help you find products, answer questions, or track orders. What can I do for you?" };
  }

  // How are you (strict)
  if (/\bhow\s+(are|r)\s+(you|u)\b/.test(lower)) {
    return { reply: "I'm doing great, thanks for asking! 😊 I'm **NexBot**, your AI shopping assistant. What can I help you find today?" };
  }

  // Thanks
  if (matchAny(lower, ['thank', 'thanks', 'thx', 'appreciate', 'thank you'])) {
    return { reply: "You're welcome! 😊 Happy to help. Let me know if you need anything else!" };
  }

  // Goodbye
  if (matchAny(lower, ['bye', 'goodbye', 'see you', 'good night', 'cya', 'later'])) {
    return { reply: 'Goodbye! 👋 Happy shopping, and come back anytime you need help!' };
  }

  // Help
  if (matchAny(lower, ['help', 'what can you do', 'capabilities', 'features'])) {
    return { reply: getHelpMessage() };
  }

  // Gift queries — search popular giftable products
  if (matchAny(lower, ['gift', 'present', 'birthday', 'surprise', 'anniversary', 'christmas', 'valentine'])) {
    const giftProducts = await getPopularProducts(6);
    if (giftProducts.length > 0) {
      return {
        reply: `🎁 Great choice! Here are some **popular gift ideas** from our store:\n\n${formatProductList(giftProducts as any[])}\n\nWant me to narrow it down by category or budget? For example: "gifts under $100" or "tech gifts"`,
        productSuggestions: giftProducts,
      };
    }
  }

  // If we found products, show them with conversational context
  if (products.length > 0) {
    const openers = [
      `Great question! Here's what I found for "**${input}**":`,
      `I found some awesome options for you! 🎉`,
      `Here are the best matches I found:`,
      `Let me show you what we have! 🔍`,
    ];
    const closers = [
      `\nWant me to help you pick one, or search for something else?`,
      `\nClick any product to see full details! Need me to narrow it down?`,
      `\nLet me know if you'd like more options or have any questions! 😊`,
      `\nI can also compare these for you — just ask!`,
    ];
    return {
      reply: `${randomPick(openers)}\n\n${formatProductList(products as any[])}${randomPick(closers)}`,
      productSuggestions: products,
    };
  }

  // Conversational fallback — try to be helpful
  if (lower.length > 5) {
    return {
      reply: `Hmm, I couldn't find products matching "**${input}**" in our store right now. 🤔\n\nHere are some things you can try:\n• Be more specific: "wireless earbuds" instead of just "earbuds"\n• Add a budget: "headphones under $100"\n• Browse categories: Electronics, Fashion, Home & Living, Sports\n\nOr just tell me what you need and I'll do my best to help! 😊`,
    };
  }

  // Short/unclear input
  return {
    reply: `I'd love to help! 😊 Here's what I can do:\n\n🔍 **Find products** — "Show me wireless earbuds"\n💰 **Budget search** — "Laptops under $500"\n📦 **Track orders** — "Where is my order?"\n🎁 **Gift ideas** — "Gift ideas for her"\nℹ️ **Policies** — "Shipping", "Returns", "Payments"\n\nJust type naturally — I understand conversational language!`,
  };
}

// ─── Product Search Helpers ───────────────────────
async function getPopularProducts(limit: number): Promise<object[]> {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ soldCount: 'desc' }, { rating: 'desc' }],
      take: limit,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, soldCount: true,
        shop: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
  } catch { return []; }
}

async function smartProductSearch(input: string): Promise<object[]> {
  const rawTerms = extractSearchTerms(input);
  if (rawTerms.length === 0) return [];

  // Expand terms with singular/plural forms for fuzzy matching
  const terms = expandTerms(rawTerms);

  // Also check for price constraints
  const maxPrice = extractMaxPrice(input);
  const minPrice = extractMinPrice(input);

  try {
    const where: any = {
      isActive: true,
      OR: [
        ...terms.map((t) => ({ name: { contains: t, mode: 'insensitive' as const } })),
        ...terms.map((t) => ({ description: { contains: t, mode: 'insensitive' as const } })),
        ...rawTerms.map((t) => ({ tags: { has: t } })),
        ...terms.map((t) => ({ category: { name: { contains: t, mode: 'insensitive' as const } } })),
      ],
    };

    if (maxPrice || minPrice) {
      where.price = {};
      if (maxPrice) where.price.lte = maxPrice;
      if (minPrice) where.price.gte = minPrice;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ soldCount: 'desc' }, { rating: 'desc' }],
      take: 5,
      select: {
        id: true, name: true, slug: true, price: true, discountPrice: true,
        images: true, rating: true, soldCount: true,
        shop: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    return products;
  } catch (error) {
    logger.error('Product search error in chatbot', { error });
    return [];
  }
}

// ─── Utilities ────────────────────────────────────
function matchAny(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function extractSearchTerms(input: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up',
    'about', 'into', 'through', 'and', 'but', 'or', 'so', 'yet', 'not', 'than', 'too',
    'very', 'just', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
    'they', 'them', 'their', 'what', 'which', 'who', 'this', 'that', 'these', 'those',
    'show', 'find', 'search', 'looking', 'want', 'need', 'get', 'give', 'any', 'some',
    'please', 'under', 'over', 'below', 'above', 'between', 'price', 'budget', 'best',
    'top', 'good', 'great', 'nice', 'recommend', 'suggest', 'compare', 'vs', 'versus',
    'hello', 'hey', 'hi', 'how', 'help', 'thanks', 'thank', 'bye',
  ]);
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function extractMaxPrice(input: string): number | undefined {
  const m = input.toLowerCase().match(/under\s*\$?(\d+)|below\s*\$?(\d+)|less than\s*\$?(\d+)|budget\s*(?:of|is)?\s*\$?(\d+)|max\s*\$?(\d+)/);
  return m ? Number(m[1] || m[2] || m[3] || m[4] || m[5]) : undefined;
}

function extractMinPrice(input: string): number | undefined {
  const m = input.toLowerCase().match(/over\s*\$?(\d+)|above\s*\$?(\d+)|more than\s*\$?(\d+)|starting\s*(?:from|at)\s*\$?(\d+)/);
  return m ? Number(m[1] || m[2] || m[3] || m[4]) : undefined;
}

function formatProductList(products: any[]): string {
  return products.map((p, i) =>
    `**${i + 1}. ${p.name}** — ${p.discountPrice ? `~~$${p.price}~~ **$${p.discountPrice}**` : `**$${p.price}**`} ⭐ ${p.rating}/5`
  ).join('\n');
}

function getGreeting(): string {
  const greetings = [
    "Hey there! 👋 Welcome to NexMart! I'm **NexBot**, your personal shopping assistant. How can I help you today?\n\nYou can ask me to:\n🔍 Find products\n💰 Search by budget\n📦 Track orders\n🎁 Get gift ideas\n📊 Compare products",
    "Hi! 😊 I'm **NexBot**, always ready to help! Looking for something specific, or want me to show you what's trending?",
    "Hello! 🛍️ Welcome to NexMart! I'm here to make your shopping experience amazing. What are you looking for today?",
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function randomPick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Expand terms: add singular/plural forms + common synonyms
function expandTerms(terms: string[]): string[] {
  const synonyms: Record<string, string[]> = {
    'phone': ['smartphone', 'mobile'],
    'smartphone': ['phone', 'mobile'],
    'laptop': ['notebook', 'computer'],
    'computer': ['laptop', 'notebook', 'pc'],
    'headphone': ['headset', 'earphone', 'earbuds'],
    'earbuds': ['earphone', 'headphone'],
    'watch': ['smartwatch', 'timepiece'],
    'smartwatch': ['watch', 'smart watch'],
    'shoe': ['sneaker', 'footwear'],
    'sneaker': ['shoe', 'footwear'],
    'bag': ['handbag', 'backpack', 'purse'],
    'camera': ['cam', 'photography'],
    'speaker': ['bluetooth speaker', 'audio'],
    'keyboard': ['gaming keyboard', 'mechanical keyboard'],
    'mouse': ['gaming mouse'],
    'book': ['guide', 'novel'],
    'skincare': ['serum', 'cream', 'moisturizer'],
    'gift': ['present', 'surprise'],
    'fitness': ['workout', 'exercise', 'gym'],
    'gaming': ['game', 'gamer'],
  };

  const expanded = new Set<string>();
  for (const term of terms) {
    expanded.add(term);
    // Add singular (remove trailing 's'/'es')
    if (term.endsWith('ies')) expanded.add(term.slice(0, -3) + 'y');
    else if (term.endsWith('ses') || term.endsWith('xes') || term.endsWith('zes') || term.endsWith('ches') || term.endsWith('shes')) expanded.add(term.slice(0, -2));
    else if (term.endsWith('s') && !term.endsWith('ss')) expanded.add(term.slice(0, -1));
    // Add plural
    if (!term.endsWith('s')) expanded.add(term + 's');
    // Add synonyms
    const syns = synonyms[term] || synonyms[term.endsWith('s') ? term.slice(0, -1) : term + 's'];
    if (syns) syns.forEach((s) => expanded.add(s));
  }
  return [...expanded];
}

function getHelpMessage(): string {
  return "I'm **NexBot**, your AI shopping assistant! Here's everything I can do:\n\n🔍 **Find Products** — \"Show me wireless earbuds under $50\"\n💡 **Recommendations** — \"What's the best laptop for coding?\"\n📊 **Compare Products** — \"Compare Bluetooth speakers\"\n💰 **Budget Search** — \"Gaming mouse under $30\"\n📦 **Track Orders** — \"Where is my order?\"\n🎁 **Gift Ideas** — \"Gift ideas for a 10-year-old\"\n🚚 **Shipping Info** — \"How long does delivery take?\"\n🔄 **Returns** — \"What's the return policy?\"\n💳 **Payments** — \"What payment methods do you accept?\"\n\nJust type naturally — I understand conversational language! 😊";
}
