import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, TrashIcon, ShoppingBagIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { RootState } from '../../store';
import { removeFromCart, updateQuantity, closeCart } from '../../store/slices/cartSlice';
import { AppDispatch } from '../../store';

const CartDrawer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, isOpen, totalItems, totalAmount } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => dispatch(closeCart())}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBagIcon className="w-5 h-5 text-primary-500" />
                My Cart
                {totalItems > 0 && (
                  <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">{totalItems}</span>
                )}
              </h2>
              <button
                onClick={() => dispatch(closeCart())}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingBagIcon className="w-20 h-20 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-1">Add some amazing products!</p>
                  <Link to="/search" onClick={() => dispatch(closeCart())} className="mt-4 btn-primary text-sm px-6">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grouped).map(([shopId, shopItems]) => (
                    <div key={shopId} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                          🏪 {shopItems[0]?.product?.shop?.name || 'Shop'}
                        </p>
                      </div>
                      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {shopItems.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="flex gap-3 p-4"
                          >
                            <Link
                              to={`/product/${item.product?.slug || item.productId}`}
                              onClick={() => dispatch(closeCart())}
                              className="shrink-0"
                            >
                              <img
                                src={item.product?.images?.[0] || '/placeholder.png'}
                                alt={item.product?.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={`/product/${item.product?.slug}`} onClick={() => dispatch(closeCart())}>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 hover:text-primary-500">
                                  {item.product?.name}
                                </p>
                              </Link>
                              {item.selectedVariant && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {Object.entries(item.selectedVariant).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-primary-500 text-sm">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                    <button
                                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                                      disabled={item.quantity <= 1}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                    >
                                      <MinusIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="px-3 py-1 text-sm font-medium text-center min-w-[2rem]">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                                      disabled={item.quantity >= (item.product?.stock || 99)}
                                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
                                    >
                                      <PlusIcon className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => dispatch(removeFromCart(item.id))}
                                    className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal ({totalItems} items)</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Free shipping on orders over $50 🎉
                </p>
                {isAuthenticated ? (
                  <Link
                    to="/checkout"
                    onClick={() => dispatch(closeCart())}
                    className="w-full btn-primary text-center block py-3 rounded-xl font-semibold"
                  >
                    Checkout Now → ${totalAmount.toFixed(2)}
                  </Link>
                ) : (
                  <Link
                    to="/auth/login"
                    onClick={() => dispatch(closeCart())}
                    className="w-full btn-primary text-center block py-3 rounded-xl font-semibold"
                  >
                    Login to Checkout
                  </Link>
                )}
                <button
                  onClick={() => dispatch(closeCart())}
                  className="w-full text-center text-sm text-gray-500 hover:text-primary-500 transition-colors py-1"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
