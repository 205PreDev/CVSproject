import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { LogoutButton } from '../auth';
import { Badge } from '../ui/Badge';
import { ShoppingCart } from 'lucide-react'; // 아이콘 임포트

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'customer': return '고객';
      case 'owner': return '점주';
      case 'admin': return '관리자';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'customer': return 'default' as const;
      case 'owner': return 'success' as const;
      case 'admin': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 및 제목 */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">GS</span>
              </div>
              <span className="text-xl font-bold text-gray-900">우리동네 GS</span>
            </Link>
            {title && (
              <>
                <div className="mx-4 h-6 w-px bg-gray-300" />
                <h1 className="text-lg font-medium text-gray-900">{title}</h1>
              </>
            )}
          </div>

          {/* 사용자 정보 및 메뉴 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {user.role === 'customer' && (
                  <Link to="/customer/cart" className="relative p-2 hover:bg-gray-100 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-gray-600" />
                    {itemCount > 0 && (
                      <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  <span className="text-sm text-gray-700">{user.name}</span>
                </div>
                <LogoutButton variant="outline" size="sm" />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/auth/login"
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  로그인
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header