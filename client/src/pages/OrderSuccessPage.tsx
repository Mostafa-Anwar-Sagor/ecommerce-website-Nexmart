import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import api from '../services/api';
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (id) {
      api.get(`/orders/${id}`).then(r => setOrder(r.data.data)).catch(() => {});
    }
    // Fire confetti on mount
    try {
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: ['#FF6B35', '#10B981', '#3B82F6', '#F59E0B'] });
    } catch {}
  }, [id]);

  // Auto-redirect to tracking page
  useEffect(() => {
    if (countdown <= 0 && id) {
      navigate(`/order-tracking/${id}`);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, id, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Placed! 🎉</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Thank you for your purchase!</p>
          {id && <p className="text-sm text-gray-500">Order ID: <span className="font-mono font-medium text-primary">#{id.slice(0, 8).toUpperCase()}</span></p>}

          {order && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">{order.paymentMethod === 'COD' ? 'Total (COD)' : 'Total Paid'}</span>
                <span className="font-bold text-primary">${order.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">{order.items?.length}</span>
              </div>
            </div>
          )}

          <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-sm text-blue-700 dark:text-blue-400">
            Redirecting to order tracking in <span className="font-bold">{countdown}s</span>...
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <Link to={`/order-tracking/${id}`} className="btn-primary flex items-center justify-center gap-2 py-3">
              <Truck className="w-4 h-4" /> Track My Order
            </Link>
            <Link to="/" className="border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
              <Home className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
