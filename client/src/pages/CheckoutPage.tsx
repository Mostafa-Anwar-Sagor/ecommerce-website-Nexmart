import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { MapPin, CreditCard, ShoppingBag, CheckCircle, Lock, Banknote } from 'lucide-react';
import api from '../services/api';
import { clearCart } from '../store/slices/cartSlice';
import { RootState } from '../store';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface AddressForm {
  fullName: string; phone: string; street: string; addressLine2?: string;
  city: string; state: string; zipCode: string; country: string;
}

function CheckoutForm({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      await api.post('/orders/confirm-payment', { orderId, paymentIntentId: paymentIntent.id });
      dispatch(clearCart());
      navigate(`/order-success/${orderId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: '#374151', '::placeholder': { color: '#9CA3AF' } },
            invalid: { color: '#EF4444' },
          },
        }} />
      </div>
      <p className="text-xs text-gray-400 flex items-center gap-1"><Lock className="w-3 h-3" /> Your payment is secured with Stripe 256-bit SSL encryption</p>
      <button type="submit" disabled={!stripe || processing}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
        {processing ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
        ) : (
          <><Lock className="w-4 h-4" /> Pay Now</>
        )}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { items } = useSelector((s: RootState) => s.cart);
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [orderData, setOrderData] = useState<{ clientSecret: string; orderId: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'COD'>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AddressForm>();

  const subtotal = items.reduce((s, item) => s + (item.product.discountPrice || item.product.price) * item.quantity, 0);
  const shipping = subtotal >= 30 ? 0 : 5.99;
  const total = subtotal + shipping;

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
    api.get('/users/addresses').then(r => {
      setAddresses(r.data.data || []);
      const def = r.data.data?.find((a: any) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
    }).catch(() => {});
  }, []);

  const handleAddAddress = async (data: AddressForm) => {
    const { addressLine2, ...rest } = data;
    const res = await api.post('/users/addresses', { ...rest, label: addressLine2 || '', isDefault: addresses.length === 0 });
    const addr = res.data.data;
    setAddresses(prev => [...prev, addr]);
    setSelectedAddressId(addr.id);
    setShowNewAddress(false);
    toast.success('Address added');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) return toast.error('Please select a delivery address');
    setPlacingOrder(true);
    try {
      const res = await api.post('/orders', {
        items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        addressId: selectedAddressId,
        paymentMethod,
      });
      const data = res.data.data;

      if (paymentMethod === 'COD') {
        // COD: order is already placed, go directly to success
        dispatch(clearCart());
        navigate(`/order-success/${data.order.id}`);
        toast.success('Order placed successfully! Pay on delivery.');
      } else {
        // Stripe: proceed to card payment step
        setOrderData({ clientSecret: data.clientSecret, orderId: data.order.id });
        setStep(3);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Steps */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {[{ step: 1, label: 'Address', icon: <MapPin className="w-4 h-4" /> }, { step: 2, label: 'Review', icon: <ShoppingBag className="w-4 h-4" /> }, { step: 3, label: 'Payment', icon: <CreditCard className="w-4 h-4" /> }].map((s, i) => (
            <div key={s.step} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step >= s.step ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {s.icon}{s.label}
              </div>
              {i < 2 && <div className={`h-0.5 w-10 ${step > s.step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Delivery Address</h2>

                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-600'}`}>
                      <input type="radio" name="address" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-primary" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{addr.fullName}</p>
                        <p className="text-sm text-gray-500">{addr.phone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {showNewAddress ? (
                  <form onSubmit={handleSubmit(handleAddAddress)} className="space-y-3 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input {...register('fullName', { required: true })} placeholder="Full Name" className="input-field" />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1">Required</p>}
                      </div>
                      <input {...register('phone')} placeholder="Phone" className="input-field" />
                    </div>
                    <input {...register('street', { required: true })} placeholder="Street Address" className="input-field" />
                    <input {...register('addressLine2')} placeholder="Apartment, suite (optional)" className="input-field" />
                    <div className="grid grid-cols-3 gap-3">
                      <input {...register('city', { required: true })} placeholder="City" className="input-field" />
                      <input {...register('state', { required: true })} placeholder="State" className="input-field" />
                      <input {...register('zipCode', { required: true })} placeholder="ZIP" className="input-field" />
                    </div>
                    <input {...register('country')} placeholder="Country" defaultValue="US" className="input-field" />
                    <div className="flex gap-3">
                      <button type="submit" className="btn-primary text-sm py-2 px-4">Save Address</button>
                      <button type="button" onClick={() => setShowNewAddress(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setShowNewAddress(true)} className="text-sm text-primary font-medium hover:underline">+ Add New Address</button>
                )}

                <button onClick={() => { if (!selectedAddressId) return toast.error('Select an address'); setStep(2); }}
                  className="btn-primary w-full mt-6 py-3">Continue to Review</button>
              </div>
            )}

            {/* Step 2: Order Review */}
            {step === 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /> Review Order</h2>
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <img src={item.product.images?.[0]} alt={item.product.name} className="w-14 h-14 object-cover rounded-lg" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-primary text-sm">${((item.product.discountPrice || item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Payment Method Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-600'}`}>
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="accent-primary" />
                      <Banknote className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Cash on Delivery</p>
                        <p className="text-xs text-gray-500">Pay when you receive</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'STRIPE' ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-600'}`}>
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'STRIPE'} onChange={() => setPaymentMethod('STRIPE')} className="accent-primary" />
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Credit/Debit Card</p>
                        <p className="text-xs text-gray-500">Pay with Stripe</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 dark:border-gray-600 py-3 rounded-xl font-medium hover:border-gray-400 transition-colors text-sm">Back</button>
                  <button onClick={handlePlaceOrder} disabled={placingOrder}
                    className="flex-1 btn-primary py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                    {placingOrder ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    ) : paymentMethod === 'COD' ? 'Place Order (COD)' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && orderData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment</h2>
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Order created! Complete payment to confirm.
                </div>
                <Elements stripe={stripePromise} options={{ clientSecret: orderData.clientSecret }}>
                  <CheckoutForm clientSecret={orderData.clientSecret} orderId={orderData.orderId} />
                </Elements>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 h-fit sticky top-20">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span></div>
              <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
