import api from './api';
import { Product, PaginatedResponse, SearchFilters, Review, ReviewSummary } from '../types';

export const productService = {
  async getProducts(filters: SearchFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    });
    const { data } = await api.get(`/products?${params.toString()}`);
    const result = data.data;
    // Normalize both { data: [], total: n } and { products: [], pagination: {} } shapes
    return {
      data: result.data || result.products || [],
      total: result.total ?? result.pagination?.total ?? 0,
      page: result.page ?? result.pagination?.page ?? 1,
      limit: result.limit ?? result.pagination?.limit ?? 20,
      totalPages: result.totalPages ?? result.pagination?.totalPages ?? 1,
    };
  },

  async getProductById(id: string): Promise<Product> {
    const { data } = await api.get(`/products/${id}`);
    return data.data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const { data } = await api.get(`/products/${slug}`);
    return data.data;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const { data } = await api.get('/products/featured');
    return data.data;
  },

  async getFlashSaleProducts(): Promise<Product[]> {
    const { data } = await api.get('/products/flash-sale');
    return data.data;
  },

  async getRelatedProducts(productId: string): Promise<Product[]> {
    const { data } = await api.get(`/products/${productId}/related`);
    return data.data;
  },

  async searchProducts(query: string, filters?: SearchFilters): Promise<PaginatedResponse<Product>> {
    const { data } = await api.post('/search', { query, ...filters });
    return data.data;
  },

  async getReviews(productId: string, page = 1): Promise<{ reviews: Review[]; summary: ReviewSummary }> {
    const { data } = await api.get(`/reviews/product/${productId}?page=${page}`);
    return data.data;
  },

  async submitReview(productId: string, review: { rating: number; comment: string; images?: string[] }): Promise<Review> {
    const { data } = await api.post('/reviews', { productId, ...review });
    return data.data;
  },

  async addToWishlist(productId: string): Promise<void> {
    await api.post(`/wishlist/${productId}`);
  },

  async removeFromWishlist(productId: string): Promise<void> {
    await api.delete(`/wishlist/${productId}`);
  },

  async getWishlist(): Promise<Product[]> {
    const { data } = await api.get('/wishlist');
    return data.data;
  },

  // Seller endpoints
  async createProduct(productData: FormData): Promise<Product> {
    const { data } = await api.post('/products', productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async updateProduct(id: string, productData: FormData): Promise<Product> {
    const { data } = await api.put(`/products/${id}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async getSellerProducts(page = 1, limit = 20): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get(`/seller/products?page=${page}&limit=${limit}`);
    return data.data;
  },
};
