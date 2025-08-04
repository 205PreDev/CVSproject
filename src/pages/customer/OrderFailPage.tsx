import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PaymentService } from '../../services/payment';
import { Layout } from '../../components/common';

export const OrderFailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  useEffect(() => {
    const saveFailure = async () => {
      if (!orderId) {
        console.error('Missing order ID for payment failure.');
        return;
      }
      try {
        await PaymentService.savePaymentFailure(orderId, code || 'UNKNOWN', message || '결제 실패');
        console.log('Payment failure saved successfully.');
      } catch (error) {
        console.error('Error saving payment failure:', error);
      }
    };
    saveFailure();
  }, [orderId, code, message]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-red-600 mb-4">결제 실패!</h1>
          <p className="text-gray-700 mb-2">결제 과정에서 오류가 발생했습니다.</p>
          {message && <p className="text-gray-600 mb-2">오류 메시지: {message}</p>}
          {code && <p className="text-gray-600 mb-4">오류 코드: {code}</p>}
          <Link to="/customer/cart" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md">
            장바구니로 돌아가기
          </Link>
        </div>
      </div>
    </Layout>
  );
};
