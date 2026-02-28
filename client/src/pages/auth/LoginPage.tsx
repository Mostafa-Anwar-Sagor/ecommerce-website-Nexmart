import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useGoogleLogin } from '@react-oauth/google';
import { login, logout } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import toast from 'react-hot-toast';
import api from '../../services/api';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Clear any stale/expired tokens whenever login page is visited
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Check if JWT is expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          dispatch(logout());
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      } catch {
        // malformed token — clear it
        dispatch(logout());
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await dispatch(login(data)).unwrap();
      toast.success('Welcome back! 👋');
      // Redirect based on role
      if (result.user?.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (result.user?.role === 'SELLER') {
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate(from === '/auth/login' ? '/' : from, { replace: true });
      }
    } catch (err: unknown) {
      const msg = (err as string) || 'Login failed. Please check your credentials.';
      toast.error(msg);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
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
        toast.success(`Welcome back, ${res.data.user.name}! 👋`);
        navigate(from, { replace: true });
      } catch {
        toast.error('Google login failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => toast.error('Google login was cancelled'),
  });

  return (
    <div className="flex-1 bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 nexmart-gradient rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-extrabold text-xl">N</span>
            </div>
            <span className="font-extrabold text-2xl text-primary-500">
              Nex<span className="text-gray-900 dark:text-white">Mart</span>
            </span>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">AI-Powered Shopping Platform</p>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Welcome Back!
          </h1>

          {/* Demo credentials */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-5 text-xs">
            <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2 text-sm">🎯 Demo Credentials — click to fill</p>
            <div className="space-y-1.5">
              {[
                { role: 'Admin', email: 'admin@nexmart.com', pass: 'Admin@123456' },
                { role: 'Buyer', email: 'buyer@nexmart.com', pass: 'Buyer@123456' },
              ].map(({ role, email, pass }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setValue('email', email); setValue('password', pass); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <span className="font-semibold text-blue-700 dark:text-blue-400">{role}: </span>
                  <span className="text-blue-600 dark:text-blue-300">{email}</span>
                  <span className="text-blue-400 dark:text-blue-500"> / {pass}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-primary-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base rounded-xl mt-2 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Logging in...
                </span>
              ) : 'Login'}
            </button>
          </form>

          <div className="my-5 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-3 text-gray-400">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl py-2.5 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Signing in with Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-primary-500 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>

        <div className="text-center mt-4 flex items-center justify-center gap-1 text-xs text-gray-400">
          <SparklesIcon className="w-3.5 h-3.5 text-primary-400" />
          Powered by NexMart AI • Secure & Encrypted
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
