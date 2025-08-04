import React, { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import DatabaseService from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui';

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
  };
}

interface Order {
  id: string;
  customer_id: string;
  store_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  order_type: 'pickup' | 'delivery';
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

interface Store {
  id: string;
  name: string;
  // ... other store properties
}

const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.id) {
        setError('User not logged in or user ID not available.');
        setLoading(false);
        return;
      }

      try {
        // 1. 점주가 관리하는 편의점 정보 가져오기
        const ownerStore = await DatabaseService.getStoreByOwnerId(user.id);
        if (!ownerStore) {
          setError('No store found for this owner.');
          setLoading(false);
          return;
        }
        setStore(ownerStore);

        // 2. 해당 편의점의 주문 목록 가져오기
        const storeOrders = await DatabaseService.getOrdersByStoreId(ownerStore.id);
        setOrders(storeOrders);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto p-4">
          <p>대시보드 데이터를 불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto p-4">
          <p className="text-red-500">오류: {error}</p>
        </div>
      </Layout>
    );
  }

  // KPI 계산
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.final_amount, 0);

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(order => order.created_at.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.final_amount, 0);

  const orderStatusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<Order['status'], number>);

  return (
    <Layout userRole="owner">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">점주 대시보드 - {store?.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold">총 주문 건수</h2>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold">총 매출</h2>
            <p className="text-3xl font-bold">{totalRevenue.toLocaleString()}원</p>
          </Card>
          <Card className="p-4">
            <h2 className="text-lg font-semibold">오늘의 매출</h2>
            <p className="text-3xl font-bold">{todayRevenue.toLocaleString()}원</p>
          </Card>
        </div>

        <h2 className="text-xl font-bold mb-4">주문 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(orderStatusCounts).map(([status, count]) => (
            <Card key={status} className="p-4">
              <h3 className="text-md font-semibold capitalize">{status}</h3>
              <p className="text-2xl font-bold">{count}</p>
            </Card>
          ))}
        </div>

        {/* TODO: 실시간 주문 목록, 차트 등 추가 */}
      </div>
    </Layout>
  );
};

export default OwnerDashboardPage;
