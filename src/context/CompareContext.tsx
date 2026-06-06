'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/services/api';

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => { success: boolean; message: string };
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hubpro_compare');
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing compare list from localStorage', e);
      }
    }
  }, []);

  const saveCompareList = (newList: Product[]) => {
    setCompareList(newList);
    localStorage.setItem('hubpro_compare', JSON.stringify(newList));
  };

  const addToCompare = (product: Product) => {
    if (compareList.some((p) => p.product_id === product.product_id)) {
      return { success: false, message: 'Product is already in the comparison list.' };
    }

    if (compareList.length >= 4) {
      return { success: false, message: 'You can compare up to 4 products at a time.' };
    }

    // Ensure category matches or warn? The requirement just says "Allow comparison of up to 4 products."
    saveCompareList([...compareList, product]);
    return { success: true, message: `${product.product_name} added to comparison.` };
  };

  const removeFromCompare = (productId: string) => {
    saveCompareList(compareList.filter((p) => p.product_id !== productId));
  };

  const isInCompare = (productId: string) => {
    return compareList.some((p) => p.product_id === productId);
  };

  const clearCompare = () => {
    saveCompareList([]);
  };

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, isInCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
