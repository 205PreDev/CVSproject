import React, { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import DatabaseService from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Order {
  id: string;
  store_id: string;
  final_amount: number;
  created_at: string;
}

interface Store {
  id: string;
  name: string;
  // ... other store properties
}

const SalesAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!user || !user.id) {
        setError('User not logged in or user ID not available.');
        setLoading(false);
        return;
      }

      try {
        const ownerStore = await DatabaseService.getStoreByOwnerId(user.id);
        if (!ownerStore) {
          setError('No store found for this owner.');
          setLoading(false);
          return;
        }
        setStore(ownerStore);

        const fetchedOrders = await DatabaseService.getOrdersByStoreId(ownerStore.id);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to fetch sales data:', err);
        setError('Failed to load sales data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [user]);

  const aggregateSalesData = () => {
    const salesData: { [key: string]: number } = {};

    orders.forEach(order => {
      const date = new Date(order.created_at);
      let key: string;

      if (timeframe === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (timeframe === 'weekly') {
        const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
        key = startOfWeek.toISOString().split('T')[0]; // Start of week (Sunday)
      } else {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
      }

      salesData[key] = (salesData[key] || 0) + order.final_amount;
    });

    const sortedKeys = Object.keys(salesData).sort();
    const labels = sortedKeys;
    const data = sortedKeys.map(key => salesData[key]);

    return { labels, data };
  };

  const { labels, data } = aggregateSalesData();

  const chartData = {
    labels,
    datasets: [
      {
        label: '매출',
        data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${timeframe === 'daily' ? '일별' : timeframe === 'weekly' ? '주별' : '월별'} 매출 분석`,
      },
    },
  };

  if (loading) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto p-4">
          <p>매출 데이터를 불러오는 중...</p>
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

  return (
    <Layout userRole="owner">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">매출 분석 - {store?.name}</h1>

        <div className="mb-4">
          <label htmlFor="timeframe-select" className="block text-sm font-medium text-gray-700">시간 단위:</label>
          <select
            id="timeframe-select"
            name="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="daily">일별</option>
            <option value="weekly">주별</option>
            <option value="monthly">월별</option>
          </select>
        </div>

        <Card className="p-4 mb-6">
          <h2 className="text-xl font-bold mb-4">매출 차트</h2>
          {orders.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <p>표시할 매출 데이터가 없습니다.</p>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-xl font-bold mb-4">매출 통계</h2>
          <p>총 매출: {orders.reduce((sum, order) => sum + order.final_amount, 0).toLocaleString()}원</p>
          <p>총 주문 건수: {orders.length}건</p>
          {/* 추가적인 통계 정보 (예: 평균 주문 금액 등) */}
        </Card>
      </div>
    </Layout>
  );
};

export default SalesAnalysisPage;
