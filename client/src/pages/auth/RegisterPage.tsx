import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useGoogleLogin } from '@react-oauth/google';
import { register as registerUser } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import api from '../../services/api';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const RegisterPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch('password', '');
  const strengthChecks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Contains number', pass: /[0-9]/.test(password) },
    { label: 'Contains special char', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = strengthChecks.filter((c) => c.pass).length;

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json() as { sub: string; email: string; name: string; picture?: string };
        const { data: res } = await api.post('/auth/google', {
          token: tokenResponse.access_token,
          sub: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        });
        dispatch({ type: 'auth/googleAuth/fulfilled', payload: res.data });
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
        toast.success(`Welcome, ${res.data.user.name}! 🎉`);
        navigate('/');
      } catch {
        toast.error('Google sign-up failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => toast.error('Google sign-up was cancelled'),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await dispatch(registerUser({ name: data.name, email: data.email, password: data.password, phone: data.phone })).unwrap();
      toast.success('Account created! Welcome to NexMart! 🎉');
      navigate('/');
    } catch (err: unknown) {
      const error = err as string;
      toast.error(error || 'Registration failed');
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 nexmart-gradient rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-extrabold text-xl">N</span>
            </div>
            <span className="font-extrabold text-2xl text-primary-500">
              Nex<span className="text-gray-900 dark:text-white">Mart</span>
            </span>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Join millions of happy shoppers</p>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Create Account</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input {...register('name')} className="input-field" placeholder="John Doe" autoComplete="name" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone (optional)</label>
                <input {...register('phone')} className="input-field" placeholder="+1 234 567 8900" autoComplete="tel" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {/* Password strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        strength >= i
                          ? strength <= 1 ? 'bg-red-500' : strength <= 2 ? 'bg-yellow-500' : strength <= 3 ? 'bg-blue-500' : 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {strengthChecks.map((check) => (
                      <div key={check.label} className={`flex items-center gap-1 text-xs ${check.pass ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        <CheckCircleIcon className={`w-3 h-3 ${check.pass ? 'text-green-500' : 'text-gray-300'}`} />
                        {check.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <input
                {...register('confirmPassword')}
                type="password"
                className="input-field"
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-2.5">
              <input {...register('terms')} type="checkbox" id="terms" className="mt-0.5 w-4 h-4 accent-primary-500 cursor-pointer" />
              <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-500 hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-500 hover:underline">Privacy Policy</Link>
              </label>
            </div>
            {errors.terms && <p className="text-red-500 text-xs -mt-2">{errors.terms.message}</p>}

            <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 text-base rounded-xl">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : 'Create Account 🚀'}
            </button>
          </form>

          <div className="my-5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-3 text-gray-400">or sign up with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoogleSignup()}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl py-2.5 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Signing up...' : 'Continue with Google'}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-5">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary-500 font-semibold hover:underline">Log in</Link>
          </p>
        </div>

        <div className="text-center mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
          <SparklesIcon className="w-3.5 h-3.5 text-primary-400" />
          Powered by NexMart AI • 256-bit Encrypted
        </div>
      </motion.div>

    </div>
  );
};

export default RegisterPage;
