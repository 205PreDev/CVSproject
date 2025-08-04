import React, { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import DatabaseService from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal } from '../../components/ui';

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

const OrderManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStoreAndOrders = async () => {
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
        setStoreId(ownerStore.id);

        const fetchedOrders = await DatabaseService.getOrdersByStoreId(ownerStore.id);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndOrders();
  }, [user]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    if (!storeId) return;
    try {
      await DatabaseService.update('orders', orderId, { status: newStatus });
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError('Failed to update order status.');
    }
  };

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto p-4">
          <p>주문 목록을 불러오는 중...</p>
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
        <h1 className="text-2xl font-bold mb-6">주문 관리</h1>

        {orders.length === 0 ? (
          <p>아직 접수된 주문이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
              <Card key={order.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2">주문 번호: {order.order_number}</h2>
                  <p>상태: <span className={`font-medium ${order.status === 'pending' ? 'text-yellow-600' : order.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>{order.status}</span></p>
                  <p>총액: {order.final_amount.toLocaleString()}원</p>
                  <p>주문 시간: {new Date(order.created_at).toLocaleString()}</p>
                  <p>주문 타입: {order.order_type === 'pickup' ? '픽업' : '배달'}</p>
                </div>
                <div className="mt-4 flex flex-col space-y-2">
                  <Button onClick={() => openModal(order)} variant="secondary">
                    상세 보기
                  </Button>
                  {order.status === 'pending' && (
                    <Button onClick={() => handleStatusChange(order.id, 'confirmed')}>
                      주문 접수
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button onClick={() => handleStatusChange(order.id, 'preparing')}>
                      준비 중으로 변경
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button onClick={() => handleStatusChange(order.id, 'ready')}>
                      준비 완료로 변경
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button onClick={() => handleStatusChange(order.id, 'completed')}>
                      완료 처리
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedOrder && (
          <Modal isOpen={isModalOpen} onClose={closeModal} title={`주문 상세: ${selectedOrder.order_number}`}>
            <p><strong>주문 번호:</strong> {selectedOrder.order_number}</p>
            <p><strong>상태:</strong> {selectedOrder.status}</p>
            <p><strong>총액:</strong> {selectedOrder.final_amount.toLocaleString()}원</p>
            <p><strong>주문 시간:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
            <p><strong>주문 타입:</strong> {selectedOrder.order_type === 'pickup' ? '픽업' : '배달'}</p>
            <h3 className="text-lg font-semibold mt-4 mb-2">주문 상품:</h3>
            <ul>
              {selectedOrder.order_items.map(item => (
                <li key={item.product_id}>- {item.products.name} ({item.quantity}개)</li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end space-x-2">
              {selectedOrder.status === 'pending' && (
                <Button onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}>
                  주문 접수
                </Button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <Button onClick={() => handleStatusChange(selectedOrder.id, 'preparing')}>
                  준비 중으로 변경
                </Button>
              )}
              {selectedOrder.status === 'preparing' && (
                <Button onClick={() => handleStatusChange(selectedOrder.id, 'ready')}>
                  준비 완료로 변경
                </Button>
              )}
              {selectedOrder.status === 'ready' && (
                <Button onClick={() => handleStatusChange(selectedOrder.id, 'completed')}>
                  완료 처리
                </Button>
              )}
              <Button onClick={closeModal} variant="secondary">닫기</Button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default OrderManagementPage;
