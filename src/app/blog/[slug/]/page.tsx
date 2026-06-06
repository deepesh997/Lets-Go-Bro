import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { api } from '@/services/api';
import { InContentAd, HeaderAd } from '@/components/ads/AdSense';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate Dynamic SEO Metadata for Blogs
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const blog = await api.getBlogBySlug(slug);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return {
      title: `${blog.title} | HubPro Guides`,
      description: blog.excerpt,
      alternates: {
        canonical: `${siteUrl}/blog/${slug}`,
      },
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        url: `${siteUrl}/blog/${slug}`,
        images: [{ url: blog.image }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.title,
        description: blog.excerpt,
        images: [blog.image],
      },
    };
  } catch (e) {
    return {
      title: 'Guide Details | HubPro',
    };
  }
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let blog;
  let allBlogs = [];

  try {
    blog = await api.getBlogBySlug(slug);
    allBlogs = await api.getBlogs();
  } catch (error) {
    console.error('Error fetching blog details', error);
    notFound();
  }

  const relatedBlogs = allBlogs.filter((b) => b.slug !== slug).slice(0, 2);

  // Article JSON-LD Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: blog.title,
    image: [blog.image],
    datePublished: new Date(blog.date).toISOString(),
    description: blog.excerpt,
    author: {
      '@type': 'Person',
      name: 'HubPro Editorial',
    },
  };

  return (
    <div className="max-w-container-max mx-auto px-gutter py-unit-lg lg:py-unit-xl min-h-screen">
      {/* Dynamic JSON-LD Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header Ad */}
      <HeaderAd className="mb-unit-lg" />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-unit-xs text-body-sm text-on-surface-variant dark:text-surface-variant/80 mb-unit-lg">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <Link href="/blog" className="hover:underline">Guides</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="font-bold text-on-surface dark:text-white truncate max-w-[200px] sm:max-w-none">
          {blog.title}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-unit-xl items-start">
        {/* Main Article Content */}
        <article className="lg:col-span-8 bg-white dark:bg-surface-container border border-outline-variant dark:border-outline-variant/10 rounded-xl p-unit-lg lg:p-unit-xl transition-colors duration-200">
          <header className="space-y-unit-sm mb-unit-lg">
            <span className="px-3 py-1 bg-primary-container/10 text-primary dark:text-primary-fixed-dim rounded-full text-xs font-bold uppercase">
              {blog.category}
            </span>
            <h1 className="text-h1 font-h1 text-on-surface dark:text-white leading-tight">
              {blog.title}
            </h1>
            <div className="flex items-center gap-unit-md text-xs text-outline dark:text-surface-variant/60">
              <span>Published: {blog.date}</span>
              <span>•</span>
              <span>{blog.read_time}</span>
              <span>•</span>
              <span>By HubPro Team</span>
            </div>
          </header>

          {/* Featured Image */}
          <div className="w-full h-80 rounded-xl overflow-hidden mb-unit-lg">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>

          {/* Article Body */}
          <div className="text-body-lg text-on-surface-variant dark:text-surface-variant/90 space-y-unit-md leading-relaxed whitespace-pre-line">
            {blog.content}
          </div>

          {/* In Content Ad */}
          <InContentAd className="mt-unit-xl" />
        </article>

        {/* Sidebar Related blogs */}
        <aside className="lg:col-span-4 space-y-unit-lg">
          <div className="bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-outline-variant/10 rounded-xl p-unit-lg transition-colors">
            <h3 className="font-h3 text-h3 dark:text-white mb-unit-md">Related Guides</h3>
            <div className="space-y-unit-lg">
              {relatedBlogs.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group block space-y-2 cursor-pointer"
                >
                  <div className="aspect-video rounded-lg overflow-hidden bg-surface-container">
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-body-md font-bold dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-outline">{rel.date}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Small placeholder vertical banner */}
          <div className="bg-surface-container-low dark:bg-surface-container border-2 border-dashed border-outline-variant dark:border-outline-variant/20 rounded-xl p-unit-lg flex flex-items-center justify-center min-h-[200px]">
            <code className="font-code text-xs text-outline uppercase tracking-widest text-center self-center">
              Vertical Banner Ad
            </code>
          </div>
        </aside>
      </div>
    </div>
  );
}
