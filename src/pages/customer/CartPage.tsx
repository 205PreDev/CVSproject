import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { DatabaseService } from '../../services/database';
import { PaymentService } from '../../services/payment';
import { Layout } from '../../components/common';
import { Link, useNavigate } from 'react-router-dom';
import { CouponSelector } from '../../components/customer/CouponSelector';

interface Coupon {
  id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
}

export const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, itemCount, totalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        // TODO: 현재는 첫 번째 상품의 store_id를 사용. 장바구니에 여러 가게 상품이 담길 경우 로직 개선 필요
        const storeId = cartItems.length > 0 ? cartItems[0].store_id : undefined;
        const coupons = await DatabaseService.getAvailableCoupons(storeId);
        setAvailableCoupons(coupons);
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
      }
    };
    fetchCoupons();
  }, [cartItems]);

  const selectedCoupon = useMemo(() => {
    return availableCoupons.find(coupon => coupon.id === selectedCouponId);
  }, [availableCoupons, selectedCouponId]);

  const discountAmount = useMemo(() => {
    if (!selectedCoupon) return 0;

    let discount = 0;
    if (selectedCoupon.min_order_amount && totalAmount < selectedCoupon.min_order_amount) {
      return 0; // 최소 주문 금액 미달
    }

    if (selectedCoupon.discount_type === 'percentage') {
      discount = totalAmount * (selectedCoupon.discount_value / 100);
    } else if (selectedCoupon.discount_type === 'fixed') {
      discount = selectedCoupon.discount_value;
    }

    if (selectedCoupon.max_discount_amount && discount > selectedCoupon.max_discount_amount) {
      discount = selectedCoupon.max_discount_amount;
    }

    return Math.floor(discount);
  }, [totalAmount, selectedCoupon]);

  const finalAmount = totalAmount - discountAmount;

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) {
      alert('주문 처리 중 오류가 발생했습니다. 로그인 상태와 장바구니를 확인해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      const storeId = cartItems[0]?.store_id; 
      if (!storeId) {
        throw new Error('상품에 가게 정보가 없습니다.');
      }

      const orderItems = cartItems.map(item => ({ 
        product_id: item.id, 
        quantity: item.quantity 
      }));

      // 1. 주문 생성 (DB에 orders, order_items 기록)
      const orderResult = await DatabaseService.createOrder(
        user.id, 
        storeId, 
        orderItems, 
        discountAmount, // 할인 금액 전달
        finalAmount // 최종 결제 금액 전달
      );
      const orderId = orderResult.order_id;

      // 2. Toss Payments 결제 요청
      await PaymentService.requestPayment({
        orderId: orderId,
        orderName: `우리동네GS 주문 (${itemCount}개)`,
        amount: finalAmount, // 최종 결제 금액 사용
        customerName: user.name,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/customer/order-success?orderId=${orderId}`, 
        failUrl: `${window.location.origin}/customer/order-fail?orderId=${orderId}`, 
      });

    } catch (error) {
      console.error('Order creation or payment request failed:', error);
      alert(`주문/결제 요청에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">장바구니</h1>
        {cartItems.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-xl text-gray-500 mb-4">장바구니가 비어 있습니다.</p>
            <Link to="/customer/stores" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
              계속 쇼핑하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b py-4">
                  <div>
                    <h2 className="text-lg font-semibold">{item.name}</h2>
                    <p className="text-gray-600">{item.price.toLocaleString()}원</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                      className="w-16 text-center border rounded-md"
                    />
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-1">
              <div className="bg-gray-100 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">주문 요약</h2>
                <div className="flex justify-between mb-2">
                  <span>총 상품 수량:</span>
                  <span>{itemCount}개</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>상품 금액:</span>
                  <span>{totalAmount.toLocaleString()}원</span>
                </div>
                <CouponSelector 
                  coupons={availableCoupons} 
                  selectedCouponId={selectedCouponId} 
                  onSelectCoupon={setSelectedCouponId} 
                />
                <div className="flex justify-between mb-2 text-green-600 font-semibold">
                  <span>할인 금액:</span>
                  <span>-{discountAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t pt-4 mt-4">
                  <span>최종 결제 금액:</span>
                  <span>{finalAmount.toLocaleString()}원</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isProcessing ? '주문 처리 중...' : '결제하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
