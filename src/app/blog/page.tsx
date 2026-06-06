'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Blog } from '@/services/api';

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      try {
        setLoading(true);
        const data = await api.getBlogs();
        setBlogs(data);
      } catch (e) {
        console.error('Error fetching blogs', e);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  return (
    <div className="max-w-container-max mx-auto px-gutter py-unit-xl min-h-screen transition-colors duration-200">
      <section className="mb-unit-xl">
        <h1 className="text-h1 font-h1 text-on-surface dark:text-white mb-unit-sm">
          Shopping Guides & Tips
        </h1>
        <p className="text-body-lg text-on-surface-variant dark:text-surface-variant/80 max-w-2xl">
          Learn how to find the best discounts, stack codes, and make smart buying decisions with detailed market breakdowns from our experts.
        </p>
      </section>

      {/* Guides Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-lg">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-surface-container rounded-xl h-72"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-lg">
          {blogs.map((blog) => (
            <Link
              key={blog.slug}
              href={`/blog/${blog.slug}`}
              className="bg-surface-container-lowest dark:bg-inverse-surface rounded-xl border border-outline-variant dark:border-outline-variant/10 overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-48 overflow-hidden bg-surface-container">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80';
                    }}
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
      )}
    </div>
  );
}
