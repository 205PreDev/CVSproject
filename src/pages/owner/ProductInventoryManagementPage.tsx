import React, { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import DatabaseService from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Modal } from '../../components/ui';

interface Product {
  id: string;
  id: string;
  name: string;
  description: string;
  category: string;
  barcode: string;
  brand: string;
  unit: string;
  base_price: number;
  image_url: string;
  is_active: boolean;
}

interface InventoryItem {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  min_quantity: number;
  price: number;
  is_available: boolean;
  products: Product; // Join with products table
}

const ProductInventoryManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product & { inventory_id?: string, quantity?: number, min_quantity?: number, price?: number, is_available?: boolean }> | null>(null);

  useEffect(() => {
    const fetchStoreAndInventory = async () => {
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

        const fetchedInventory = await DatabaseService.getProductsByStore(ownerStore.id);
        setInventory(fetchedInventory);
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        setError('Failed to load inventory data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndInventory();
  }, [user]);

  const openModal = (product?: InventoryItem) => {
    if (product) {
      setCurrentProduct({
        ...product.products,
        inventory_id: product.id,
        quantity: product.quantity,
        min_quantity: product.min_quantity,
        price: product.price,
        is_available: product.is_available,
      });
    } else {
      setCurrentProduct(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !currentProduct) return;

    try {
      if (currentProduct.id && currentProduct.inventory_id) {
        // Update existing product and inventory
        await DatabaseService.update('products', currentProduct.id, {
          name: currentProduct.name,
          description: currentProduct.description,
          category: currentProduct.category,
          barcode: currentProduct.barcode,
          brand: currentProduct.brand,
          unit: currentProduct.unit,
          base_price: currentProduct.base_price,
          image_url: currentProduct.image_url,
          is_active: currentProduct.is_active,
        });
        await DatabaseService.update('inventory', currentProduct.inventory_id, {
          quantity: currentProduct.quantity,
          min_quantity: currentProduct.min_quantity,
          price: currentProduct.price,
          is_available: currentProduct.is_available,
        });
      } else {
        // Create new product and inventory
        const newProduct = await DatabaseService.create('products', {
          name: currentProduct.name,
          description: currentProduct.description,
          category: currentProduct.category,
          barcode: currentProduct.barcode,
          brand: currentProduct.brand,
          unit: currentProduct.unit,
          base_price: currentProduct.base_price,
          image_url: currentProduct.image_url,
          is_active: currentProduct.is_active,
        });
        await DatabaseService.create('inventory', {
          store_id: storeId,
          product_id: newProduct.id,
          quantity: currentProduct.quantity || 0,
          min_quantity: currentProduct.min_quantity || 0,
          price: currentProduct.price || newProduct.base_price,
          is_available: currentProduct.is_available || true,
        });
      }
      closeModal();
      // Refresh inventory list
      const updatedInventory = await DatabaseService.getProductsByStore(storeId);
      setInventory(updatedInventory);
    } catch (err) {
      console.error('Failed to save product/inventory:', err);
      setError('Failed to save product/inventory.');
    }
  };

  const handleDelete = async (productId: string, inventoryId: string) => {
    if (window.confirm('정말로 이 상품을 삭제하시겠습니까? (재고에서도 삭제됩니다)')) {
      try {
        await DatabaseService.delete('inventory', inventoryId);
        await DatabaseService.delete('products', productId);
        const updatedInventory = await DatabaseService.getProductsByStore(storeId!);
        setInventory(updatedInventory);
      } catch (err) {
        console.error('Failed to delete product/inventory:', err);
        setError('Failed to delete product/inventory.');
      }
    }
  };

  if (loading) {
    return (
      <Layout userRole="owner">
        <div className="container mx-auto p-4">
          <p>상품 및 재고 정보를 불러오는 중...</p>
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
        <h1 className="text-2xl font-bold mb-6">상품 및 재고 관리</h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => openModal()}>새 상품 추가</Button>
        </div>

        {inventory.length === 0 ? (
          <p>등록된 상품이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map(item => (
              <Card key={item.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2">{item.products.name}</h2>
                  <p>카테고리: {item.products.category}</p>
                  <p>현재 재고: {item.quantity} {item.products.unit}</p>
                  <p>최소 재고: {item.min_quantity} {item.products.unit}</p>
                  <p>판매 가격: {item.price.toLocaleString()}원</p>
                  <p>판매 가능: {item.is_available ? '예' : '아니오'}</p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button onClick={() => openModal(item)} variant="secondary">수정</Button>
                  <Button onClick={() => handleDelete(item.products.id, item.id)} variant="danger">삭제</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={closeModal} title={currentProduct?.id ? '상품 수정' : '새 상품 추가'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">상품명</label>
                <Input type="text" id="name" name="name" value={currentProduct?.name || ''} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">카테고리</label>
                <Input type="text" id="category" name="category" value={currentProduct?.category || ''} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="base_price" className="block text-sm font-medium text-gray-700">기본 가격</label>
                <Input type="number" id="base_price" name="base_price" value={currentProduct?.base_price || 0} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">현재 재고</label>
                <Input type="number" id="quantity" name="quantity" value={currentProduct?.quantity || 0} onChange={handleChange} required />
              </div>
              <div>
                <label htmlFor="min_quantity" className="block text-sm font-medium text-gray-700">최소 재고</label>
                <Input type="number" id="min_quantity" name="min_quantity" value={currentProduct?.min_quantity || 0} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">판매 가격</label>
                <Input type="number" id="price" name="price" value={currentProduct?.price || 0} onChange={handleChange} />
              </div>
              <div className="flex items-center">
                <Input type="checkbox" id="is_active" name="is_active" checked={currentProduct?.is_active || false} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">상품 활성화</label>
              </div>
              <div className="flex items-center">
                <Input type="checkbox" id="is_available" name="is_available" checked={currentProduct?.is_available || false} onChange={handleChange} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">판매 가능</label>
              </div>
              {/* Add more fields as needed: description, barcode, brand, unit, image_url */}
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

export default ProductInventoryManagementPage;
