import React, { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import { DatabaseService } from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Modal } from '../../components/ui';

interface Product {
  id: string;
  name: string;
}

interface PurchaseRequest {
  id: string;
  store_id: string;
  product_id: string;
  requested_quantity: number;
  current_quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  expected_delivery_date: string | null;
  products: Product; // Joined product data
}

const PurchaseRequestManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Partial<PurchaseRequest> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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

        const fetchedRequests = await DatabaseService.getPurchaseRequestsByStoreId(ownerStore.id);
        setPurchaseRequests(fetchedRequests);

        // Fetch all products to allow selection for new purchase requests
        const allProducts = await DatabaseService.findAll<Product>('products');
        setAvailableProducts(allProducts);

      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const openModal = (request?: PurchaseRequest) => {
    setCurrentRequest(request || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRequest(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentRequest(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !currentRequest) return;

    try {
      if (currentRequest.id) {
        // Update existing request
        await DatabaseService.updatePurchaseRequest(currentRequest.id, currentRequest);
      } else {
        // Create new request
        await DatabaseService.createPurchaseRequest({
          ...currentRequest,
          store_id: storeId,
          status: 'pending', // New requests are pending by default
        });
      }
      closeModal();
      // Refresh list
      const updatedRequests = await DatabaseService.getPurchaseRequestsByStoreId(storeId);
      setPurchaseRequests(updatedRequests);
    } catch (err) {
      console.error('Failed to save purchase request:', err);
      setError('Failed to save purchase request.');
    }
  };

  const handleDelete = async (requestId: string) => {
    if (window.confirm('정말로 이 발주 요청을 삭제하시겠습니까?')) {
      try {
        await DatabaseService.deletePurchaseRequest(requestId);
        const updatedRequests = await DatabaseService.getPurchaseRequestsByStoreId(storeId!); // storeId is guaranteed to be not null here
        setPurchaseRequests(updatedRequests);
      } catch (err) {
        console.error('Failed to delete purchase request:', err);
        setError('Failed to delete purchase request.');
      }
    }
  };

  if (loading) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto p-4">
          <p>발주 요청 목록을 불러오는 중...</p>
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
        <h1 className="text-2xl font-bold mb-6">발주 요청 관리</h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => openModal()}>새 발주 요청</Button>
        </div>

        {purchaseRequests.length === 0 ? (
          <p>아직 등록된 발주 요청이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseRequests.map(request => (
              <Card key={request.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2">{request.products.name}</h2>
                  <p>요청 수량: {request.requested_quantity}</p>
                  <p>현재 재고: {request.current_quantity}</p>
                  <p>상태: <span className={`font-medium ${request.status === 'pending' ? 'text-yellow-600' : request.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{request.status}</span></p>
                  <p>요청일: {new Date(request.requested_at).toLocaleDateString()}</p>
                  {request.expected_delivery_date && <p>예상 입고일: {new Date(request.expected_delivery_date).toLocaleDateString()}</p>}
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button onClick={() => openModal(request)} variant="secondary">수정</Button>
                  <Button onClick={() => handleDelete(request.id)} variant="danger">삭제</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={closeModal} title={currentRequest?.id ? '발주 요청 수정' : '새 발주 요청'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">상품</label>
                <select
                  id="product_id"
                  name="product_id"
                  value={currentRequest?.product_id || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="">상품 선택</option>
                  {availableProducts.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="requested_quantity" className="block text-sm font-medium text-gray-700">요청 수량</label>
                <Input type="number" id="requested_quantity" name="requested_quantity" value={currentRequest?.requested_quantity || 0} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="current_quantity" className="block text-sm font-medium text-gray-700">현재 재고</label>
                <Input type="number" id="current_quantity" name="current_quantity" value={currentRequest?.current_quantity || 0} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">비고</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={currentRequest?.notes || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>
              {currentRequest?.id && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">상태</label>
                  <select
                    id="status"
                    name="status"
                    value={currentRequest?.status || 'pending'}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="pending">대기 중</option>
                    <option value="approved">승인됨</option>
                    <option value="rejected">거절됨</option>
                    <option value="completed">완료됨</option>
                  </select>
                </div>
              )}
              {currentRequest?.id && (
                <div>
                  <label htmlFor="expected_delivery_date" className="block text-sm font-medium text-gray-700">예상 입고일</label>
                  <Input type="date" id="expected_delivery_date" name="expected_delivery_date" value={currentRequest?.expected_delivery_date?.split('T')[0] || ''} onChange={handleChange} />
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <Button type="button" variant="secondary" onClick={closeModal}>취소</Button>
                <Button type="submit">저장</Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default PurchaseRequestManagementPage;
