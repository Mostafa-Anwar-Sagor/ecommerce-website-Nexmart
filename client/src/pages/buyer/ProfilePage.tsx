import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Camera, Save } from 'lucide-react';
import { authService } from '../../services/authService';
import { updateProfile } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { name: user?.name, phone: user?.phone || '' } });

  const onSubmit = async (data: { name?: string; phone: string }) => {
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ name: data.name || '', phone: data.phone });
      dispatch(updateProfile(updated));
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&size=80`}
                alt={user?.name} className="w-20 h-20 rounded-full object-cover border-4 border-primary/20" />
              <button className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-primary/90 transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">{user?.role?.toLowerCase()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('name')} className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={user?.email} readOnly className="input-field pl-10 opacity-60 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('phone')} className="input-field pl-10" placeholder="Phone number" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </form>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Orders', value: '0' },
            { label: 'Reviews', value: '0' },
            { label: 'Loyalty Points', value: (user as any)?.loyaltyPoints || '0' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
