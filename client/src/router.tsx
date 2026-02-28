import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';

// Layout
const Layout = lazy(() => import('./components/common/Layout'));

// Pages - Lazy loaded for performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const FlashSalePage = lazy(() => import('./pages/FlashSalePage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));

// Auth
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Buyer
const ProfilePage = lazy(() => import('./pages/buyer/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/buyer/OrdersPage'));
const WishlistPage = lazy(() => import('./pages/buyer/WishlistPage'));
const ChatPage = lazy(() => import('./pages/buyer/ChatPage'));
const VouchersPage = lazy(() => import('./pages/buyer/VouchersPage'));

// Seller
const SellerLayout = lazy(() => import('./pages/seller/SellerLayout'));
const SellerDashboardPage = lazy(() => import('./pages/seller/SellerDashboardPage'));
const SellerProductsPage = lazy(() => import('./pages/seller/SellerProductsPage'));
const AddProductPage = lazy(() => import('./pages/seller/AddProductPage'));
const SellerOrdersPage = lazy(() => import('./pages/seller/SellerOrdersPage'));
const SellerAnalyticsPage = lazy(() => import('./pages/seller/SellerAnalyticsPage'));
const SellerShippingPage = lazy(() => import('./pages/seller/SellerShippingPage'));
const SellerSettingsPage = lazy(() => import('./pages/seller/SellerSettingsPage'));

// Admin
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminShopsPage = lazy(() => import('./pages/admin/AdminShopsPage'));

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 nexmart-gradient rounded-2xl flex items-center justify-center animate-bounce">
        <span className="text-white font-extrabold text-xl">N</span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Layout />
      </Suspense>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><HomePage /></Suspense> },
      { path: 'search', element: <Suspense fallback={<PageLoader />}><SearchPage /></Suspense> },
      { path: 'product/:slug', element: <Suspense fallback={<PageLoader />}><ProductPage /></Suspense> },
      { path: 'category/:slug', element: <Suspense fallback={<PageLoader />}><CategoryPage /></Suspense> },
      { path: 'flash-sale', element: <Suspense fallback={<PageLoader />}><FlashSalePage /></Suspense> },
      { path: 'shop/:id', element: <Suspense fallback={<PageLoader />}><ShopPage /></Suspense> },
      { path: 'cart', element: <ProtectedRoute><Suspense fallback={<PageLoader />}><CartPage /></Suspense></ProtectedRoute> },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}><CheckoutPage /></Suspense>
          </ProtectedRoute>
        ),
      },
      { path: 'order-success/:id', element: <Suspense fallback={<PageLoader />}><OrderSuccessPage /></Suspense> },
      {
        path: 'profile',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><ProfilePage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'orders',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><OrdersPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'wishlist',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><WishlistPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'chat',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><ChatPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'vouchers',
        element: <ProtectedRoute><Suspense fallback={<PageLoader />}><VouchersPage /></Suspense></ProtectedRoute>,
      },
      {
        path: 'auth/login',
        element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>,
      },
      {
        path: 'auth/register',
        element: <Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>,
      },
    ],
  },
  {
    path: '/seller',
    element: (
      <ProtectedRoute roles={['SELLER', 'ADMIN']}>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <SellerLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={null}><SellerDashboardPage /></Suspense> },
      { path: 'dashboard', element: <Suspense fallback={null}><SellerDashboardPage /></Suspense> },
      { path: 'products', element: <Suspense fallback={null}><SellerProductsPage /></Suspense> },
      { path: 'add-product', element: <Suspense fallback={null}><AddProductPage /></Suspense> },
      { path: 'orders', element: <Suspense fallback={null}><SellerOrdersPage /></Suspense> },
      { path: 'shipping', element: <Suspense fallback={null}><SellerShippingPage /></Suspense> },
      { path: 'analytics', element: <Suspense fallback={null}><SellerAnalyticsPage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={null}><SellerSettingsPage /></Suspense> },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['ADMIN']}>
        <Suspense fallback={<PageLoader />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense> },
      { path: 'users', element: <Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense> },
      { path: 'products', element: <Suspense fallback={<PageLoader />}><AdminProductsPage /></Suspense> },
      { path: 'orders', element: <Suspense fallback={<PageLoader />}><AdminOrdersPage /></Suspense> },
      { path: 'shops', element: <Suspense fallback={<PageLoader />}><AdminShopsPage /></Suspense> },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-700 dark:text-gray-200">
        <div className="text-8xl">🔍</div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-gray-400">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-primary px-6 py-2.5 rounded-xl">Go Home</a>
      </div>
    ),
  },
]);

export { router };
