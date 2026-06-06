'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Product, Category } from '@/services/api';
import ProductCard from '@/components/product/ProductCard';
import { SidebarAd } from '@/components/ads/AdSense';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search and Sort State
  const query = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = searchParams.get('sort') || 'Latest Arrivals';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState(searchParams.get('price_max') || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [minDiscount, setMinDiscount] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // View state (Grid vs List)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load Categories & Products
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
      } catch (e) {
        console.error('Error fetching categories', e);
      }
    }
    loadCategories();
  }, []);

  // Main Product Fetcher (combines API query and client-side filtering since Google Sheets uses a simple Apps Script wrapper)
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        let results: Product[] = [];

        if (query) {
          // If query is provided, query the search endpoint
          results = await api.searchProducts(query);
        } else {
          // Otherwise get all products or by category
          const data = await api.getProducts(selectedCategory === 'All' ? undefined : selectedCategory);
          results = data.products;
        }

        // Apply Client-Side Filters (price, brand, rating, stock, platform, discount)
        let filtered = results;

        if (priceMin) {
          filtered = filtered.filter((p) => p.price >= parseFloat(priceMin));
        }
        if (priceMax) {
          filtered = filtered.filter((p) => p.price <= parseFloat(priceMax));
        }

        if (selectedBrands.length > 0) {
          filtered = filtered.filter((p) => selectedBrands.includes(p.brand));
        }

        if (minRating !== null) {
          filtered = filtered.filter((p) => p.rating >= minRating);
        }

        if (excludeOutOfStock) {
          filtered = filtered.filter((p) => p.available_quantity > 0);
        }

        if (selectedPlatforms.length > 0) {
          filtered = filtered.filter((p) => selectedPlatforms.includes(p.affiliate_platform));
        }

        if (minDiscount !== null) {
          filtered = filtered.filter((p) => p.discount_percentage >= minDiscount);
        }

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
      } catch (err) {
        console.error('Error fetching search/browse products', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [
    query,
    selectedCategory,
    selectedSort,
    priceMin,
    priceMax,
    selectedBrands,
    minRating,
    excludeOutOfStock,
    selectedPlatforms,
    minDiscount,
    currentPage
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    selectedCategory,
    selectedSort,
    priceMin,
    priceMax,
    selectedBrands,
    minRating,
    excludeOutOfStock,
    selectedPlatforms,
    minDiscount
  ]);

  const uniqueBrands = ['Sony', 'Logitech', 'Razer', 'Sennheiser', 'Dell', 'Zenith', 'Nike', 'Apple', 'Fossil'];
  const uniquePlatforms = ['Amazon', 'Flipkart', 'Nike Store', 'Apple Store'];

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="max-w-container-max mx-auto flex gap-gutter min-h-screen relative px-margin-mobile lg:px-gutter py-unit-lg lg:py-unit-xl">
      {/* 1. Sidebar Filters */}
      <aside className="hidden lg:flex flex-col p-unit-md gap-unit-sm w-[260px] h-[calc(100vh-120px)] sticky top-24 overflow-y-auto glass-panel border border-outline-variant dark:border-outline-variant/10 rounded-xl transition-colors duration-200">
        <div className="mb-unit-md flex justify-between items-center">
          <div>
            <h3 className="text-label-md font-label-md text-primary dark:text-primary-fixed-dim font-bold">Filters</h3>
            <p className="text-[11px] text-on-surface-variant dark:text-surface-variant/70">Refine Discovery</p>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setPriceMin('');
              setPriceMax('');
              setSelectedBrands([]);
              setMinRating(null);
              setExcludeOutOfStock(false);
              setSelectedPlatforms([]);
              setMinDiscount(null);
            }}
            className="text-xs text-primary dark:text-primary-fixed-dim hover:underline"
          >
            Clear All
          </button>
        </div>

        {/* Categories Facet */}
        <div className="space-y-2 border-b border-outline-variant dark:border-outline-variant/10 pb-4">
          <label className="text-xs font-bold text-outline uppercase">Categories</label>
          <div className="flex flex-col gap-1 text-body-sm">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`text-left px-2 py-1 rounded transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-secondary-container dark:bg-primary text-on-secondary-container dark:text-on-primary font-bold'
                  : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setSelectedCategory(c.name)}
                className={`text-left px-2 py-1 rounded transition-colors flex justify-between items-center ${
                  selectedCategory === c.name
                    ? 'bg-secondary-container dark:bg-primary text-on-secondary-container dark:text-on-primary font-bold'
                    : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container'
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] opacity-75">{c.product_count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Facet */}
        <div className="space-y-2 border-b border-outline-variant dark:border-outline-variant/10 pb-4">
          <label className="text-xs font-bold text-outline uppercase">Price Range (₹)</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full h-9 px-2 bg-surface-container-low dark:bg-surface-container border border-outline-variant dark:border-outline-variant/30 rounded-lg text-xs outline-none focus:border-primary text-on-surface dark:text-white"
            />
            <input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full h-9 px-2 bg-surface-container-low dark:bg-surface-container border border-outline-variant dark:border-outline-variant/30 rounded-lg text-xs outline-none focus:border-primary text-on-surface dark:text-white"
            />
          </div>
        </div>

        {/* Brand Facet */}
        <div className="space-y-2 border-b border-outline-variant dark:border-outline-variant/10 pb-4">
          <label className="text-xs font-bold text-outline uppercase">Brand</label>
          <div className="max-h-36 overflow-y-auto space-y-1.5 text-body-sm dark:text-surface-variant">
            {uniqueBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4"
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ratings Facet */}
        <div className="space-y-2 border-b border-outline-variant dark:border-outline-variant/10 pb-4">
          <label className="text-xs font-bold text-outline uppercase">Min Rating</label>
          <div className="flex gap-1">
            {[4, 4.5, 4.8].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(minRating === rating ? null : rating)}
                className={`flex-1 py-1 rounded text-xs font-bold border transition-colors ${
                  minRating === rating
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface-container-low dark:bg-surface-container border-outline-variant dark:border-outline-variant/30 text-on-surface dark:text-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {rating}★
              </button>
            ))}
          </div>
        </div>

        {/* Discount Facet */}
        <div className="space-y-2 border-b border-outline-variant dark:border-outline-variant/10 pb-4">
          <label className="text-xs font-bold text-outline uppercase">Min Discount</label>
          <div className="flex gap-1">
            {[10, 30, 50].map((disc) => (
              <button
                key={disc}
                onClick={() => setMinDiscount(minDiscount === disc ? null : disc)}
                className={`flex-1 py-1 rounded text-xs font-bold border transition-colors ${
                  minDiscount === disc
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface-container-low dark:bg-surface-container border-outline-variant dark:border-outline-variant/30 text-on-surface dark:text-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {disc}%+
              </button>
            ))}
          </div>
        </div>

        {/* Stock Facet */}
        <div className="space-y-2 border-b border-outline-variant dark:border-outline-variant/10 pb-4">
          <label className="flex items-center gap-2 cursor-pointer text-body-sm dark:text-surface-variant">
            <input
              type="checkbox"
              checked={excludeOutOfStock}
              onChange={() => setExcludeOutOfStock(!excludeOutOfStock)}
              className="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4"
            />
            <span className="font-bold text-outline text-xs uppercase">Exclude Out of Stock</span>
          </label>
        </div>

        {/* Marketplace Facet */}
        <div className="space-y-2 pb-2">
          <label className="text-xs font-bold text-outline uppercase">Marketplace</label>
          <div className="space-y-1.5 text-body-sm dark:text-surface-variant">
            {uniquePlatforms.map((plat) => (
              <label key={plat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(plat)}
                  onChange={() => togglePlatform(plat)}
                  className="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4"
                />
                <span>{plat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sidebar Ad Placement */}
        <SidebarAd className="mt-4" />
      </aside>

      {/* 2. Main Content Area */}
      <section className="flex-1 lg:ml-4">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-unit-md mb-unit-lg glass-panel p-unit-md rounded-xl border border-outline-variant dark:border-outline-variant/10 shadow-sm transition-colors duration-200">
          <div>
            <h1 className="font-h3 text-h3 text-on-surface dark:text-white">
              {query ? `Search Results for "${query}"` : 'Browse Products'}
            </h1>
            <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/80">
              Showing {total} verified shopping deals
            </p>
          </div>
          <div className="flex items-center gap-unit-sm w-full md:w-auto">
            {/* Sort Dropdown */}
            <div className="relative flex-1 md:flex-none">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-surface-container border border-outline-variant dark:border-outline-variant/30 rounded-xl px-4 py-2 text-body-sm font-medium focus:ring-2 focus:ring-primary/20 text-on-surface dark:text-white outline-none pr-10"
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
            {/* Grid vs List Toggles */}
            <div className="flex p-1 bg-surface-container dark:bg-inverse-surface rounded-xl border border-outline-variant/30">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg material-symbols-outlined transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-surface-container text-primary dark:text-primary-fixed-dim shadow-sm'
                    : 'text-on-surface-variant dark:text-surface-variant hover:bg-white/50 dark:hover:bg-surface-container/50'
                }`}
              >
                grid_view
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg material-symbols-outlined transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-surface-container text-primary dark:text-primary-fixed-dim shadow-sm'
                    : 'text-on-surface-variant dark:text-surface-variant hover:bg-white/50 dark:hover:bg-surface-container/50'
                }`}
              >
                view_list
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-unit-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-surface-container rounded-xl h-80"></div>
            ))}
          </div>
        ) : products.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-unit-lg">
              {products.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-unit-md">
              {products.map((product) => (
                <div
                  key={product.product_id}
                  className="product-card-shadow glass-card glass-card-hover rounded-xl p-unit-md flex flex-col md:flex-row gap-unit-lg items-center transition-all duration-300"
                >
                  <Link href={`/product/${product.product_slug}`} className="w-full md:w-48 aspect-square bg-surface-container-low/50 dark:bg-inverse-surface/50 rounded-lg overflow-hidden flex-shrink-0 relative block">
                    <img
                      src={product.product_image}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                    />
                    {product.discount_percentage > 0 && (
                      <span className="absolute top-2 left-2 bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {product.discount_percentage}% OFF
                      </span>
                    )}
                  </Link>
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex justify-between text-xs font-bold text-outline uppercase">
                      <span>{product.brand}</span>
                      <span className="text-primary dark:text-primary-fixed-dim">{product.category}</span>
                    </div>
                    <Link href={`/product/${product.product_slug}`} className="block">
                      <h3 className="font-h3 text-lg dark:text-white hover:text-primary transition-colors">{product.product_name}</h3>
                    </Link>
                    <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/80 line-clamp-2">
                      {product.short_description}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <span className="text-h3 font-bold text-primary dark:text-primary-fixed-dim">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.mrp > product.price && (
                        <span className="text-body-sm text-outline line-through">
                          ₹{product.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-48">
                    <a
                      href={product.affiliate_url}
                      target="_blank"
                      rel="nofollow sponsored noopener noreferrer"
                      className="w-full bg-primary text-on-primary py-2.5 rounded-xl text-body-sm font-bold text-center block shadow-md"
                    >
                      Buy on {product.affiliate_platform}
                    </a>
                    <Link
                      href={`/product/${product.product_slug}`}
                      className="w-full border border-outline-variant text-on-surface dark:text-white dark:border-outline-variant/30 py-2.5 rounded-xl text-body-sm font-bold text-center block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty / No Results State */
          <div className="py-unit-xl text-center space-y-unit-md bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-outline-variant/10 rounded-xl transition-colors duration-200">
            <div className="w-16 h-16 bg-surface-container dark:bg-surface-container-high rounded-full flex items-center justify-center mx-auto text-outline text-3xl">
              <span className="material-symbols-outlined text-4xl">search_off</span>
            </div>
            <h3 className="font-h3 text-lg dark:text-white">No Products Found</h3>
            <p className="text-body-sm text-on-surface-variant dark:text-surface-variant/80 max-w-sm mx-auto">
              We couldn't find any products matching your criteria. Try adjusting your search query, selecting another category, or clearing filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setPriceMin('');
                setPriceMax('');
                setSelectedBrands([]);
                setMinRating(null);
                setExcludeOutOfStock(false);
                setSelectedPlatforms([]);
                setMinDiscount(null);
                router.push('/search');
              }}
              className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-unit-sm mt-unit-xl pb-unit-xl">
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
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
