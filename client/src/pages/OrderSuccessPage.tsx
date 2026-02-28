import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import axios from 'axios';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (id) {
      axios.get(`/api/orders/${id}`).then(r => setOrder(r.data.data)).catch(() => {});
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed! 🎉</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">Thank you for your purchase!</p>
          {id && <p className="text-sm text-gray-500">Order ID: <span className="font-mono font-medium text-primary">#{id.slice(0, 8).toUpperCase()}</span></p>}

          {order && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-bold text-primary">${order.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">{order.items?.length}</span>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-sm text-blue-700 dark:text-blue-400">
            📧 A confirmation email has been sent to your registered email address.
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <Link to={`/orders`} className="btn-primary flex items-center justify-center gap-2 py-3">
              <Package className="w-4 h-4" /> Track My Order
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
