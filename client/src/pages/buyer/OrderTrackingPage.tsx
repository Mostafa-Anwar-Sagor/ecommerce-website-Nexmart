import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, Truck, CheckCircle2, CreditCard, Clock, MapPin, ArrowLeft,
  ShoppingBag, ClipboardList, TruckIcon, Home, XCircle, RotateCcw,
  Phone, Copy, Check,
} from 'lucide-react';
import api from '../../services/api';

/* ─── Status Flow Steps ──── */
const TRACKING_STEPS = [
  { key: 'PENDING',    label: 'Order Placed',   icon: ShoppingBag,   color: 'yellow' },
  { key: 'CONFIRMED',  label: 'Confirmed',      icon: CreditCard,    color: 'blue' },
  { key: 'PROCESSING', label: 'Processing',     icon: ClipboardList, color: 'indigo' },
  { key: 'SHIPPED',    label: 'Shipped',         icon: TruckIcon,     color: 'purple' },
  { key: 'DELIVERED',  label: 'Delivered',       icon: CheckCircle2,  color: 'green' },
];

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0, CONFIRMED: 1, PROCESSING: 2, SHIPPED: 3, DELIVERED: 4,
};

/* For COD orders that skip PENDING/CONFIRMED, we start from "Order Placed" directly */
const COD_STEPS = [
  { key: 'PROCESSING', label: 'Order Placed',   icon: ShoppingBag,   color: 'blue' },
  { key: 'PROCESSING2',label: 'Processing',     icon: ClipboardList, color: 'indigo' },
  { key: 'SHIPPED',    label: 'Shipped',         icon: TruckIcon,     color: 'purple' },
  { key: 'DELIVERED',  label: 'Delivered',       icon: CheckCircle2,  color: 'green' },
];

const COD_STATUS_INDEX: Record<string, number> = {
  PROCESSING: 1, SHIPPED: 2, DELIVERED: 3,
};

const stepColors: Record<string, { bg: string; ring: string; text: string; line: string }> = {
  yellow:  { bg: 'bg-yellow-500', ring: 'ring-yellow-200', text: 'text-yellow-600', line: 'bg-yellow-400' },
  blue:    { bg: 'bg-blue-500',   ring: 'ring-blue-200',   text: 'text-blue-600',   line: 'bg-blue-400' },
  indigo:  { bg: 'bg-indigo-500', ring: 'ring-indigo-200', text: 'text-indigo-600', line: 'bg-indigo-400' },
  purple:  { bg: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-600', line: 'bg-purple-400' },
  green:   { bg: 'bg-green-500',  ring: 'ring-green-200',  text: 'text-green-600',  line: 'bg-green-400' },
};

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      api.get(`/orders/${id}`)
        .then(r => setOrder(r.data.data))
        .catch(() => navigate('/orders'))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const copyOrderId = () => {
    if (id) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-600 dark:text-gray-400">Order not found</h2>
          <Link to="/orders" className="btn-primary mt-4 inline-block">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const isCOD = order.paymentMethod === 'COD';
  const isCancelled = order.status === 'CANCELLED';
  const isRefunded = order.status === 'REFUNDED';

  /* Determine steps based on payment method */
  const steps = isCOD ? COD_STEPS : TRACKING_STEPS;
  const statusIndex = isCOD ? COD_STATUS_INDEX : STATUS_INDEX;
  const currentIdx = isCancelled || isRefunded ? -1 : (statusIndex[order.status] ?? 0);

  /* ─── Build timeline: merge DB events + generate synthetic events for status ─── */
  const dbEvents: any[] = order.tracking || [];

  // Shopee-style status descriptions
  const statusDescriptions: Record<string, { title: string; desc: string }> = {
    PENDING:    { title: 'Order Placed',           desc: 'Your order has been placed successfully and is awaiting payment confirmation.' },
    CONFIRMED:  { title: 'Order Confirmed',        desc: 'Payment received. Your order has been confirmed and sent to the seller.' },
    PROCESSING: { title: isCOD ? 'Order Placed & Processing' : 'Processing',
                  desc: isCOD
                    ? 'Your order has been placed with Cash on Delivery. The seller is preparing your package.'
                    : 'The seller is preparing your package for shipment.' },
    SHIPPED:    { title: 'Shipped Out',            desc: 'Your parcel has been shipped and is on its way to you.' },
    DELIVERED:  { title: 'Delivered',              desc: 'Your parcel has been delivered successfully. Enjoy your purchase!' },
    CANCELLED:  { title: 'Order Cancelled',        desc: order.cancelReason || 'This order has been cancelled.' },
    REFUNDED:   { title: 'Order Refunded',         desc: 'A refund has been processed for this order.' },
  };

  // Build the full Shopee-style timeline
  function buildTimeline() {
    // If we have DB tracking events, use them as-is
    if (dbEvents.length > 0) return dbEvents;

    // Otherwise, generate synthetic events based on current status
    const orderDate = new Date(order.createdAt);
    const statusFlow = isCOD
      ? ['PROCESSING', 'SHIPPED', 'DELIVERED']
      : ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

    const currentStatusIdx = statusFlow.indexOf(order.status);
    const syntheticEvents: any[] = [];

    statusFlow.forEach((status, idx) => {
      if (idx > currentStatusIdx && !isCancelled && !isRefunded) return; // Don't show future steps

      const info = statusDescriptions[status];
      // Approximate timestamps: spread events across the timeline
      const eventDate = new Date(orderDate);
      if (idx === 0) {
        // First event = order creation time
      } else if (status === 'DELIVERED' && order.deliveredAt) {
        eventDate.setTime(new Date(order.deliveredAt).getTime());
      } else {
        // Spread other events proportionally
        eventDate.setMinutes(eventDate.getMinutes() + idx * 30);
      }

      syntheticEvents.push({
        id: `synthetic-${status}-${idx}`,
        status,
        description: info?.desc || `Order status: ${status}`,
        createdAt: eventDate.toISOString(),
        carrier: 'NexMart',
        lastLocation: status === 'SHIPPED' ? 'In transit' : status === 'DELIVERED' ? 'Delivered to address' : undefined,
        trackingNumber: null,
      });
    });

    // Add cancelled/refunded event if applicable
    if (isCancelled) {
      syntheticEvents.push({
        id: 'synthetic-cancelled',
        status: 'CANCELLED',
        description: order.cancelReason || 'This order has been cancelled.',
        createdAt: order.updatedAt,
        carrier: null,
        lastLocation: null,
        trackingNumber: null,
      });
    }

    if (isRefunded) {
      syntheticEvents.push({
        id: 'synthetic-refunded',
        status: 'REFUNDED',
        description: 'A full refund has been issued to your payment method.',
        createdAt: order.updatedAt,
        carrier: null,
        lastLocation: null,
        trackingNumber: null,
      });
    }

    return syntheticEvents;
  }

  const trackingEvents = buildTimeline();

  /* Estimated delivery date */
  const latestTracking = trackingEvents.length > 0 ? trackingEvents[trackingEvents.length - 1] : null;
  const estimatedDelivery = (() => {
    // Check DB events for explicit estimated delivery
    const dbEstimate = dbEvents.find((t: any) => t.estimatedDelivery);
    if (dbEstimate) return new Date(dbEstimate.estimatedDelivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    // Auto-estimate: 3-5 days from order date if not delivered
    if (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
      const est = new Date(order.createdAt);
      est.setDate(est.getDate() + 4);
      return est.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return null;
  })();
  const carrier = dbEvents.find((t: any) => t.carrier && t.carrier !== 'NexMart')?.carrier || 'Standard Delivery';
  const trackingNumber = dbEvents.find((t: any) => t.trackingNumber)?.trackingNumber;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/orders')}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Order Tracking</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-gray-500">#{id?.slice(0, 8).toUpperCase()}</span>
              <button onClick={copyOrderId} className="text-gray-400 hover:text-primary transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* ══════════ CANCELLED / REFUNDED BANNER ══════════ */}
        {(isCancelled || isRefunded) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border-2 flex items-center gap-3 ${
              isCancelled ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
            }`}>
            {isCancelled ? <XCircle className="w-6 h-6 text-red-500" /> : <RotateCcw className="w-6 h-6 text-orange-500" />}
            <div>
              <p className={`font-semibold ${isCancelled ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>
                {isCancelled ? 'Order Cancelled' : 'Order Refunded'}
              </p>
              <p className="text-sm text-gray-500">{order.cancelReason || (isCancelled ? 'This order has been cancelled.' : 'A refund has been issued.')}</p>
            </div>
          </motion.div>
        )}

        {/* ══════════ PROGRESS STEPPER (Shopee-style) ══════════ */}
        {!isCancelled && !isRefunded && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6 overflow-hidden">
            {/* Estimated Delivery Banner */}
            {order.status !== 'DELIVERED' && estimatedDelivery && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 rounded-xl mb-6">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                  Estimated delivery: {estimatedDelivery}
                </span>
              </div>
            )}

            {order.status === 'DELIVERED' && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2.5 rounded-xl mb-6">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                  Delivered on {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'recently'}
                </span>
              </div>
            )}

            {/* Stepper */}
            <div className="relative">
              {/* Connection line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 mx-8 z-0" />
              <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-primary mx-8 z-[1] transition-all duration-700"
                style={{ width: steps.length > 1 ? `calc(${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}% - 4rem)` : '0%' }} />

              <div className="relative z-10 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                {steps.map((step, idx) => {
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = step.icon;
                  const colors = stepColors[step.color];

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: isCurrent ? 1.15 : 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          isCompleted
                            ? `${colors.bg} text-white shadow-lg ring-4 ${colors.ring} ring-opacity-40`
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                        } ${isCurrent ? 'animate-pulse' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.div>
                      <p className={`mt-2 text-xs font-medium text-center leading-tight ${
                        isCompleted ? colors.text : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {/* Show timestamp for completed steps */}
                      {isCompleted && trackingEvents.length > 0 && (() => {
                        const event = trackingEvents.find((t: any) => {
                          if (step.key === 'PROCESSING2') return t.status === 'PROCESSING';
                          return t.status === step.key;
                        });
                        return event ? (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ══════════ LEFT: Tracking Timeline + Items ══════════ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Timeline */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" /> Tracking Updates
              </h3>

              {trackingNumber && (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg mb-4 text-sm">
                  <span className="text-gray-500">Tracking #:</span>
                  <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{trackingNumber}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{carrier}</span>
                </div>
              )}

              {/* Shopee-style shipping info bar */}
              {!isCancelled && !isRefunded && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 rounded-xl mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {statusDescriptions[order.status]?.title || order.status}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {carrier}{trackingNumber ? ` · ${trackingNumber}` : ''} · {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid'}
                    </p>
                  </div>
                  {order.status === 'SHIPPED' && (
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Est. Arrival</p>
                      <p className="text-xs font-medium text-primary">{estimatedDelivery || '3-5 days'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline - always shows (synthetic or real) */}
              <div className="relative pl-8">
                {/* Vertical timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-0">
                  {[...trackingEvents].reverse().map((event: any, idx: number) => {
                    const isFirst = idx === 0;
                    const statusColor = event.status === 'DELIVERED' ? 'bg-green-500'
                      : event.status === 'SHIPPED' ? 'bg-purple-500'
                      : event.status === 'PROCESSING' ? 'bg-blue-500'
                      : event.status === 'CONFIRMED' ? 'bg-blue-400'
                      : event.status === 'CANCELLED' ? 'bg-red-500'
                      : event.status === 'REFUNDED' ? 'bg-orange-500'
                      : 'bg-yellow-500';

                    const statusBgLight = event.status === 'DELIVERED' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : event.status === 'SHIPPED' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                      : event.status === 'PROCESSING' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : event.status === 'CONFIRMED' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : event.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                      : event.status === 'REFUNDED' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';

                    const StatusIcon = event.status === 'DELIVERED' ? CheckCircle2
                      : event.status === 'SHIPPED' ? TruckIcon
                      : event.status === 'PROCESSING' ? ClipboardList
                      : event.status === 'CONFIRMED' ? CreditCard
                      : event.status === 'CANCELLED' ? XCircle
                      : event.status === 'REFUNDED' ? RotateCcw
                      : ShoppingBag;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="relative pb-6 last:pb-0"
                      >
                        {/* Icon circle on timeline */}
                        <div className={`absolute -left-8 top-0 w-[30px] h-[30px] rounded-full flex items-center justify-center z-10 border-2 border-white dark:border-gray-800 ${
                          isFirst ? `${statusColor} shadow-lg ring-4 ring-opacity-30 ${statusColor.replace('bg-', 'ring-')}` : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${isFirst ? 'text-white' : 'text-gray-400'}`} />
                        </div>

                        <div className={`ml-2 ${isFirst ? '' : 'opacity-60'}`}>
                          {/* Status title + time */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                              isFirst ? statusBgLight : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {statusDescriptions[event.status]?.title || event.status}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">
                              {new Date(event.createdAt).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {/* Description */}
                          {event.description && (
                            <p className={`text-sm mt-1.5 ${isFirst ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                              {event.description}
                            </p>
                          )}
                          {/* Location */}
                          {event.lastLocation && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {event.lastLocation}
                            </p>
                          )}
                          {/* Tracking number if different from main */}
                          {event.trackingNumber && event.trackingNumber !== trackingNumber && (
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">
                              Tracking: {event.trackingNumber}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Order Items */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Order Items ({order.items?.length || 0})
              </h3>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    <Link to={`/product/${item.product?.slug || ''}`}>
                      <img
                        src={item.product?.images?.[0] || item.productImage || '/placeholder.png'}
                        alt={item.productName}
                        className="w-16 h-16 rounded-xl object-cover bg-gray-100 shrink-0 hover:opacity-80 transition-opacity"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product?.slug || ''}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-2">
                        {item.productName}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                      {item.variant && (
                        <p className="text-xs text-gray-400">
                          {typeof item.variant === 'object' ? Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ') : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-gray-400">${item.price.toFixed(2)} each</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ══════════ RIGHT: Order Summary + Delivery Info ══════════ */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800 dark:text-gray-200">${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className={order.shippingFee === 0 ? 'text-green-600 font-medium' : 'text-gray-800 dark:text-gray-200'}>
                    {order.shippingFee === 0 ? 'Free' : `$${order.shippingFee?.toFixed(2)}`}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600 font-medium">-${order.discount?.toFixed(2)}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-800 dark:text-gray-200">${order.taxAmount?.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-gray-100 dark:border-gray-700" />
                <div className="flex justify-between font-bold text-base">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-primary">${order.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    order.paymentStatus === 'PAID' ? 'bg-green-500' : order.paymentStatus === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500">{order.paymentStatus}</span>
                </div>
              </div>
            </motion.div>

            {/* Delivery Address */}
            {order.address && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white">{order.address.fullName}</p>
                  <p className="text-gray-500">{order.address.street}</p>
                  <p className="text-gray-500">{order.address.city}, {order.address.state}</p>
                  <p className="text-gray-500">{order.address.country} {order.address.zipCode}</p>
                  {order.address.phone && (
                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-2">
                      <Phone className="w-3 h-3" /> {order.address.phone}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Order Date Info */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ordered</span>
                  <span className="text-gray-800 dark:text-gray-200 text-xs">
                    {new Date(order.createdAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivered</span>
                    <span className="text-green-600 text-xs font-medium">
                      {new Date(order.deliveredAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Actions */}
            {!isCancelled && !isRefunded && ['PENDING', 'PROCESSING'].includes(order.status) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <CancelOrderButton orderId={order.id} onCancelled={() => {
                  setOrder((o: any) => ({ ...o, status: 'CANCELLED' }));
                }} />
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              <Link to="/orders"
                className="text-center py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                Back to Orders
              </Link>
              <Link to="/"
                className="text-center py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                <Home className="w-4 h-4" /> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Cancel Order Button ─── */
function CancelOrderButton({ orderId, onCancelled }: { orderId: string; onCancelled: () => void }) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/orders/${orderId}/cancel`, { reason });
      onCancelled();
      setShow(false);
    } catch {
      // error handled by api interceptor
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <button onClick={() => setShow(true)}
        className="w-full py-2.5 rounded-xl border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
        Cancel Order
      </button>

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cancel Order?</h3>
            <p className="text-sm text-gray-500 mb-4">This action cannot be undone. You will receive a refund if payment was already made.</p>
            <textarea
              placeholder="Reason for cancellation (optional)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm resize-none h-20 focus:ring-2 focus:ring-primary/30 focus:border-primary dark:bg-gray-700 dark:text-white"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShow(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">
                Keep Order
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
