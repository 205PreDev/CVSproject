import React from 'react';

// 실제로는 DB에서 카테고리 목록을 가져와야 합니다.
const categories = ['전체', '음료', '과자', '식품', '생활용품'];

interface ProductFilterProps {
  onFilterChange: (category: string) => void;
  selectedCategory: string;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({ onFilterChange, selectedCategory }) => {
  return (
    <div className="flex space-x-2 mb-6">
      {categories.map(category => (
        <button
          key={category}
          onClick={() => onFilterChange(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            selectedCategory === category
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};
