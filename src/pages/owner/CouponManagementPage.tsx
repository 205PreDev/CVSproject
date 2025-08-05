import React, { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import DatabaseService from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Modal } from '../../components/ui';

interface Coupon {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface Store {
  id: string;
  name: string;
  // ... other store properties
}

const CouponManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon> | null>(null);

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
        setStore(ownerStore);

        const fetchedCoupons = await DatabaseService.getAvailableCoupons(ownerStore.id);
        setCoupons(fetchedCoupons);
      } catch (err) {
        console.error('Failed to fetch coupons:', err);
        setError('Failed to load coupons data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const openModal = (coupon?: Coupon) => {
    setCurrentCoupon(coupon || null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCoupon(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setCurrentCoupon(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !currentCoupon) return;

    try {
      if (currentCoupon.id) {
        // Update existing coupon
        await DatabaseService.updateCoupon(currentCoupon.id, {
          ...currentCoupon,
          valid_from: currentCoupon.valid_from ? new Date(currentCoupon.valid_from).toISOString() : undefined,
          valid_until: currentCoupon.valid_until ? new Date(currentCoupon.valid_until).toISOString() : undefined,
        });
      } else {
        // Create new coupon
        await DatabaseService.createCoupon({
          ...currentCoupon,
          store_id: store.id,
          valid_from: currentCoupon.valid_from ? new Date(currentCoupon.valid_from).toISOString() : undefined,
          valid_until: currentCoupon.valid_until ? new Date(currentCoupon.valid_until).toISOString() : undefined,
        });
      }
      closeModal();
      // Refresh list
      const updatedCoupons = await DatabaseService.getAvailableCoupons(store.id);
      setCoupons(updatedCoupons);
    } catch (err) {
      console.error('Failed to save coupon:', err);
      setError('Failed to save coupon.');
    }
  };

  const handleDelete = async (couponId: string) => {
    if (window.confirm('정말로 이 쿠폰을 삭제하시겠습니까?')) {
      try {
        await DatabaseService.deleteCoupon(couponId);
        const updatedCoupons = await DatabaseService.getAvailableCoupons(store!.id); // storeId is guaranteed to be not null here
        setCoupons(updatedCoupons);
      } catch (err) {
        console.error('Failed to delete coupon:', err);
        setError('Failed to delete coupon.');
      }
    }
  };

  if (loading) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto p-4">
          <p>쿠폰 목록을 불러오는 중...</p>
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
        <h1 className="text-2xl font-bold mb-6">쿠폰 관리 - {store?.name}</h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => openModal()}>새 쿠폰 생성</Button>
        </div>

        {coupons.length === 0 ? (
          <p>등록된 쿠폰이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(coupon => (
              <Card key={coupon.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2">{coupon.name}</h2>
                  <p>할인 타입: {coupon.discount_type === 'percentage' ? '비율' : '정액'}</p>
                  <p>할인 값: {coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : '원'}</p>
                  <p>최소 주문 금액: {coupon.min_order_amount.toLocaleString()}원</p>
                  {coupon.max_discount_amount && <p>최대 할인 금액: {coupon.max_discount_amount.toLocaleString()}원</p>}
                  <p>유효 기간: {new Date(coupon.valid_from).toLocaleDateString()} ~ {new Date(coupon.valid_until).toLocaleDateString()}</p>
                  <p>사용 횟수: {coupon.used_count} / {coupon.usage_limit || '무제한'}</p>
                  <p>활성화: {coupon.is_active ? '예' : '아니오'}</p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button onClick={() => openModal(coupon)} variant="secondary">수정</Button>
                  <Button onClick={() => handleDelete(coupon.id)} variant="danger">삭제</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={closeModal} title={currentCoupon?.id ? '쿠폰 수정' : '새 쿠폰 생성'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">쿠폰명</label>
                <Input type="text" id="name" name="name" value={currentCoupon?.name || ''} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={currentCoupon?.description || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                ></textarea>
              </div>
              <div>
                <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700">할인 타입</label>
                <select
                  id="discount_type"
                  name="discount_type"
                  value={currentCoupon?.discount_type || 'fixed'}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  required
                >
                  <option value="fixed">정액</option>
                  <option value="percentage">비율</option>
                </select>
              </div>
              <div>
                <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700">할인 값</label>
                <Input type="number" id="discount_value" name="discount_value" value={currentCoupon?.discount_value || 0} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="min_order_amount" className="block text-sm font-medium text-gray-700">최소 주문 금액</label>
                <Input type="number" id="min_order_amount" name="min_order_amount" value={currentCoupon?.min_order_amount || 0} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="max_discount_amount" className="block text-sm font-medium text-gray-700">최대 할인 금액</label>
                <Input type="number" id="max_discount_amount" name="max_discount_amount" value={currentCoupon?.max_discount_amount || ''} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700">유효 시작일</label>
                <Input type="date" id="valid_from" name="valid_from" value={currentCoupon?.valid_from ? new Date(currentCoupon.valid_from).toISOString().split('T')[0] : ''} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700">유효 종료일</label>
                <Input type="date" id="valid_until" name="valid_until" value={currentCoupon?.valid_until ? new Date(currentCoupon.valid_until).toISOString().split('T')[0] : ''} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700">사용 제한 횟수</label>
                <Input type="number" id="usage_limit" name="usage_limit" value={currentCoupon?.usage_limit || ''} onChange={handleChange} />
              </div>
              <div className="flex items-center">
                <Input type="checkbox" id="is_active" name="is_active" checked={currentCoupon?.is_active || false} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">활성화</label>
              </div>
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

export default CouponManagementPage;
