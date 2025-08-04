import React from 'react';

interface Coupon {
  id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
}

interface CouponSelectorProps {
  coupons: Coupon[];
  selectedCouponId: string | null;
  onSelectCoupon: (couponId: string | null) => void;
}

export const CouponSelector: React.FC<CouponSelectorProps> = ({
  coupons,
  selectedCouponId,
  onSelectCoupon,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor="coupon-select" className="block text-sm font-medium text-gray-700 mb-2">
        쿠폰 선택
      </label>
      <select
        id="coupon-select"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        value={selectedCouponId || ''}
        onChange={(e) => onSelectCoupon(e.target.value === '' ? null : e.target.value)}
      >
        <option value="">쿠폰을 선택하세요 (적용 안 함)</option>
        {coupons.map((coupon) => (
          <option key={coupon.id} value={coupon.id}>
            {coupon.name} ({coupon.discount_type === 'percentage' ? `${coupon.discount_value}% 할인` : `${coupon.discount_value.toLocaleString()}원 할인`})
          </option>
        ))}
      </select>
    </div>
  );
};
