import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Sparkles, Upload, X, Plus, Loader2, ChevronDown, ImagePlus } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

type FormData = {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice: number;
  stock: number;
  sku: string;
  categoryId: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  specifications: { key: string; value: string }[];
  variants: { name: string; options: string }[];
};

const STEPS = ['Basic Info', 'Images', 'Pricing & Stock', 'SEO & Details'];

export default function AddProductPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<FormData>({
    defaultValues: { specifications: [{ key: '', value: '' }], variants: [] },
  });
  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({ control, name: 'specifications' });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' });

  const watchName = watch('name');
  const watchShortDesc = watch('shortDescription');

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data?.categories || []));
  }, []);

  const handleImageDrop = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).slice(0, 8 - images.length).map(file => ({
      file, preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  const removeImage = (i: number) => {
    URL.revokeObjectURL(images[i].preview);
    setImages(prev => prev.filter((_, idx) => idx !== i));
  };

  const uploadImages = async () => {
    if (images.length === 0) return [];
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const img of images) {
        const fd = new FormData();
        fd.append('images', img.file);
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        urls.push(...(res.data.data?.urls || []));
      }
      setUploadedUrls(urls);
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const generateWithAI = async () => {
    if (!watchName?.trim()) { toast.error('Please enter a product name first'); return; }
    setGeneratingAI(true);
    try {
      const res = await api.post('/ai/generate-description', {
        productName: watchName,
        category: 'General',
        features: watchShortDesc ? [watchShortDesc] : [],
      });
      const data = res.data.data;
      if (data.shortDescription) setValue('shortDescription', data.shortDescription);
      if (data.fullDescription) setValue('description', data.fullDescription);
      if (data.seoTitle) setValue('seoTitle', data.seoTitle);
      if (data.seoDescription) setValue('seoDescription', data.seoDescription);
      if (data.tags) setValue('tags', Array.isArray(data.tags) ? data.tags.join(', ') : data.tags);
      toast.success('✨ AI content generated!');
    } catch {
      toast.error('AI generation failed. Please try again.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      let imageUrls = uploadedUrls;
      if (images.length > 0 && imageUrls.length === 0) imageUrls = await uploadImages();
      const payload = {
        ...data,
        price: Number(data.price),
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        stock: Number(data.stock),
        images: imageUrls,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        specifications: data.specifications.filter(s => s.key && s.value),
        variants: data.variants.filter(v => v.name).map(v => ({
          name: v.name,
          options: v.options.split(',').map(o => o.trim()).filter(Boolean),
        })),
      };
      await api.post('/products', payload);
      toast.success('Product published!');
      navigate('/seller/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Product</h1>

        {/* Step indicator */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center min-w-max">
              <button onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${i === step ? 'text-primary' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 ${i === step ? 'border-primary text-primary' : i < step ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-400'}`}>
                  {i < step ? '✓' : i + 1}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-12 mx-3 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Basic Information</h2>
                  <button type="button" onClick={generateWithAI} disabled={generatingAI || !watchName}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-orange-400 text-white text-sm font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generatingAI ? 'Generating…' : '✨ Generate with AI'}
                  </button>
                </div>
                <p className="text-sm text-gray-500 bg-orange-50 border border-orange-100 rounded-xl p-3">
                  <strong className="text-orange-600">AI Tip:</strong> Enter a product name and click "Generate with AI" to instantly create SEO-optimized descriptions, tags, and content using GPT-4.
                </p>

                <div>
                  <label className={labelClass}>Product Name *</label>
                  <input {...register('name', { required: 'Required' })} placeholder="e.g. Wireless Noise-Cancelling Headphones" className={inputClass} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className={labelClass}>Short Description</label>
                  <input {...register('shortDescription')} placeholder="Brief one-line description" className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Full Description</label>
                  <textarea {...register('description')} rows={6} placeholder="Detailed product description…" className={`${inputClass} resize-none`} />
                </div>

                <div>
                  <label className={labelClass}>Category *</label>
                  <div className="relative">
                    <select {...register('categoryId', { required: 'Required' })} className={`${inputClass} appearance-none pr-10`}>
                      <option value="">Select category</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Tags (comma-separated)</label>
                  <input {...register('tags')} placeholder="e.g. wireless, headphones, audio, bluetooth" className={inputClass} />
                </div>

                {/* Specifications */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass + ' !mb-0'}>Specifications</label>
                    <button type="button" onClick={() => appendSpec({ key: '', value: '' })} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add row</button>
                  </div>
                  <div className="space-y-2">
                    {specFields.map((field, i) => (
                      <div key={field.id} className="flex gap-2">
                        <input {...register(`specifications.${i}.key`)} placeholder="Key (e.g. Battery)" className={`${inputClass} flex-1`} />
                        <input {...register(`specifications.${i}.value`)} placeholder="Value (e.g. 30 hours)" className={`${inputClass} flex-1`} />
                        {specFields.length > 1 && <button type="button" onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass + ' !mb-0'}>Variants (Optional)</label>
                    <button type="button" onClick={() => appendVariant({ name: '', options: '' })} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add variant</button>
                  </div>
                  <div className="space-y-2">
                    {variantFields.map((field, i) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <input {...register(`variants.${i}.name`)} placeholder="Type (e.g. Color)" className={`${inputClass} w-32`} />
                        <input {...register(`variants.${i}.options`)} placeholder="Options: Red, Blue, Black" className={`${inputClass} flex-1`} />
                        <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Images */}
            {step === 1 && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">Product Images</h2>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleImageDrop(e.dataTransfer.files); }}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer mb-4"
                  onClick={() => document.getElementById('imageInput')?.click()}>
                  <ImagePlus className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drag & drop images or click to select</p>
                  <p className="text-xs text-gray-400 mt-1">Up to 8 images, JPG/PNG/WEBP, max 5MB each</p>
                  <input id="imageInput" type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageDrop(e.target.files)} />
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img.preview} alt="" className="w-full h-24 object-cover rounded-xl" />
                        {i === 0 && <span className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded">Main</span>}
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 8 && (
                      <button type="button" onClick={() => document.getElementById('imageInput')?.click()}
                        className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition">
                        <Plus className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Pricing & Stock */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">Pricing & Inventory</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Original Price (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input {...register('price', { required: 'Required', min: 0.01 })} type="number" step="0.01" placeholder="0.00" className={`${inputClass} pl-7`} />
                    </div>
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Sale Price (optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input {...register('salePrice')} type="number" step="0.01" placeholder="0.00" className={`${inputClass} pl-7`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Stock Quantity *</label>
                    <input {...register('stock', { required: 'Required', min: 0 })} type="number" placeholder="0" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>SKU</label>
                    <input {...register('sku')} placeholder="e.g. WH-1000XM5-BLK" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: SEO & Details */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">SEO Settings</h2>
                  <button type="button" onClick={generateWithAI} disabled={generatingAI || !watchName}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-orange-400 text-white text-sm font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50">
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Re-generate with AI
                  </button>
                </div>
                <div>
                  <label className={labelClass}>SEO Title</label>
                  <input {...register('seoTitle')} placeholder="SEO-optimized title for search engines" className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1">Recommended: 50-60 characters</p>
                </div>
                <div>
                  <label className={labelClass}>SEO Description</label>
                  <textarea {...register('seoDescription')} rows={3} placeholder="SEO meta description…" className={`${inputClass} resize-none`} />
                  <p className="text-xs text-gray-400 mt-1">Recommended: 150-160 characters</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="btn-outline disabled:opacity-40">← Previous</button>
            <div className="flex gap-3">
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary">Next →</button>
              ) : (
                <button type="submit" disabled={submitting || uploading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  {(submitting || uploading) ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploading ? 'Uploading…' : 'Publishing…'}</> : '🚀 Publish Product'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
