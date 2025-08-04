import { loadTossPayments } from '@tosspayments/payment-sdk';
import { supabase } from './supabase';

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_your_test_key';

interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
}

export class PaymentService {
  private static tossPayments: ReturnType<typeof loadTossPayments> | null = null;

  private static async getTossPaymentsInstance() {
    if (!PaymentService.tossPayments) {
      PaymentService.tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
    }
    return PaymentService.tossPayments;
  }

  static async requestPayment(paymentRequest: PaymentRequest) {
    const tossPayments = await PaymentService.getTossPaymentsInstance();
    if (!tossPayments) {
      throw new Error('Toss Payments SDK is not loaded.');
    }

    try {
      await tossPayments.requestPayment('카드', {
        amount: paymentRequest.amount,
        orderId: paymentRequest.orderId,
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName,
        customerEmail: paymentRequest.customerEmail,
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl,
      });
    } catch (error) {
      console.error('Toss Payments request failed:', error);
      throw error;
    }
  }

  static async savePaymentSuccess(orderId: string, paymentKey: string, amount: number, method: string) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        payment_key: paymentKey,
        amount: amount,
        method: method,
        status: 'completed',
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save payment success: ${error.message}`);
    }
    return data;
  }

  static async savePaymentFailure(orderId: string, errorCode: string, errorMessage: string) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        payment_key: 'N/A', // 실패 시에는 결제 키가 없을 수 있음
        amount: 0, // 실패 시 금액은 0으로 처리
        method: 'N/A',
        status: 'failed',
        failure_reason: `${errorCode}: ${errorMessage}`,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save payment failure: ${error.message}`);
    }
    return data;
  }
}
