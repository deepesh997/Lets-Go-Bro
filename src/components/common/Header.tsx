'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, Product } from '@/services/api';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const suggestionsRef = useRef<HTMLFormElement>(null);

  const { wishlist } = useWishlist();
  const { compareList } = useCompare();

  // Sync query state with URL search parameters
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Dark Mode Initialization
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark' ||
                   (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  // Dark Mode Toggle
  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  // Real-time suggestions fetching
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await api.searchProducts(query);
        setSuggestions(results.slice(0, 5)); // Show top 5 suggestions
      } catch (e) {
        console.error('Error fetching search suggestions', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle outside clicks to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const selectSuggestion = (productSlug: string) => {
    setShowSuggestions(false);
    router.push(`/product/${productSlug}`);
  };

  return (
    <header className="glass-nav shadow-sm top-0 sticky z-50 transition-colors duration-200">
      <div className="flex justify-between items-center w-full px-gutter max-w-container-max mx-auto h-16">
        {/* Brand Logo */}
        <div className="flex items-center gap-unit-lg">
          <Link href="/" className="text-h3 font-h3 font-bold text-primary dark:text-primary-fixed-dim">
            HubPro
          </Link>
          <nav className="hidden lg:flex items-center gap-unit-md">
            <Link
              href="/"
              className="text-label-md font-label-md text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors"
            >
              Home
            </Link>
            <Link
              href="/search"
              className="text-label-md font-label-md text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/compare"
              className="text-label-md font-label-md text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors"
            >
              Compare
              {compareList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-on-primary rounded-full">
                  {compareList.length}
                </span>
              )}
            </Link>
            <Link
              href="/blog"
              className="text-label-md font-label-md text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors"
            >
              Blog
            </Link>
          </nav>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-unit-md flex-1 justify-end">
          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex relative w-full max-w-sm" ref={suggestionsRef}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full h-10 pl-10 pr-4 bg-surface-container-low/50 dark:bg-surface-container/30 border border-outline-variant dark:border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface dark:text-on-surface outline-none transition-all"
            />
            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 glass-panel rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-2 border-b border-outline-variant dark:border-outline-variant/10 text-xs font-bold text-outline">
                  Suggestions
                </div>
                {suggestions.map((p) => (
                  <button
                    key={p.product_id}
                    type="button"
                    onClick={() => selectSuggestion(p.product_slug)}
                    className="w-full px-4 py-2.5 text-left text-body-sm hover:bg-surface-container-low dark:hover:bg-surface-container flex items-center gap-unit-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-outline text-sm">search</span>
                    <span className="font-medium truncate flex-1 text-on-surface dark:text-on-surface">{p.product_name}</span>
                    <span className="text-xs text-outline">{p.category}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Quick Actions */}
          <div className="flex items-center gap-unit-sm">
            {/* Wishlist Link (Desktop) */}
            <Link
              href="/wishlist"
              className="relative p-2 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container rounded-full transition-all hidden md:block"
              title="Wishlist"
            >
              <span className="material-symbols-outlined">favorite</span>
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
              )}
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container rounded-full transition-all"
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-outlined">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container rounded-full transition-all lg:hidden"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full glass-panel shadow-md p-unit-md z-40 transition-all duration-300">
          <form onSubmit={handleSearchSubmit} className="relative w-full mb-unit-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search for products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-container-low dark:bg-surface-container border border-outline-variant dark:border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface dark:text-on-surface outline-none"
            />
          </form>
          <nav className="flex flex-col gap-unit-sm">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 hover:bg-surface-container rounded-lg text-label-md font-bold text-on-surface dark:text-surface-variant"
            >
              <span className="material-symbols-outlined">home</span> Home
            </Link>
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 hover:bg-surface-container rounded-lg text-label-md font-bold text-on-surface dark:text-surface-variant"
            >
              <span className="material-symbols-outlined">grid_view</span> Browse Products
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 hover:bg-surface-container rounded-lg text-label-md font-bold text-on-surface dark:text-surface-variant"
            >
              <span className="material-symbols-outlined">compare_arrows</span> Compare Products
              {compareList.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-primary text-on-primary rounded-full text-xs">
                  {compareList.length}
                </span>
              )}
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 hover:bg-surface-container rounded-lg text-label-md font-bold text-on-surface dark:text-surface-variant"
            >
              <span className="material-symbols-outlined">favorite</span> Wishlist
              {wishlist.length > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-error text-on-error rounded-full text-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 hover:bg-surface-container rounded-lg text-label-md font-bold text-on-surface dark:text-surface-variant"
            >
              <span className="material-symbols-outlined">article</span> Blogs & Guides
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
