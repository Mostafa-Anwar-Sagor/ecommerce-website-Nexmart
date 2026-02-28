import { useState, useEffect } from 'react';
import { Store, Camera, Save, MapPin, Phone, Mail, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function SellerSettingsPage() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasShop, setHasShop] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    logo: '',
    coverImage: '',
    phone: '',
    email: '',
    address: '',
    website: '',
  });

  useEffect(() => {
    api.get('/seller/shop')
      .then(r => {
        const s = r.data.data;
        setShop(s);
        setForm({
          name: s.name || '',
          description: s.description || '',
          logo: s.logo || '',
          coverImage: s.coverImage || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          website: s.website || '',
        });
      })
      .catch(err => {
        if (err.response?.status === 404) setHasShop(false);
        else toast.error('Failed to load shop info');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await api.patch('/seller/shop', form);
      setShop(r.data.data);
      toast.success('Shop settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Shop name is required');
    setCreating(true);
    try {
      const r = await api.post('/seller/shop', form);
      setShop(r.data.data);
      setHasShop(true);
      toast.success('Shop created successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create shop');
    } finally {
      setCreating(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder: string, icon: React.ElementType, type = 'text', textarea = false) => {
    const Icon = icon;
    return (
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-gray-400" /> {label}
        </label>
        {textarea ? (
          <textarea
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={4}
            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30 resize-none"
          />
        ) : (
          <input
            type={type}
            value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-primary-600" /> Shop Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your shop profile and contact information</p>
        </div>
        {shop && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" /> Active shop
          </div>
        )}
      </div>

      {/* No shop banner */}
      {!hasShop && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">No shop yet</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">Fill in the details below and click "Create Shop" to start selling.</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Cover image preview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div
            className="relative h-32 bg-gradient-to-r from-primary-400 to-primary-600"
            style={form.coverImage ? { backgroundImage: `url(${form.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="px-5 pb-5 pt-0 -mt-8 flex items-end gap-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center overflow-hidden"
              >
                {form.logo ? (
                  <img src={form.logo} alt="logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-7 h-7 text-gray-400" />
                )}
              </div>
            </div>
            <div className="mb-1">
              <p className="font-bold text-gray-900 dark:text-white">{form.name || 'Your Shop Name'}</p>
              {shop?.rating && <p className="text-xs text-gray-500">★ {shop.rating.toFixed(1)} rating</p>}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Basic Information</h2>
          <div className="space-y-4">
            {field('name', 'Shop Name *', 'My Awesome Shop', Store)}
            {field('description', 'Shop Description', 'Tell buyers about your shop, what you sell, your policies...', Store, 'text', true)}
          </div>
        </div>

        {/* Media */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4" /> Images
          </h2>
          <div className="space-y-4">
            {field('logo', 'Logo URL', 'https://...your-logo.png', Camera)}
            {field('coverImage', 'Cover Image URL', 'https://...your-cover.jpg', Camera)}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-4">Contact Information</h2>
          <div className="space-y-4">
            {field('email', 'Business Email', 'shop@example.com', Mail, 'email')}
            {field('phone', 'Phone Number', '+1 555 000 0000', Phone)}
            {field('address', 'Business Address', '123 Main St, City, Country', MapPin)}
            {field('website', 'Website (optional)', 'https://yoursite.com', Globe, 'url')}
          </div>
        </div>

        {/* Save / Create */}
        <div className="flex gap-3">
          {hasShop ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-60"
            >
              <Store className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Shop'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
