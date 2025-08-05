import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth Pages
import { LoginPage, RegisterPage, UnauthorizedPage } from './pages/auth';

// Customer Pages
import { StoreListPage } from './pages/customer/StoreListPage';
import { StoreDetailPage } from './pages/customer/StoreDetailPage';
import { CartPage } from './pages/customer/CartPage';
import { OrderSuccessPage } from './pages/customer/OrderSuccessPage';
import { OrderFailPage } from './pages/customer/OrderFailPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import ProfilePage from './pages/customer/ProfilePage';

// Owner Pages
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import OrderManagementPage from './pages/owner/OrderManagementPage';
import ProductInventoryManagementPage from './pages/owner/ProductInventoryManagementPage';
import PurchaseRequestManagementPage from './pages/owner/PurchaseRequestManagementPage';
import SalesAnalysisPage from './pages/owner/SalesAnalysisPage';
import CouponManagementPage from './pages/owner/CouponManagementPage';

// Components
import { ProtectedRoute } from './components/auth';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import StoreManagementPage from './pages/admin/StoreManagementPage';
import NoticeManagementPage from './pages/admin/NoticeManagementPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/register" element={<Navigate to="/auth/register" replace />} />
      
      {/* Unauthorized Route */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Customer Routes */}
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Routes>
              <Route path="/stores" element={<StoreListPage />} />
              <Route path="/stores/:id" element={<StoreDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/order-fail" element={<OrderFailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route index element={<Navigate to="/customer/stores" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/owner/*"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <Routes>
              <Route index element={<OwnerDashboardPage />} />
              <Route path="/orders" element={<OrderManagementPage />} />
              <Route path="/products" element={<ProductInventoryManagementPage />} />
              <Route path="/purchase-requests" element={<PurchaseRequestManagementPage />} />
              <Route path="/analytics" element={<SalesAnalysisPage />} />
              <Route path="/coupons" element={<CouponManagementPage />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Routes>
              <Route index element={<AdminDashboardPage />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="/stores" element={<StoreManagementPage />} />
              <Route path="/notices" element={<NoticeManagementPage />} />
              <Route path="/settings" element={<SystemSettingsPage />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Default Redirects */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                user.role === 'customer'
                  ? '/customer'
                  : user.role === 'owner'
                  ? '/owner'
                  : '/admin'
              }
              replace
            />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />

      {/* 404 Page */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-4">페이지를 찾을 수 없습니다.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default Router;