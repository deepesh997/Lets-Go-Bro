'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { wishlist } = useWishlist();
  const { compareList } = useCompare();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) => {
    const active = isActive(path);
    return `flex flex-col items-center justify-center flex-1 py-1 text-center relative transition-colors ${
      active
        ? 'text-primary dark:text-primary-fixed-dim font-bold'
        : 'text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed'
    }`;
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center py-unit-sm bg-surface-container/95 dark:bg-inverse-surface/95 backdrop-blur-md border-t border-outline-variant dark:border-outline-variant/20 shadow-lg lg:hidden z-40 transition-colors duration-200">
      <Link href="/" className={linkClass('/')}>
        <span className="material-symbols-outlined">home</span>
        <span className="text-[10px] mt-0.5 font-label-md">Home</span>
      </Link>
      
      <Link href="/search" className={linkClass('/search')}>
        <span className="material-symbols-outlined">grid_view</span>
        <span className="text-[10px] mt-0.5 font-label-md">Browse</span>
      </Link>
      
      <Link href="/compare" className={linkClass('/compare')}>
        <span className="material-symbols-outlined">compare_arrows</span>
        <span className="text-[10px] mt-0.5 font-label-md">Compare</span>
        {compareList.length > 0 && (
          <span className="absolute -top-1 right-1/2 translate-x-4 bg-primary text-on-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {compareList.length}
          </span>
        )}
      </Link>
      
      <Link href="/wishlist" className={linkClass('/wishlist')}>
        <span className="material-symbols-outlined">favorite</span>
        <span className="text-[10px] mt-0.5 font-label-md">Wishlist</span>
        {wishlist.length > 0 && (
          <span className="absolute -top-1 right-1/2 translate-x-4 bg-error text-on-error text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {wishlist.length}
          </span>
        )}
      </Link>
      
      <Link href="/blog" className={linkClass('/blog')}>
        <span className="material-symbols-outlined">article</span>
        <span className="text-[10px] mt-0.5 font-label-md">Guides</span>
      </Link>
    </nav>
  );
}
