import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DatabaseService } from '../../services/database';
import { Layout } from '../../components/common';
import { SearchBar } from '../../components/common/SearchBar';
import { ProductFilter } from '../../components/customer/ProductFilter';
import { useCart } from '../../context/CartContext'; // useCart 훅 임포트

// 타입 정의
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string; // 카테고리 필드 추가
  // ... 기타 product 필드들
}

interface Store {
  id: string;
  name: string;
  address: string;
  description: string;
  // ... 기타 store 필드들
}

export const StoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const { addToCart } = useCart(); // addToCart 함수 가져오기

  useEffect(() => {
    const fetchStoreData = async () => {
      if (!id) {
        setIsLoading(false);
        setError('Store ID not found.');
        return;
      }

      try {
        setIsLoading(true);
        const [storeData, productsData] = await Promise.all([
          DatabaseService.findById<Store>('stores', id),
          DatabaseService.getProductsByStore(id)
        ]);
        
        setStore(storeData);
        setProducts(productsData as Product[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, [id]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // 카테고리 필터링
    if (selectedCategory !== '전체') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // 검색어 필터링
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        {isLoading && <p>로딩 중...</p>}
        {error && <p className="text-red-500">에러: {error}</p>}
        {!isLoading && store && (
          <div>
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h1 className="text-3xl font-bold mb-4">{store.name}</h1>
              <p className="text-lg text-gray-700 mb-2">{store.address}</p>
              <p className="text-gray-600">{store.description || '상점 설명이 없습니다.'}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <SearchBar onSearch={setSearchQuery} placeholder="상품 이름으로 검색" />
            </div>
            <ProductFilter onFilterChange={setSelectedCategory} selectedCategory={selectedCategory} />

            <h2 className="text-2xl font-bold mb-4">상품 목록</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 shadow-sm flex flex-col">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold">{product.name}</h3>
                      <p className="text-gray-800">{product.price.toLocaleString()}원</p>
                      <p className="text-sm text-gray-500">재고: {product.quantity}개</p>
                    </div>
                    <button 
                      onClick={() => addToCart({ ...product, store_id: store.id })}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full"
                      disabled={product.quantity === 0}
                    >
                      {product.quantity > 0 ? '장바구니에 담기' : '품절'}
                    </button>
                  </div>
                ))
              ) : (
                <p>조건에 맞는 상품이 없습니다.</p>
              )}
            </div>
          </div>
        )}
        {!isLoading && !store && !error && (
          <p>해당 편의점을 찾을 수 없습니다.</p>
        )}
      </div>
    </Layout>
  );
};
