import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { api } from '@/services/api';
import ProductDetailClient from '@/components/product/ProductDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.getProductBySlug(slug);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return {
      title: `${product.product_name} | HubPro Discovery`,
      description: product.short_description,
      alternates: {
        canonical: `${siteUrl}/product/${slug}`,
      },
      openGraph: {
        title: product.product_name,
        description: product.short_description,
        url: `${siteUrl}/product/${slug}`,
        images: [{ url: product.product_image }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.product_name,
        description: product.short_description,
        images: [product.product_image],
      },
    };
  } catch (e) {
    return {
      title: 'Product Details | HubPro',
    };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  
  let product;
  let relatedProducts = [];

  try {
    product = await api.getProductBySlug(slug);
    relatedProducts = await api.getRelatedProducts(slug);
  } catch (error) {
    console.error('Error fetching product in server component', error);
    notFound();
  }

  // Create JSON-LD Product Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.product_name,
    image: product.product_image,
    description: product.short_description,
    sku: product.product_id,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      url: product.affiliate_url,
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.available_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}
