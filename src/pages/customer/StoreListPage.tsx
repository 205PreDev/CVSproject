import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DatabaseService } from '../../services/database';
import { Layout } from '../../components/common';

// Store 타입을 정의합니다. 실제 데이터 구조에 맞게 확장해야 합니다.
interface Store {
  id: string;
  name: string;
  address: string;
  // ... 기타 store 필드들
}

export const StoreListPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        const data = await DatabaseService.findAll<Store>('stores');
        setStores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">편의점 목록</h1>
        {isLoading && <p>로딩 중...</p>}
        {error && <p className="text-red-500">에러: {error}</p>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.length > 0 ? (
              stores.map((store) => (
                <Link to={`/customer/stores/${store.id}`} key={store.id} className="border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                  <h2 className="text-xl font-semibold">{store.name}</h2>
                  <p className="text-gray-600">{store.address}</p>
                </Link>
              ))
            ) : (
              <p>표시할 편의점이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
