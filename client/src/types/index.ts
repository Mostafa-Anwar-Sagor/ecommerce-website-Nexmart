export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  shop?: Shop;
  aiPreferences?: AIPreferences;
}

export interface AIPreferences {
  favoriteCategories: string[];
  priceRange: { min: number; max: number };
  browsingHistory: string[];
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  rating: number;
  totalSales: number;
  totalProducts: number;
  isVerified: boolean;
  status: 'PENDING' | 'ACTIVE' | 'BANNED';
  sellerId: string;
  responseRate?: number;
  joinDate: string;
  followerCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  productCount: number;
}

export interface ProductVariant {
  id: string;
  name: string;       // e.g. "Color", "Size"
  values: VariantValue[];
}

export interface VariantValue {
  id: string;
  value: string;      // e.g. "Red", "XL"
  image?: string;
  priceDiff: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  aiDescription?: string;     // AI-generated enhanced description
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  discountPrice?: number;  // alias for comparePrice for backward compat
  stock: number;
  sold?: number;
  soldCount?: number;  // API returns soldCount
  images: string[];
  video?: string;
  rating: number;
  reviewCount: number;
  shopId: string;
  shop: Shop;
  categoryId: string;
  category: Category;
  brand?: string;
  weight?: number;
  dimensions?: { l: number; w: number; h: number };
  variants?: ProductVariant[];
  tags: string[];
  aiTags?: string[];           // AI-generated tags
  specifications?: Record<string, string>;
  isFeatured: boolean;
  isActive: boolean;
  freeShipping?: boolean;   // direct field from API
  isFlashSale?: boolean;
  flashSalePrice?: number;
  flashSaleEnds?: string;
  shippingInfo?: ShippingInfo;
  attributes?: Record<string, string>;
  createdAt: string;
}

export interface ShippingInfo {
  freeShipping: boolean;
  estimatedDays: number;
  shippingFee: number;
  locations: string[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  rating: number;
  comment: string;
  images?: string[];
  variant?: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';  // AI sentiment
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  aiSummary: string;           // AI-generated summary
  topPros: string[];
  topCons: string[];
  sentimentScore: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariant?: Record<string, string>;
  price: number;
  shopId: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  shopGroups: ShopCartGroup[];
}

export interface ShopCartGroup {
  shop: Shop;
  items: CartItem[];
  subtotal: number;
  appliedVoucher?: Voucher;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  label?: string;
}

export interface Voucher {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usedCount: number;
  maxUses: number;
  expiryDate: string;
  shopId?: string;
  categories?: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  buyerId: string;
  buyer?: User;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentIntentId?: string;
  address: Address;
  voucherId?: string;
  tracking?: Tracking;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  variant?: Record<string, string>;
  reviewId?: string;
}

export interface Tracking {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery: string;
  history: TrackingEvent[];
}

export interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface FlashSale {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  products: FlashSaleProduct[];
}

export interface FlashSaleProduct {
  productId: string;
  product: Product;
  flashPrice: number;
  stock: number;
  sold: number;
  discountPercent: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'ORDER' | 'PROMO' | 'CHAT' | 'REVIEW' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'PRODUCT';
  productRef?: Pick<Product, 'id' | 'name' | 'images' | 'price'>;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// AI Types
export interface AIRecommendation {
  products: Product[];
  reason: string;
  confidence: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  createdAt: string;
}

export interface AIImageSearchResult {
  products: Product[];
  similarity: number[];
  detectedObjects: string[];
}

export interface PricePrediction {
  productId: string;
  currentPrice: number;
  predictedPrice: number;
  direction: 'UP' | 'DOWN' | 'STABLE';
  confidence: number;
  recommendation: string;
  history: PriceHistory[];
}

export interface PriceHistory {
  date: string;
  price: number;
}

export interface SellerAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChart: ChartData[];
  orderChart: ChartData[];
  topProducts: Product[];
  conversionRate: number;
  averageOrderValue: number;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  shopId?: string;
  brand?: string;
  freeShipping?: boolean;
  sortBy?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'sold';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
