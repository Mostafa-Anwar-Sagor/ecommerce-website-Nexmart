import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Store, ShieldCheck, TrendingUp, Truck, Users, Headphones,
  ChevronRight, ChevronLeft, CheckCircle2, Upload, Mail, Phone,
  MapPin, Globe, FileText, Sparkles, Package, BarChart3, Rocket,
  Clock, XCircle, ImagePlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { RootState } from '../../store';

const STEPS = ['Shop Info', 'Contact Details', 'Review & Submit'];

const SHOP_TYPES = [
  'Electronics & Gadgets',
  'Fashion & Apparel',
  'Health & Beauty',
  'Home & Living',
  'Food & Beverages',
  'Sports & Outdoors',
  'Toys & Kids',
  'Books & Stationery',
  'Automotive & Parts',
  'Jewelry & Accessories',
  'Digital Products',
  'Other',
];

const BENEFITS = [
  { icon: Users, title: 'Millions of Buyers', desc: 'Access a massive marketplace of active shoppers ready to buy' },
  { icon: TrendingUp, title: 'Powerful Analytics', desc: 'Track your sales, revenue, and growth with real-time dashboards' },
  { icon: Truck, title: 'Easy Shipping', desc: 'Integrated shipping management with automated tracking updates' },
  { icon: ShieldCheck, title: 'Seller Protection', desc: 'Secure payments and dispute resolution to protect your business' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated seller support team to help you succeed' },
  { icon: Sparkles, title: 'AI-Powered Tools', desc: 'Smart product descriptions, pricing suggestions & chatbot assistant' },
];

const STATS = [
  { value: '10M+', label: 'Active Buyers' },
  { value: '500K+', label: 'Sellers Trust Us' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

export default function SellerRegisterPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);

  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Check existing application status
  const [appStatus, setAppStatus] = useState<null | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'BANNED'>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [appShop, setAppShop] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    shopType: '',
    description: '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    website: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');

  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user already has a shop application
  useEffect(() => {
    if (!isAuthenticated) { setAppLoading(false); return; }
    api.get('/seller/shop/application')
      .then(r => {
        const shop = r.data.data;
        if (shop) {
          setAppStatus(shop.status);
          setAppShop(shop);
        }
      })
      .catch(() => { /* no application */ })
      .finally(() => setAppLoading(false));
  }, [isAuthenticated]);

  // If user is already a seller, redirect
  if (user?.role === 'SELLER') {
    navigate('/seller/dashboard', { replace: true });
    return null;
  }

  const set = (key: keyof typeof form, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  };

  const handleImageSelect = (type: 'logo' | 'cover', file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) { toast.error('Only image files allowed'); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'logo') {
        setLogoFile(file);
        setLogoPreview(e.target?.result as string);
      } else {
        setCoverFile(file);
        setCoverPreview(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) errs.name = 'Shop name is required';
      else if (form.name.trim().length < 3) errs.name = 'Shop name must be at least 3 characters';
      if (!form.shopType) errs.shopType = 'Please select a shop type';
      if (form.description && form.description.length > 500) errs.description = 'Description must be under 500 characters';
    }
    if (s === 1) {
      if (!form.phone.trim()) errs.phone = 'Phone number is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
      if (!form.address.trim()) errs.address = 'Business address is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 2));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append('images', file);
    const res = await api.post(`/upload?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data[0]?.url || '';
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      // Upload images first
      let logoUrl = '';
      let coverUrl = '';
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'shops');
      }
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'shops');
      }

      const payload: Record<string, string> = {
        name: form.name.trim(),
        shopType: form.shopType,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (logoUrl) payload.logo = logoUrl;
      if (coverUrl) payload.coverImage = coverUrl;
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.address.trim()) payload.address = form.address.trim();

      const res = await api.post('/seller/shop', payload);
      setAppStatus('PENDING');
      setAppShop(res.data.data);
      setShowForm(false);
      toast.success('Application submitted! Awaiting admin approval.');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── APPLICATION STATUS SCREEN ──────────────────────────
  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (appStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 text-center">
            {appStatus === 'PENDING' && (
              <>
                <div className="w-20 h-20 mx-auto bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-5">
                  <Clock className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application Under Review</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  Your shop application for <strong className="text-gray-700 dark:text-gray-200">"{appShop?.name}"</strong> has been submitted
                  and is currently being reviewed by our team. You'll be notified once it's approved.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4 text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium mb-1">Estimated Review Time</p>
                  <p>Applications are typically reviewed within 1-2 business days.</p>
                </div>
              </>
            )}
            {appStatus === 'ACTIVE' && (
              <>
                <div className="w-20 h-20 mx-auto bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Shop Approved!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Your shop has been approved. Please log in again to access your Seller Dashboard.
                </p>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Log In Again <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
            {(appStatus === 'SUSPENDED' || appStatus === 'BANNED') && (
              <>
                <div className="w-20 h-20 mx-auto bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-5">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Application {appStatus === 'BANNED' ? 'Rejected' : 'Suspended'}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Unfortunately your shop application has been {appStatus === 'BANNED' ? 'rejected' : 'suspended'}.
                  Please contact support for more information.
                </p>
              </>
            )}

            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
              <Link to="/" className="text-sm text-primary-500 hover:underline font-medium">
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── LANDING SECTION ──────────────────────────────────
  if (!showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-orange-500/10" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Rocket className="w-4 h-4" />
              Start Your Business Journey
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
              Start Selling on{' '}
              <span className="bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent">
                NexMart
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of successful sellers. Set up your shop in minutes,
              reach millions of buyers, and grow your business with our powerful tools.
            </p>

            {!isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">You need an account to apply as a seller</p>
                <Link
                  to="/auth/register"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Create Account First
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                <Store className="w-6 h-6" />
                Apply to Become a Seller
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent">
                    {s.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-4">
            Why Sell on NexMart?
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-14 max-w-xl mx-auto">
            Everything you need to start, manage, and grow your online business.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="group p-6 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-primary-200 dark:hover:border-primary-700/50 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-800/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <b.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-950 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-14">
              How to Start Selling
            </h2>

            <div className="space-y-8">
              {[
                { icon: FileText, num: '1', title: 'Register an Account', desc: 'Create a free NexMart account as a buyer first.' },
                { icon: Store, num: '2', title: 'Apply for a Shop', desc: 'Fill in your shop details, upload images, and submit your application.' },
                { icon: ShieldCheck, num: '3', title: 'Admin Approval', desc: 'Our team reviews your application and approves your shop.' },
                { icon: Package, num: '4', title: 'Start Selling!', desc: 'Once approved, add products and start earning!' },
              ].map((s, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <span className="text-white font-extrabold text-xl">{s.num}</span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{s.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-14">
              {!isAuthenticated ? (
                <Link
                  to="/auth/register"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Create Account to Get Started
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Apply Now
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─── MULTI-STEP FORM ──────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 nexmart-gradient rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">NexMart Seller Center</h1>
              <p className="text-xs text-gray-500">Shop Application</p>
            </div>
          </div>
          <button onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            ← Back
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10 max-w-lg mx-auto">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    i < step ? 'bg-green-500 text-white'
                    : i === step ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs mt-2 font-medium whitespace-nowrap ${
                  i <= step ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 sm:w-24 h-1 rounded-full mx-2 mb-6 transition-all duration-300 ${
                  i < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Step 1: Shop Info */}
          {step === 0 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary-500" />
                  Shop Information
                </h2>
                <p className="text-sm text-gray-500 mt-1">Set up your shop's identity and branding</p>
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. TechStore, Fashion Hub"
                    className={`w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-primary-400'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Shop Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Shop Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.shopType}
                  onChange={e => set('shopType', e.target.value)}
                  className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border ${errors.shopType ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-primary-400'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition appearance-none cursor-pointer`}
                >
                  <option value="">Select shop category...</option>
                  {SHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.shopType && <p className="text-xs text-red-500 mt-1">{errors.shopType}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Shop Description
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Tell buyers what your shop is about..."
                  rows={4}
                  className={`w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border ${errors.description ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-primary-400'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 resize-none transition`}
                />
                <p className="text-xs text-gray-400 mt-1">{form.description.length}/500 characters</p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Shop Logo
                </label>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={e => handleImageSelect('logo', e.target.files?.[0] || null)}
                />
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative group">
                      <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      >×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => logoRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition cursor-pointer"
                    >
                      <ImagePlus className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-400">Upload</span>
                    </button>
                  )}
                  <div className="text-xs text-gray-400">
                    <p>Recommended: 200x200px</p>
                    <p>Max 5MB - JPG, PNG, GIF, WebP</p>
                  </div>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Cover Image
                </label>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={e => handleImageSelect('cover', e.target.files?.[0] || null)}
                />
                {coverPreview ? (
                  <div className="relative group">
                    <img src={coverPreview} alt="Cover" className="w-full h-36 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => { setCoverFile(null); setCoverPreview(''); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                    >×</button>
                  </div>
                ) : (
                  <button
                    onClick={() => coverRef.current?.click()}
                    className="w-full h-36 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-400">Click to upload cover image</span>
                    <span className="text-xs text-gray-400">Recommended: 1200x400px</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {step === 1 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary-500" />
                  Contact & Address
                </h2>
                <p className="text-sm text-gray-500 mt-1">How buyers can reach you</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 8900"
                    className={`w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border ${errors.phone ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-primary-400'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition`} />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Business Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="shop@example.com" type="email"
                    className={`w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border ${errors.email ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-primary-400'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition`} />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <textarea value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Street address, City, State, ZIP" rows={3}
                    className={`w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border ${errors.address ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:border-primary-400'} rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 resize-none transition`} />
                </div>
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Website <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://www.yourshop.com"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 2 && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary-500" />
                  Review Your Application
                </h2>
                <p className="text-sm text-gray-500 mt-1">Make sure everything looks good before submitting</p>
              </div>

              {/* Preview Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {coverPreview ? (
                  <div className="h-32 relative overflow-hidden">
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-r from-primary-500 to-orange-500" />
                )}

                <div className="px-6 pb-6 -mt-8">
                  <div className="flex items-end gap-4 mb-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border-4 border-white dark:border-gray-900 shadow-lg" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                        <Store className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <div className="pb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{form.name || 'Your Shop Name'}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                        {form.shopType && (
                          <span className="text-xs text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400 px-2 py-0.5 rounded-full">
                            {form.shopType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {form.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{form.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Mail, label: 'Email', value: form.email },
                      { icon: Phone, label: 'Phone', value: form.phone },
                      { icon: MapPin, label: 'Address', value: form.address },
                      ...(form.website ? [{ icon: Globe, label: 'Website', value: form.website }] : []),
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <item.icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400">{item.label}</div>
                          <div className="font-medium text-gray-700 dark:text-gray-300 break-all">{item.value || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                  By submitting this application, you agree to NexMart's{' '}
                  <span className="font-semibold underline cursor-pointer">Seller Terms of Service</span>{' '}
                  and{' '}
                  <span className="font-semibold underline cursor-pointer">Seller Policies</span>.
                  Your application will be reviewed by our team. Once approved, your account will be upgraded to a Seller account.
                </p>
              </div>
            </div>
          )}

          {/* Footer Nav */}
          <div className="px-6 sm:px-8 py-4 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            {step > 0 ? (
              <button onClick={prevStep} className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            ) : <div />}

            {step < 2 ? (
              <button onClick={nextStep} className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/20 transition-all">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><Rocket className="w-4 h-4" /> Submit Application</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
