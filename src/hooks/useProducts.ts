import { useEffect } from 'react';
import { useProductsStore } from '../store/useProductsStore';

export const useProducts = () => {
  const { 
    products, 
    isLoading, 
    isLoadingMore,
    hasMore,
    error, 
    fetchProducts, 
    fetchMoreProducts,
    addProduct, 
    updateProduct 
  } = useProductsStore();

  useEffect(() => {
    if (products.length === 0 && !isLoading && !error) {
      fetchProducts();
    }
  }, [products.length, isLoading, error, fetchProducts]);

  return {
    products,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    addProduct,
    updateProduct,
    refreshProducts: fetchProducts,
    fetchMoreProducts,
  };
};
