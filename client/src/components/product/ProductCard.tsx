import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingCartIcon, StarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { Product } from '../../types';
import { addToCart } from '../../store/slices/cartSlice';
import { RootState } from '../../store';
import { AppDispatch } from '../../store';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  view?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, view = 'grid' }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // discountPrice = sale price (lower), price = original. comparePrice = original, price = current sale
  const originalPrice = product.discountPrice ? product.price : (product.comparePrice ?? null);
  const currentPrice = product.discountPrice ?? product.price;
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const soldCount = product.soldCount ?? product.sold ?? 0;
  const isFreeShipping = product.freeShipping ?? product.shippingInfo?.freeShipping ?? false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      dispatch(addToCart({ product, quantity: 1 }));
      toast.success('Added to cart! 🛒', { duration: 2000 });
    } finally {
      setTimeout(() => setIsAddingToCart(false), 600);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please login to save to wishlist');
      return;
    }
    const prev = isWishlisted;
    setIsWishlisted(!prev);
    try {
      if (prev) {
        await productService.removeFromWishlist(product.id);
        toast.success('Removed from wishlist');
      } else {
        await productService.addToWishlist(product.id);
        toast.success('Saved to wishlist ❤️');
      }
    } catch {
      setIsWishlisted(prev);
      toast.error('Failed to update wishlist');
    }
  };

  if (view === 'list') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="card p-4 flex gap-4 cursor-pointer"
      >
        <Link to={`/product/${product.slug}`} className="shrink-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-40 h-40 object-cover rounded-lg"
          />
        </Link>
        <div className="flex-1">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white hover:text-primary-500 line-clamp-2 mb-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{product.shortDescription}</p>
          <div className="flex items-center gap-2 mb-3">
            <StarsDisplay rating={product.rating} />
            <span className="text-xs text-gray-400">({product.reviewCount.toLocaleString()})</span>
            <span className="text-xs text-gray-400">• {soldCount.toLocaleString()} sold</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-primary-500">${currentPrice.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
            )}
            {discountPercent > 0 && (
              <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 text-xs font-bold px-2 py-0.5 rounded">
                -{discountPercent}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {isFreeShipping && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full font-medium">
                🚚 Free Shipping
              </span>
            )}
            {product.stock <= 10 && product.stock > 0 && (
              <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-full font-medium">
                Only {product.stock} left!
              </span>
            )}
          </div>
        </div>
        <button onClick={handleAddToCart} className="self-end btn-primary px-4 py-2 text-sm">
          Add to Cart
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="product-card relative"
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {discountPercent > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            -{discountPercent}%
          </span>
        )}
        {product.isFlashSale && (
          <span className="flash-badge flex items-center gap-0.5">
            ⚡ FLASH
          </span>
        )}
        {product.isFeatured && (
          <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded">
            HOT
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform"
      >
        {isWishlisted
          ? <HeartSolid className="w-4 h-4 text-red-500" />
          : <HeartIcon className="w-4 h-4 text-gray-400" />
        }
      </button>

      {/* Image */}
      <Link to={`/product/${product.slug}`}>
        <div className="relative overflow-hidden aspect-square bg-gray-50 dark:bg-gray-800">
          <img
            src={product.images[currentImage] || '/placeholder.png'}
            alt={product.name}
            className="product-image w-full h-full object-cover transition-transform duration-300"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
          {/* Image dots */}
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {product.images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setCurrentImage(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImage ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Link
              to={`/product/${product.slug}`}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg hover:bg-primary-500 hover:text-white transition-colors"
            >
              <EyeIcon className="w-3.5 h-3.5" /> Quick View
            </Link>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-3">
        {/* Shop name */}
        {product.shop && (
          <Link to={`/shop/${product.shop.id}`} className="text-xs text-gray-400 hover:text-primary-500 transition-colors truncate block mb-1">
            {product.shop.isVerified && <span className="mr-0.5">✅</span>}
            {product.shop.name}
          </Link>
        )}

        {/* Product name */}
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 hover:text-primary-500 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <StarsDisplay rating={product.rating} size="sm" />
          <span className="text-xs text-gray-400">({product.reviewCount > 999 ? `${(product.reviewCount / 1000).toFixed(1)}k` : product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-primary-500 text-base">
            {product.isFlashSale && product.flashSalePrice
              ? `$${product.flashSalePrice.toFixed(2)}`
              : `$${currentPrice.toFixed(2)}`
            }
          </span>
          {originalPrice && (
            <span className="text-xs text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {isFreeShipping && (
            <span className="text-[10px] text-green-600 border border-green-200 dark:border-green-700 px-1.5 py-0.5 rounded font-medium">
              Free Ship
            </span>
          )}
          {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
            <span className="text-[10px] text-orange-500 border border-orange-200 dark:border-orange-700 px-1.5 py-0.5 rounded font-medium">
              Only {product.stock} left!
            </span>
          )}
          {soldCount > 100 && (
            <span className="text-[10px] text-gray-400">{soldCount > 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount} sold</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAddingToCart}
          className={`w-full mt-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5
            ${product.stock === 0
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              : isAddingToCart
              ? 'bg-green-500 text-white'
              : 'bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white border border-primary-200 dark:border-primary-800'
            }`}
        >
          {product.stock === 0 ? (
            'Out of Stock'
          ) : isAddingToCart ? (
            '✓ Added!'
          ) : (
            <>
              <ShoppingCartIcon className="w-4 h-4" />
              Add to Cart
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export const StarsDisplay: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'md' }) => {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`${starSize} ${star <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

export default ProductCard;
