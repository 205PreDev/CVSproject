import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/database';
import { Layout } from '../../components/common';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: Product; // Joined product data
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setIsLoading(false);
        setError('User not logged in.');
        return;
      }

      try {
        setIsLoading(true);
        const customerOrders = await DatabaseService.getOrdersByCustomerId(user.id);
        setOrders(customerOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">주문 내역</h1>
        {isLoading && <p>로딩 중...</p>}
        {error && <p className="text-red-500">에러: {error}</p>}
        {!isLoading && !error && (
          <div>
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-6 shadow-md mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">주문 번호: {order.order_number}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">주문일: {new Date(order.created_at).toLocaleString()}</p>
                  <p className="text-gray-600 mb-2">총 금액: {order.total_amount.toLocaleString()}원</p>
                  {order.discount_amount > 0 && (
                    <p className="text-green-600 mb-2">할인 금액: -{order.discount_amount.toLocaleString()}원</p>
                  )}
                  <p className="text-lg font-bold mb-4">최종 결제 금액: {order.final_amount.toLocaleString()}원</p>

                  <h3 className="text-lg font-semibold mb-2">주문 상품:</h3>
                  <ul className="list-disc pl-5">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="text-gray-700">
                        {item.products.name} ({item.quantity}개) - {item.total_price.toLocaleString()}원
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">주문 내역이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
