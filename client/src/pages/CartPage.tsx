import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, Tag, ArrowRight } from 'lucide-react';
import { removeFromCart, updateQuantity, clearCart } from '../store/slices/cartSlice';
import { RootState } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const dispatch = useDispatch();
  const { items } = useSelector((s: RootState) => s.cart);
  const [voucher, setVoucher] = useState('');

  const groupedByShop = items.reduce((acc: Record<string, any[]>, item) => {
    const shopKey = item.product.shop?.id || 'default';
    if (!acc[shopKey]) acc[shopKey] = [];
    acc[shopKey].push(item);
    return acc;
  }, {});

  const subtotal = items.reduce((s, item) => s + (item.product.discountPrice || item.product.price) * item.quantity, 0);
  const shipping = subtotal >= 30 ? 0 : items.length > 0 ? 5.99 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <ShoppingBag className="w-7 h-7 text-primary" />
          My Cart <span className="text-base font-normal text-gray-500">({items.length} item{items.length !== 1 ? 's' : ''})</span>
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your cart is empty</h3>
            <p className="text-gray-500 mt-2">Start shopping to add items to your cart</p>
            <Link to="/" className="btn-primary mt-6 inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {Object.entries(groupedByShop).map(([shopId, shopItems]) => (
                <div key={shopId} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <img src={shopItems[0].product.shop?.logo || `https://ui-avatars.com/api/?name=${shopItems[0].product.shop?.name}`}
                      alt="" className="w-6 h-6 rounded-full" />
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{shopItems[0].product.shop?.name || 'NexMart Store'}</span>
                  </div>

                  {shopItems.map((item) => (
                    <motion.div key={item.product.id} layout
                      className="flex gap-4 p-5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <Link to={`/product/${item.product.slug}`}>
                        <img src={item.product.images?.[0]} alt={item.product.name} className="w-20 h-20 object-cover rounded-xl" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.product.slug}`} className="font-medium text-gray-900 dark:text-white hover:text-primary line-clamp-2 text-sm">
                          {item.product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-primary font-bold">${(item.product.discountPrice || item.product.price).toFixed(2)}</span>
                          {item.product.discountPrice && (
                            <span className="text-xs text-gray-400 line-through">${item.product.price.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                            <button onClick={() => dispatch(updateQuantity({ id: item.id, quantity: Math.max(1, item.quantity - 1) }))}
                              className="px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 py-1.5 text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                              className="px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${((item.product.discountPrice || item.product.price) * item.quantity).toFixed(2)}
                            </span>
                            <button onClick={() => { dispatch(removeFromCart(item.id)); toast.success('Removed from cart'); }}
                              className="text-red-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}

              <button onClick={() => { dispatch(clearCart()); toast.success('Cart cleared'); }}
                className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 sticky top-20">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                {/* Voucher */}
                <div className="flex gap-2 mb-5">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Voucher code" value={voucher} onChange={(e) => setVoucher(e.target.value)}
                      className="input-field pl-9 text-sm" />
                  </div>
                  <button
                    onClick={async () => {
                      if (!voucher.trim()) return toast.error('Enter a voucher code');
                      try {
                        const res = await api.post('/vouchers/validate', { code: voucher, subtotal });
                        toast.success(`Voucher applied! You save $${res.data.data.discount.toFixed(2)}`);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Invalid voucher code');
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors">
                    Apply
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal ({items.length} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping > 0 && <p className="text-xs text-gray-400">Add ${(30 - subtotal).toFixed(2)} more for free shipping</p>}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Link to="/checkout" className="btn-primary w-full flex items-center justify-center gap-2 mt-6 py-3">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-xs text-center text-gray-400 mt-3">🔒 Secure checkout with Stripe</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
