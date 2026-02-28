import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Star, Shield, Truck, RefreshCw, MessageCircle, Share2, ChevronLeft, ChevronRight, Zap, Package } from 'lucide-react';
import { addToCart } from '../store/slices/cartSlice';
import { productService } from '../services/productService';
import { aiService } from '../services/aiService';
import { StarsDisplay } from '../components/product/ProductCard';
import { RootState } from '../store';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [pricePrediction, setPricePrediction] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productService.getProductBySlug(slug);
        setProduct(data);
        const [reviewsData, similar] = await Promise.all([
          productService.getReviews(data.id),
          productService.getRelatedProducts(data.id),
        ]);
        setReviews(reviewsData.reviews || []);
        setSimilarProducts(similar);
        // Load AI features asynchronously
        aiService.getReviewSummary(data.id).then(setReviewSummary).catch(() => {});
        aiService.getPricePrediction(data.id).then(setPricePrediction).catch(() => {});
      } catch {
        toast.error('Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({ product, quantity }));
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    dispatch(addToCart({ product, quantity }));
    window.location.href = '/checkout';
  };

  const toggleWishlist = async () => {
    if (!user) return toast.error('Please login to add to wishlist');
    setWishlist(!wishlist);
    toast.success(wishlist ? 'Removed from wishlist' : 'Added to wishlist ❤️');
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="shimmer-bg aspect-square rounded-2xl" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`shimmer-bg h-6 rounded ${i === 0 ? 'w-3/4' : i === 1 ? 'w-full' : 'w-1/2'}`} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Product not found</h2>
      <Link to="/" className="btn-primary mt-4 inline-block">Go Home</Link>
    </div>
  );

  const discount = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const flashSale = product.flashSaleProducts?.[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to={`/category/${product.category?.slug}`} className="hover:text-primary">{product.category?.name}</Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-3">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImageIndex}
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discount}%
                </div>
              )}
              {flashSale && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> FLASH
                </div>
              )}
              {product.images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow hover:bg-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedImageIndex(Math.min(product.images.length - 1, selectedImageIndex + 1))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 shadow hover:bg-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img: string, i: number) => (
                <button key={i} onClick={() => setSelectedImageIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImageIndex === i ? 'border-primary' : 'border-gray-200 dark:border-gray-600'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.shop?.isVerified && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verified Store
                  </span>
                )}
                {product.freeShipping && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Free Shipping</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h1>

              <div className="flex items-center gap-3">
                <StarsDisplay rating={product.rating} />
                <span className="text-sm text-gray-500">{product.rating} ({product.reviewCount} reviews)</span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-500">{product.soldCount.toLocaleString()} sold</span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">${(product.discountPrice || product.price).toFixed(2)}</span>
                {product.discountPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">${product.price.toFixed(2)}</span>
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Save {discount}%</span>
                  </>
                )}
              </div>
              {flashSale && <p className="text-xs text-yellow-600 mt-1 font-medium">⚡ Flash Sale Price!</p>}

              {/* AI Price Prediction */}
              {pricePrediction && (
                <div className={`mt-3 p-2 rounded-lg text-xs flex items-center gap-2 ${pricePrediction.trend === 'down' ? 'bg-green-100 text-green-700' : pricePrediction.trend === 'up' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                  <span>{pricePrediction.trend === 'down' ? '📉' : pricePrediction.trend === 'up' ? '📈' : '📊'}</span>
                  <span><strong>AI Insight:</strong> {pricePrediction.bestTimeToBuy}</span>
                </div>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className={`text-sm font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
              <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold">-</button>
                <span className="px-4 py-2 font-medium min-w-[40px] text-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold">+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button onClick={handleBuyNow} disabled={product.stock === 0}
                className="flex-1 btn-primary py-3 rounded-xl disabled:opacity-50">
                Buy Now
              </button>
              <button onClick={toggleWishlist} className={`p-3 rounded-xl border-2 transition-colors ${wishlist ? 'border-red-500 text-red-500 bg-red-50' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-red-300'}`}>
                <Heart className={`w-5 h-5 ${wishlist ? 'fill-current' : ''}`} />
              </button>
              <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!'))}
                className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-400 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
              {[
                { icon: <Truck className="w-4 h-4" />, text: 'Free returns', sub: '30 days' },
                { icon: <Shield className="w-4 h-4" />, text: 'Buyer protection', sub: 'All orders' },
                { icon: <RefreshCw className="w-4 h-4" />, text: 'Easy returns', sub: 'No hassle' },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center text-center p-2">
                  <div className="text-primary mb-1">{badge.icon}</div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{badge.text}</span>
                  <span className="text-xs text-gray-400">{badge.sub}</span>
                </div>
              ))}
            </div>

            {/* Shop Info */}
            <Link to={`/shop/${product.shop?.id}`} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <img src={product.shop?.logo || 'https://ui-avatars.com/api/?name=' + product.shop?.name} alt={product.shop?.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">{product.shop?.name}</p>
                <p className="text-xs text-gray-500">{product.shop?.followerCount || 0} followers</p>
              </div>
              <button className="ml-auto text-xs border border-primary text-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">
                Visit Shop
              </button>
            </Link>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 dark:border-gray-700">
            {(['description', 'reviews', 'shipping'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800'}`}>
                {tab} {tab === 'reviews' && `(${product.reviewCount})`}
                {activeTab === tab && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{product.description}</p>
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">Specifications</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(product.specifications as Record<string, string>).map(([k, v]) => (
                        <div key={k} className="flex border-b border-gray-100 dark:border-gray-700 py-2">
                          <span className="text-sm text-gray-500 w-1/2">{k}</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* AI Summary */}
                {reviewSummary && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-4 mb-6 border border-orange-100 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🤖</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">AI Review Summary</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reviewSummary.overallSentiment === 'positive' ? 'bg-green-100 text-green-700' : reviewSummary.overallSentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {reviewSummary.overallSentiment}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{reviewSummary.summary}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {reviewSummary.pros?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1">✅ Pros</p>
                          {reviewSummary.pros.map((p: string, i: number) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400">• {p}</p>)}
                        </div>
                      )}
                      {reviewSummary.cons?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-600 mb-1">⚠️ Cons</p>
                          {reviewSummary.cons.map((c: string, i: number) => <p key={i} className="text-xs text-gray-600 dark:text-gray-400">• {c}</p>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <img src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name}`} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{review.user?.name}</p>
                            <StarsDisplay rating={review.rating} />
                          </div>
                          <span className="ml-auto text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4">
                {[
                  { icon: '🚚', title: 'Standard Shipping', desc: '5-7 business days — Free on orders over $30', detail: '$5.99 for orders under $30' },
                  { icon: '⚡', title: 'Express Shipping', desc: '2-3 business days', detail: '$12.99' },
                  { icon: '🔄', title: 'Easy Returns', desc: '30-day hassle-free returns', detail: 'No questions asked' },
                  { icon: '🛡️', title: 'Buyer Protection', desc: 'Full refund if item not as described', detail: 'Covered on all orders' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarProducts.map((p: any) => (
                <Link key={p.id} to={`/product/${p.slug}`} className="product-card p-3 text-center hover:shadow-md transition-all">
                  <img src={p.images?.[0]} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                  <p className="text-sm font-bold text-primary">${(p.discountPrice || p.price).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
