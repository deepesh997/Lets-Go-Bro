'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api, Product, Category } from '@/services/api';
import ProductCard from '@/components/product/ProductCard';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = use(params);

  const [categoryName, setCategoryName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter and pagination state
  const [selectedSort, setSelectedSort] = useState('Latest Arrivals');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Resolve Category Name from Slug
  useEffect(() => {
    async function loadCategoryInfo() {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        
        const matched = cats.find((c) => c.slug === slug);
        if (matched) {
          setCategoryName(matched.name);
        } else {
          // Fallback guess
          setCategoryName(slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '));
        }
      } catch (e) {
        console.error('Error loading category information', e);
      }
    }
    loadCategoryInfo();
  }, [slug]);

  // Load products when categoryName or sorting changes
  useEffect(() => {
    if (!categoryName) return;

    async function loadCategoryProducts() {
      try {
        setLoading(true);
        const { products: allProducts } = await api.getProducts(categoryName);
        
        let filtered = [...allProducts];

        // Apply Sorting
        if (selectedSort === 'Price: Low to High') {
          filtered.sort((a, b) => a.price - b.price);
        } else if (selectedSort === 'Price: High to Low') {
          filtered.sort((a, b) => b.price - a.price);
        } else if (selectedSort === 'Highest Discount') {
          filtered.sort((a, b) => b.discount_percentage - a.discount_percentage);
        } else if (selectedSort === 'Most Popular') {
          filtered.sort((a, b) => b.review_count - a.review_count);
        }

        setTotal(filtered.length);

        // Paginate
        const start = (currentPage - 1) * itemsPerPage;
        setProducts(filtered.slice(start, start + itemsPerPage));
      } catch (e) {
        console.error('Error loading category products', e);
      } finally {
        setLoading(false);
      }
    }
    loadCategoryProducts();
  }, [categoryName, selectedSort, currentPage]);

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="max-w-container-max mx-auto px-gutter py-unit-lg lg:py-unit-xl min-h-screen">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-unit-xs text-body-sm text-on-surface-variant dark:text-surface-variant/80 mb-unit-lg">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span>Categories</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="font-bold text-on-surface dark:text-white">{categoryName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
        {/* Left Side: Sidebar Categories */}
        <aside className="lg:col-span-3 glass-panel border border-outline-variant dark:border-outline-variant/10 rounded-xl p-unit-md transition-colors duration-200">
          <h3 className="font-label-md text-label-md text-primary dark:text-primary-fixed-dim font-bold mb-unit-md">
            Categories
          </h3>
          <div className="flex flex-col gap-1 text-body-sm">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className={`px-3 py-2 rounded-lg transition-all flex justify-between items-center ${
                  c.slug === slug
                    ? 'bg-secondary-container dark:bg-primary text-on-secondary-container dark:text-on-primary font-bold'
                    : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] opacity-75">{c.product_count}</span>
              </Link>
            ))}
          </div>
        </aside>

        {/* Right Side: Product Display */}
        <div className="lg:col-span-9 space-y-unit-lg">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-unit-md glass-panel p-unit-md rounded-xl border border-outline-variant dark:border-outline-variant/10 shadow-sm transition-colors duration-200">
            <div>
              <h1 className="font-h3 text-h3 text-on-surface dark:text-white">{categoryName} Deals</h1>
              <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/80">
                Found {total} active offers
              </p>
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 appearance-none bg-white dark:bg-surface-container border border-outline-variant dark:border-outline-variant/30 rounded-xl px-4 py-2 text-body-sm font-medium focus:ring-2 focus:ring-primary/20 text-on-surface dark:text-white outline-none pr-10"
              >
                <option>Latest Arrivals</option>
                <option>Most Popular</option>
                <option>Highest Discount</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-unit-lg">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container rounded-xl h-80"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-unit-lg">
              {products.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-unit-xl text-center space-y-unit-md bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-outline-variant/10 rounded-xl transition-colors duration-200">
              <div className="w-16 h-16 bg-surface-container dark:bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-outline text-3xl">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 className="font-h3 text-lg dark:text-white">No Products Active</h3>
              <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/80 max-w-sm mx-auto">
                There are no active deals currently registered under this category. Please check back later.
              </p>
              <Link href="/" className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold inline-block">
                Return Home
              </Link>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-unit-sm pt-unit-md pb-unit-xl">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant dark:border-outline-variant/30 text-on-surface-variant dark:text-surface-variant disabled:opacity-50 hover:bg-surface-container transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all ${
                    currentPage === idx + 1
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'border border-outline-variant dark:border-outline-variant/30 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-outline-variant dark:border-outline-variant/30 text-on-surface-variant dark:text-surface-variant disabled:opacity-50 hover:bg-surface-container transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
