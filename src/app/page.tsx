'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Product, Category, Blog } from '@/services/api';
import ProductCard from '@/components/product/ProductCard';
import { InContentAd } from '@/components/ads/AdSense';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';

export default function Homepage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTrendingTab, setActiveTrendingTab] = useState('All');

  const { recentlyViewed } = useRecentlyViewed();
  const dealsScrollRef = useRef<HTMLDivElement>(null);

  // Fetch Homepage Data
  useEffect(() => {
    async function fetchHomeData() {
      try {
        setLoading(true);
        setError(false);
        const [catsData, featData, trendData, dealsData, blogsData] = await Promise.all([
          api.getCategories(),
          api.getFeaturedProducts(),
          api.getTrendingProducts(),
          api.getDeals(),
          api.getBlogs(),
        ]);
        setCategories(catsData);
        setFeaturedProducts(featData);
        setTrendingProducts(trendData);
        setDeals(dealsData);
        setBlogs(blogsData.slice(0, 3)); // show top 3 blogs
      } catch (err) {
        console.error('Error fetching homepage data', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (dealsScrollRef.current) {
      const { scrollLeft, clientWidth } = dealsScrollRef.current;
      const scrollAmount = direction === 'left' ? -320 : 320;
      dealsScrollRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const filteredTrending = trendingProducts.filter((p) => {
    if (activeTrendingTab === 'All') return true;
    return p.category.toLowerCase() === activeTrendingTab.toLowerCase();
  });

  return (
    <div className="min-h-screen pb-16 lg:pb-0">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-unit-xl bg-surface dark:bg-surface-dim transition-colors">
        {/* Floating Glassmorphism Blur Orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6s]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/15 dark:bg-secondary/5 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8s]"></div>
        
        <div className="max-w-container-max mx-auto px-gutter grid md:grid-cols-2 gap-unit-xl items-center relative z-10">
          <div className="space-y-unit-lg p-unit-md md:p-unit-lg rounded-2xl glass-panel border border-white/20 dark:border-white/5 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 text-primary dark:text-primary-fixed-dim rounded-full">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                bolt
              </span>
              <span className="text-label-md font-label-md">Best Price Guaranteed</span>
            </div>
            <h1 className="font-h1 text-h1 text-on-surface dark:text-white leading-tight">
              Find The Best Deals Online
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-lg">
              Compare thousands of products from top marketplaces. Track prices, check stock availability, and save more on every purchase with expert product insights.
            </p>
            <div className="flex flex-wrap gap-unit-md">
              <Link
                href="/search"
                className="px-8 py-3 bg-primary text-on-primary font-label-md rounded-xl shadow-lg hover:translate-y-[-2px] active:scale-95 transition-all text-center"
              >
                Browse Products
              </Link>
              <Link
                href="/blog"
                className="px-8 py-3 border border-outline-variant dark:border-outline-variant/30 text-on-surface dark:text-white font-label-md rounded-xl hover:bg-surface-container-low dark:hover:bg-surface-container transition-all text-center"
              >
                Shopping Guides
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl"></div>
            <img
              alt="Modern Ecommerce Illustration"
              className="relative z-10 w-full h-auto rounded-xl shadow-2xl border border-outline-variant dark:border-outline-variant/20"
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
            />
          </div>
        </div>
      </section>

      {/* 2. Search & Popular Searches */}
      <section className="py-unit-lg bg-surface-container-low dark:bg-surface-container/30 border-y border-outline-variant dark:border-outline-variant/10">
        <div className="max-w-4xl mx-auto px-gutter text-center space-y-unit-md">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-outline text-2xl group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              placeholder="What are you looking for today?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-16 pl-16 pr-6 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-outline-variant/30 rounded-xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary text-body-lg dark:text-white outline-none transition-all"
            />
          </form>
          <div className="flex flex-wrap justify-center items-center gap-unit-sm">
            <span className="text-label-md font-label-md text-on-surface-variant dark:text-surface-variant">Popular:</span>
            <Link
              href="/search?q=Smartwatches"
              className="px-4 py-1.5 bg-surface-container-highest dark:bg-surface-container text-on-surface dark:text-white text-body-sm rounded-full hover:bg-primary hover:text-on-primary dark:hover:bg-primary-container transition-all"
            >
              Latest Smartwatches
            </Link>
            <Link
              href="/search?q=Headphones"
              className="px-4 py-1.5 bg-surface-container-highest dark:bg-surface-container text-on-surface dark:text-white text-body-sm rounded-full hover:bg-primary hover:text-on-primary dark:hover:bg-primary-container transition-all"
            >
              Wireless Earbuds
            </Link>
            <Link
              href="/search?q=Laptops"
              className="px-4 py-1.5 bg-surface-container-highest dark:bg-surface-container text-on-surface dark:text-white text-body-sm rounded-full hover:bg-primary hover:text-on-primary dark:hover:bg-primary-container transition-all"
            >
              Gaming Laptops
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Top Categories */}
      <section className="py-unit-xl max-w-container-max mx-auto px-gutter">
        <div className="flex justify-between items-end mb-unit-lg">
          <div className="space-y-1">
            <h2 className="font-h2 text-h2 dark:text-white">Shop by Category</h2>
            <p className="text-on-surface-variant dark:text-surface-variant">Explore curated collections across niches</p>
          </div>
          <Link
            href="/search"
            className="text-primary dark:text-primary-fixed-dim font-label-md flex items-center gap-1 group"
          >
            View All{' '}
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-unit-md">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container p-unit-md rounded-xl h-32"></div>
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="glass-card p-unit-md rounded-xl border border-outline-variant dark:border-outline-variant/10 hover:border-primary hover:shadow-md transition-all text-center cursor-pointer group"
                >
                  <div className="w-14 h-14 bg-surface-container dark:bg-surface-container-high mx-auto rounded-xl flex items-center justify-center mb-unit-sm group-hover:bg-primary/10 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors text-on-surface-variant dark:text-surface-variant">
                    <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                  </div>
                  <h3 className="font-label-md text-label-md mb-1 dark:text-white">{cat.name}</h3>
                  <p className="text-body-sm text-outline dark:text-surface-variant/60">{cat.product_count}+ Products</p>
                </Link>
              ))}
        </div>
      </section>

      {/* 4. Trending Opportunities */}
      <section className="py-unit-xl bg-surface-container-low dark:bg-surface-container/10">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-unit-lg gap-unit-md">
            <h2 className="font-h2 text-h2 dark:text-white">Trending Opportunities</h2>
            <div className="flex gap-unit-sm">
              {['All', 'Electronics', 'Fashion'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTrendingTab(tab)}
                  className={`px-4 py-2 rounded-lg font-label-md text-body-sm transition-colors ${
                    activeTrendingTab === tab
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-lowest dark:bg-inverse-surface text-on-surface dark:text-white border border-outline-variant dark:border-outline-variant/30 hover:bg-surface-container-low'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-unit-lg">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-surface-container rounded-xl h-80"></div>
                ))
              : filteredTrending.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
            {!loading && filteredTrending.length === 0 && (
              <div className="col-span-full py-unit-xl text-center text-outline">
                No trending products available.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. In-Content Ad */}
      <InContentAd className="max-w-container-max mx-auto px-gutter" />

      {/* 6. Best Deals Today (Horizontal Scroll) */}
      <section className="py-unit-xl overflow-hidden">
        <div className="max-w-container-max mx-auto px-gutter mb-unit-lg flex justify-between items-end">
          <div>
            <h2 className="font-h2 text-h2 dark:text-white">Best Deals Today</h2>
            <p className="text-on-surface-variant dark:text-surface-variant">Handpicked price drops and limited offers</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleScroll('left')}
              className="p-2 border border-outline-variant dark:border-outline-variant/30 text-on-surface dark:text-white rounded-full hover:bg-surface-container dark:hover:bg-inverse-surface transition-colors"
              aria-label="Scroll left"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="p-2 border border-outline-variant dark:border-outline-variant/30 text-on-surface dark:text-white rounded-full hover:bg-surface-container dark:hover:bg-inverse-surface transition-colors"
              aria-label="Scroll right"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div
          ref={dealsScrollRef}
          className="flex gap-unit-lg overflow-x-auto px-gutter pb-6 hide-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container rounded-xl min-w-[300px] h-32"></div>
              ))
            : deals.map((product) => (
                <Link
                  key={product.product_id}
                  href={`/product/${product.product_slug}`}
                  className="min-w-[320px] max-w-[320px] snap-start glass-card p-unit-md flex gap-unit-md items-center group cursor-pointer hover:shadow-lg hover:border-primary transition-all duration-300"
                >
                  <div className="w-24 h-24 rounded-lg bg-surface-container dark:bg-surface-container-high overflow-hidden flex-shrink-0">
                    <img
                      src={product.product_image}
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <span className="text-error font-bold text-[10px] uppercase tracking-wider">
                      Save {product.discount_percentage}%
                    </span>
                    <h4 className="font-label-md text-on-surface dark:text-white truncate">
                      {product.product_name}
                    </h4>
                    <p className="text-h3 font-bold text-primary dark:text-primary-fixed-dim">
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-body-sm text-outline dark:text-surface-variant/60">
                      Ends in {product.deal_end_time || '08h 00m'}
                    </p>
                  </div>
                </Link>
              ))}
          {!loading && deals.length === 0 && (
            <div className="py-8 text-center text-outline w-full">No active lightning deals today.</div>
          )}
        </div>
      </section>

      {/* 7. Curated Collections Grid (Bento Style) */}
      <section className="py-unit-xl max-w-container-max mx-auto px-gutter">
        <h2 className="font-h2 text-h2 dark:text-white mb-unit-lg">Curated Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-lg">
          <Link
            href="/search?sort=Price:+Low+to+High&price_max=49999"
            className="md:col-span-2 group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-outline-variant dark:border-outline-variant/10"
          >
            <img
              alt="Gadgets Collection"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 brightness-75"
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-unit-lg flex flex-col justify-end">
              <span className="text-on-primary bg-primary w-fit px-3 py-1 rounded text-[10px] font-bold uppercase mb-2">
                Editor's Choice
              </span>
              <h3 className="text-h2 text-white font-bold">Tech Under ₹49,999</h3>
              <p className="text-white/80 font-body-sm">Premium gadgets that don't break the bank.</p>
            </div>
          </Link>

          <Link
            href="/search?sort=Price:+Low+to+High&price_max=499"
            className="group relative h-64 rounded-xl overflow-hidden cursor-pointer border border-outline-variant dark:border-outline-variant/10"
          >
            <img
              alt="Beauty Collection"
              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 brightness-75"
              src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&q=80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-unit-lg flex flex-col justify-end">
              <h3 className="text-h3 text-white font-bold">Best Under ₹499</h3>
              <p className="text-white/80 font-body-sm">Daily essentials at unbeatable prices.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 8. Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="py-unit-xl bg-surface-container-low dark:bg-surface-container/20">
          <div className="max-w-container-max mx-auto px-gutter">
            <h2 className="font-h2 text-h2 dark:text-white mb-unit-lg">Recently Viewed</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-unit-md">
              {recentlyViewed.slice(0, 6).map((product) => (
                <Link
                  key={product.product_id}
                  href={`/product/${product.product_slug}`}
                  className="glass-card p-2 text-center hover:border-primary transition-all duration-200 group block"
                >
                  <div className="aspect-square bg-surface-container dark:bg-surface-container-high rounded-lg overflow-hidden mb-2">
                    <img
                      src={product.product_image}
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>
                  <h4 className="font-label-md text-xs text-on-surface dark:text-white truncate">
                    {product.product_name}
                  </h4>
                  <p className="text-xs font-bold text-primary dark:text-primary-fixed-dim mt-0.5">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Latest Blog Articles */}
      <section className="py-unit-xl">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex justify-between items-center mb-unit-lg">
            <h2 className="font-h2 text-h2 dark:text-white">Shopping Guides & Tips</h2>
            <Link href="/blog" className="text-primary dark:text-primary-fixed-dim font-label-md hover:underline">
              Read All Stories
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-lg">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-surface-container rounded-xl h-64"></div>
                ))
              : blogs.map((blog) => (
                  <Link
                    key={blog.slug}
                    href={`/blog/${blog.slug}`}
                    className="glass-card rounded-xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-48 overflow-hidden bg-surface-container">
                        <img
                          src={blog.image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-unit-md space-y-2">
                        <span className="text-primary dark:text-primary-fixed-dim text-[11px] font-bold uppercase">
                          {blog.category}
                        </span>
                        <h3 className="font-h3 text-on-surface dark:text-white text-lg leading-snug group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-on-surface-variant dark:text-surface-variant/80 text-body-sm line-clamp-2">
                          {blog.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="p-unit-md pt-0 text-xs text-outline dark:text-surface-variant/60 flex items-center justify-between">
                      <span>{blog.date}</span>
                      <span>{blog.read_time}</span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* 10. Newsletter Subscription */}
      <section className="py-unit-xl relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-900 dark:from-surface-container-low dark:to-surface-container-lowest text-on-primary transition-colors border-t border-outline-variant/20">
        {/* Floating Blurs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 dark:bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-black/20 dark:bg-secondary/15 rounded-full blur-3xl"></div>
        
        <div className="max-w-container-max mx-auto px-gutter relative z-10">
          <div className="max-w-3xl mx-auto glass-panel p-unit-lg md:p-unit-xl rounded-2xl border border-white/20 dark:border-white/5 shadow-2xl backdrop-blur-lg space-y-unit-lg text-center">
            <div className="space-y-unit-sm">
              <h2 className="font-h2 text-h2 text-white">Never Miss a Price Drop Again</h2>
              <p className="text-blue-100 dark:text-surface-variant/80 max-w-xl mx-auto font-body-lg">
                Get curated lists of the day's best deals delivered directly to your inbox every morning. Join 50,000+ smart shoppers.
              </p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} className="max-w-md mx-auto flex flex-col sm:flex-row gap-unit-sm">
              <input
                type="email"
                required
                placeholder="Your email address"
                className="flex-1 h-12 px-4 rounded-xl text-white bg-white/10 dark:bg-black/25 placeholder:text-white/60 dark:placeholder:text-surface-variant/50 border border-white/20 dark:border-white/10 focus:border-white focus:bg-white/20 outline-none backdrop-blur-sm transition-all"
              />
              <button
                type="submit"
                className="h-12 px-8 bg-white text-blue-900 dark:bg-primary dark:text-on-primary rounded-xl font-label-md hover:bg-blue-50 hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Subscribe Now
              </button>
            </form>
            <p className="text-blue-200 dark:text-surface-variant/60 text-body-sm">
              Zero spam. Unsubscribe at any time. View our <a href="#" className="underline hover:text-white">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
