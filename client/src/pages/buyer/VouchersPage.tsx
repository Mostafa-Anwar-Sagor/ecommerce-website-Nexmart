import { useState } from 'react';
import { Tag, Copy, CheckCircle, Calendar, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEMO_VOUCHERS = [
  { code: 'WELCOME10', type: 'PERCENTAGE', discount: 10, minOrder: 0, expiry: '2025-12-31', description: '10% off your first order' },
  { code: 'SAVE5', type: 'FIXED', discount: 5, minOrder: 30, expiry: '2025-12-31', description: '$5 off orders above $30' },
  { code: 'NEXMART20', type: 'PERCENTAGE', discount: 20, minOrder: 50, expiry: '2025-09-30', description: '20% off orders above $50' },
  { code: 'FREESHIP', type: 'FREE_SHIPPING', discount: 0, minOrder: 20, expiry: '2025-12-31', description: 'Free shipping on orders above $20' },
];

export default function VouchersPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><Tag className="w-6 h-6 text-primary" /> My Vouchers</h1>
        <p className="text-gray-500 text-sm mb-6">Copy a voucher code and apply it at checkout</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_VOUCHERS.map(v => (
            <div key={v.code} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-dashed border-primary/30 hover:shadow-md transition-shadow">
              {/* Top colored band */}
              <div className="nexmart-gradient px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-2xl">
                    {v.type === 'PERCENTAGE' ? `${v.discount}%` : v.type === 'FIXED' ? `$${v.discount}` : 'FREE'}
                  </span>
                  <Tag className="w-6 h-6 text-white/60" />
                </div>
                <p className="text-white/80 text-sm mt-1">{v.type === 'FREE_SHIPPING' ? 'Free Shipping' : 'Discount'}</p>
              </div>

              {/* Divider with circles */}
              <div className="relative border-t border-dashed border-primary/30">
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 dark:bg-gray-900 rounded-full" />
              </div>

              {/* Bottom content */}
              <div className="px-5 py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{v.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  {v.minOrder > 0 && (
                    <span className="flex items-center gap-1"><ShoppingBag className="w-3.5 h-3.5" /> Min. ${v.minOrder}</span>
                  )}
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Exp. {v.expiry}</span>
                </div>
                <button onClick={() => copyCode(v.code)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono font-semibold text-sm transition-all ${copied === v.code ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                  {copied === v.code ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> {v.code}</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
