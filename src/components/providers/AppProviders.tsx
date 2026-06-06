'use client';

import React from 'react';
import { WishlistProvider } from '@/context/WishlistContext';
import { CompareProvider } from '@/context/CompareContext';
import { RecentlyViewedProvider } from '@/context/RecentlyViewedContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WishlistProvider>
      <CompareProvider>
        <RecentlyViewedProvider>
          {children}
        </RecentlyViewedProvider>
      </CompareProvider>
    </WishlistProvider>
  );
}
