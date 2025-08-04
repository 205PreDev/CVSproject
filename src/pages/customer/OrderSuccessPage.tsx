import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PaymentService } from '../../services/payment';
import { DatabaseService } from '../../services/database';
import { useCart } from '../../context/CartContext';
import { Layout } from '../../components/common';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');
  const { clearCart } = useCart();

  useEffect(() => {
    const confirmPayment = async () => {
      if (!orderId || !paymentKey || !amount) {
        console.error('Missing payment parameters.');
        return;
      }

      try {
        // 1. Toss Payments 서버에 결제 승인 요청 (백엔드에서 처리하는 것이 더 안전)
        // 여기서는 프론트엔드에서 직접 처리하는 것으로 가정 (보안상 권장되지 않음)
        // 실제 서비스에서는 백엔드에서 Toss Payments API를 호출하여 결제 승인 및 검증을 해야 합니다.

        // 2. Supabase에 결제 성공 정보 저장
        await PaymentService.savePaymentSuccess(orderId, paymentKey, parseFloat(amount), '카드');

        // 3. 주문 상태를 'confirmed'로 업데이트
        await DatabaseService.update('orders', orderId, { status: 'confirmed' });

        // 4. 장바구니 비우기
        clearCart();

        console.log('Payment confirmed and order updated successfully!');
      } catch (error) {
        console.error('Error confirming payment or updating order:', error);
        // 실패 시 처리 (예: 사용자에게 알림, 재시도 버튼 등)
      }
    };

    confirmPayment();
  }, [orderId, paymentKey, amount, clearCart]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-green-600 mb-4">결제 성공!</h1>
          <p className="text-gray-700 mb-2">주문이 성공적으로 완료되었습니다.</p>
          <p className="text-gray-600 mb-4">주문 번호: {orderId}</p>
          <Link to="/customer/orders" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md">
            주문 내역 확인
          </Link>
        </div>
      </div>
    </Layout>
  );
};
