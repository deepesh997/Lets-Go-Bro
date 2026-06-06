export interface Product {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  mrp: number;
  discount_percentage: number;
  available_quantity: number;
  rating: number;
  review_count: number;
  affiliate_url: string;
  affiliate_platform: string;
  short_description: string;
  full_description: string;
  features: string[]; // Array of strings representing bullet points
  specs: Record<string, string>; // Technical specs as key-value pairs
  pros: string[];
  cons: string[];
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  is_trending?: boolean;
  is_deal?: boolean;
  deal_end_time?: string; // e.g. "05h 20m" or IsoString
}

export interface Category {
  name: string;
  slug: string;
  icon: string;
  product_count: number;
}

export interface Blog {
  title: string;
  slug: string;
  image: string;
  category: string;
  date: string;
  excerpt: string;
  content: string;
  read_time: string;
}

// Custom Error Class
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Resilient Fetch with Retry and Exponential Backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 300): Promise<any> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      throw new ApiError(res.status, `HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    if (retries > 0) {
      console.warn(`API call failed. Retrying in ${backoff}ms... (${retries} left)`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

// Google Apps Script endpoint rewriting helper
function getFullUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (!baseUrl) return '';

  // If using Google Apps Script deployment URL, map path/params to query params
  if (baseUrl.includes('script.google.com')) {
    const url = new URL(baseUrl);
    
    // Parse the REST path to pass as endpoints
    if (path.startsWith('/products/')) {
      const slug = path.split('/products/')[1];
      url.searchParams.set('endpoint', 'product-detail');
      url.searchParams.set('slug', slug);
    } else if (path.startsWith('/products')) {
      url.searchParams.set('endpoint', 'products');
    } else if (path.startsWith('/categories')) {
      url.searchParams.set('endpoint', 'categories');
    } else if (path.startsWith('/featured-products')) {
      url.searchParams.set('endpoint', 'featured');
    } else if (path.startsWith('/trending-products')) {
      url.searchParams.set('endpoint', 'trending');
    } else if (path.startsWith('/deals')) {
      url.searchParams.set('endpoint', 'deals');
    } else if (path.startsWith('/search')) {
      const q = path.split('q=')[1] || '';
      url.searchParams.set('endpoint', 'search');
      url.searchParams.set('q', decodeURIComponent(q));
    } else if (path.startsWith('/related-products')) {
      const slug = path.split('slug=')[1] || '';
      url.searchParams.set('endpoint', 'related');
      url.searchParams.set('slug', decodeURIComponent(slug));
    } else if (path.startsWith('/blog/')) {
      const slug = path.split('/blog/')[1];
      url.searchParams.set('endpoint', 'blog-detail');
      url.searchParams.set('slug', slug);
    } else if (path.startsWith('/blogs')) {
      url.searchParams.set('endpoint', 'blogs');
    }
    
    return url.toString();
  }

  // Otherwise treat as standard REST API
  return `${baseUrl}${path}`;
}

// Helper to determine if API is active
const isApiConfigured = () => typeof process.env.NEXT_PUBLIC_API_URL === 'string' && process.env.NEXT_PUBLIC_API_URL.length > 0;

let cachedClientProducts: Product[] = [];
let clientCacheTime = 0;

async function fetchProductsFromApi(): Promise<Product[]> {
  const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
  if (!isSheetConfigured) return mockProducts;

  const now = Date.now();
  if (cachedClientProducts.length > 0 && now - clientCacheTime < 60000) {
    return cachedClientProducts;
  }

  try {
    let baseUrl = '';
    if (typeof window === 'undefined') {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    }
    const res = await fetch(`${baseUrl}/api/products`);
    if (!res.ok) throw new Error('API products fetch failed');
    const data = await res.json();
    if (data && data.products) {
      cachedClientProducts = data.products;
      clientCacheTime = now;
      return data.products;
    }
    return mockProducts;
  } catch (err) {
    console.error('Error fetching sheet products from Next.js server API:', err);
    return mockProducts;
  }
}

// Dynamic API Services with Mock Data Fallbacks
export const api = {
  async getProducts(category?: string, sort?: string, page = 1, limit = 12): Promise<{ products: Product[]; total: number }> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      let filtered = isSheetConfigured 
        ? (await fetchProductsFromApi()).filter((p) => p.status === 'Active')
        : mockProducts.filter((p) => p.status === 'Active');

      if (category && category.toLowerCase() !== 'all') {
        filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
      }
      
      // Sorting
      if (sort === 'Price: Low to High') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === 'Price: High to Low') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sort === 'Highest Discount') {
        filtered.sort((a, b) => b.discount_percentage - a.discount_percentage);
      } else if (sort === 'Most Popular') {
        filtered.sort((a, b) => b.review_count - a.review_count);
      }

      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      return { products: paginated, total: filtered.length };
    }

    let path = `/products?page=${page}&limit=${limit}`;
    if (category) path += `&category=${encodeURIComponent(category)}`;
    if (sort) path += `&sort=${encodeURIComponent(sort)}`;

    return fetchWithRetry(getFullUrl(path));
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = isSheetConfigured ? await fetchProductsFromApi() : mockProducts;
      const found = list.find((p) => p.product_slug === slug && p.status === 'Active');
      if (!found) throw new ApiError(404, 'Product not found');
      return found;
    }
    return fetchWithRetry(getFullUrl(`/products/${slug}`));
  },

  async getCategories(): Promise<Category[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      if (isSheetConfigured) {
        const list = (await fetchProductsFromApi()).filter(p => p.status === 'Active');
        return mockCategories.map(cat => ({
          ...cat,
          product_count: list.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length
        }));
      }
      return mockCategories;
    }
    return fetchWithRetry(getFullUrl('/categories'));
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = isSheetConfigured ? await fetchProductsFromApi() : mockProducts;
      return list.filter((p) => p.status === 'Active').slice(0, 4);
    }
    return fetchWithRetry(getFullUrl('/featured-products'));
  },

  async getTrendingProducts(): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = isSheetConfigured ? await fetchProductsFromApi() : mockProducts;
      return list.filter((p) => p.status === 'Active').slice(2, 6);
    }
    return fetchWithRetry(getFullUrl('/trending-products'));
  },

  async getDeals(): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = isSheetConfigured ? await fetchProductsFromApi() : mockProducts;
      return list.filter((p) => p.status === 'Active').slice(0, 4);
    }
    return fetchWithRetry(getFullUrl('/deals'));
  },

  async searchProducts(query: string): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      const list = isSheetConfigured ? await fetchProductsFromApi() : mockProducts;
      return list.filter(
        (p) =>
          p.status === 'Active' &&
          (p.product_name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.subcategory.toLowerCase().includes(q))
      );
    }
    return fetchWithRetry(getFullUrl(`/search?q=${encodeURIComponent(query)}`));
  },

  async getRelatedProducts(slug: string): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = isSheetConfigured ? await fetchProductsFromApi() : mockProducts;
      const product = list.find((p) => p.product_slug === slug);
      if (!product) return [];
      return list
        .filter((p) => p.product_slug !== slug && p.category === product.category && p.status === 'Active')
        .slice(0, 4);
    }
    return fetchWithRetry(getFullUrl(`/related-products?slug=${encodeURIComponent(slug)}`));
  },

  async getBlogs(): Promise<Blog[]> {
    if (!isApiConfigured()) {
      return mockBlogs;
    }
    return fetchWithRetry(getFullUrl('/blogs'));
  },

  async getBlogBySlug(slug: string): Promise<Blog> {
    if (!isApiConfigured()) {
      const found = mockBlogs.find((b) => b.slug === slug);
      if (!found) throw new ApiError(404, 'Blog post not found');
      return found;
    }
    return fetchWithRetry(getFullUrl(`/blog/${slug}`));
  }
};

// --- MOCK DATABASE DATA (Synchronized with Stitch design spec & assets) ---

const mockCategories: Category[] = [
  { name: 'Electronics', slug: 'electronics', icon: 'devices', product_count: 1200 },
  { name: 'Fashion', slug: 'fashion', icon: 'checkroom', product_count: 850 },
  { name: 'Beauty', slug: 'beauty', icon: 'face_5', product_count: 400 },
  { name: 'Home', slug: 'home', icon: 'home', product_count: 620 },
  { name: 'Sports', slug: 'sports', icon: 'fitness_center', product_count: 230 },
  { name: 'Toys', slug: 'toys', icon: 'toys', product_count: 150 },
];

const mockProducts: Product[] = [
  {
    product_id: 'prod_001',
    product_name: 'Pro-Stream ANC Wireless Headphones Z-100',
    product_slug: 'pro-stream-anc-wireless-headphones-z-100',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDupsDSlrP793A4em0ROW7uptniSGqCnivXyteSCW6KHjxrOz1G2jDi0Kg7UCDIyOx9AD-9bUTrT7PoiYzyNjWNRPqcMqsgjfYuTSrHbclRGxMPKRS-pRhbeZ-5XpPvRvmTUDddFmHdBq2vdm420qI1VhsJ4R-OCZX59r4d3Srjaq45EYOtyfPI_nhkkeI5T3QeamdApr79b2ynlsuxu247TzicQSnKUBzBJT8wqxh393oGHZL9pgT1sJTdYuHGP3Bmfx351FVlCI0',
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'Sony',
    price: 299.00,
    mrp: 349.00,
    discount_percentage: 15,
    available_quantity: 45,
    rating: 4.8,
    review_count: 1248,
    affiliate_url: 'https://amazon.com',
    affiliate_platform: 'Amazon',
    short_description: 'Industry-leading Active Noise Cancellation with dual sensors and custom smart equalizer settings.',
    full_description: 'Escape the noise and elevate your audio experience with the Pro-Stream Z-100. Featuring high-precision 40mm Liquid Crystal Polymer drivers, dual noise sensing microphones, and an ergonomic lightweight fit. Experience pure, unadulterated high-resolution audio whether you are listening to your favorite playlist in a busy café or working in a corporate office.',
    features: [
      'Industry-leading Active Noise Cancellation with dual sensors.',
      '30-hour battery life with 10-minute quick charge.',
      'Multipoint connection for seamless device switching.',
      'High-resolution LDAC codec support.'
    ],
    specs: {
      'Driver Size': '40mm Liquid Crystal Polymer (LCP)',
      'Bluetooth Version': '5.2 (LDAC, AAC, SBC)',
      'Frequency Response': '4Hz - 40,000Hz',
      'Weight': '254g (8.96 oz)',
      'Sensors': 'Dual Noise Sensor, Proximity Sensor'
    },
    pros: [
      'Incredible noise isolation technology',
      'Lightweight and ergonomic design',
      'Rich, balanced audio profile',
      'Superior microphone quality for calls'
    ],
    cons: [
      'Premium price point compared to rivals',
      'Carrying case is somewhat bulky',
      'Touch controls take time to master'
    ],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_featured: true,
  },
  {
    product_id: 'prod_002',
    product_name: 'ProStream K9 Mechanical Keyboard',
    product_slug: 'prostream-k9-mechanical-keyboard',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj1fTlIcIMoOVzRBl_c8DsVdYhlClUXS2pUMrRF3XK4LtVsauFd7YTiT3FbrGvz8ximWaiaUsvMNV1u21Pe7wWZopb7Jo-pR4genryZlyNgyRadHwNsKhglwNS6zQJ0PMAvcAaMp-_0FaO_po2F5mk0nFupcc2MqVU8T2-NYXuQPT-yX_57wCZ0cFhRMZ_Gu1QJyAHAidDekfChEuq5OSlIt0aZ_ENw98o1CIw-rFSWJtqUnvgiBdOCcwbrBKgyyj95iVph3-7wRY',
    category: 'Electronics',
    subcategory: 'Peripherals',
    brand: 'Logitech',
    price: 189.00,
    mrp: 199.00,
    discount_percentage: 5,
    available_quantity: 25,
    rating: 4.8,
    review_count: 2100,
    affiliate_url: 'https://amazon.com',
    affiliate_platform: 'Amazon',
    short_description: 'Hot-swappable mechanical gaming keyboard with premium PBT keycaps and 8K polling rate.',
    full_description: 'The ProStream K9 is built for ultimate precision and speed. Outfitted with custom pre-lubed linear switches and double-shot PBT keycaps that resist fading, this keyboard is ready for intensive coding or heavy competitive gaming sessions.',
    features: [
      'Hot-swappable switches with linear pre-lubed profile.',
      'Double-shot PBT keycaps for maximum wear resistance.',
      'Extreme 8000Hz polling rate for sub-millisecond input lag.'
    ],
    specs: {
      'Layout': 'Tenkeyless (TKL)',
      'Connectivity': 'Detachable USB-C',
      'Backlight': 'Per-key custom RGB'
    },
    pros: ['Super responsive linear switches', 'Sturdy aluminum build quality', 'Highly custom companion app'],
    cons: ['Lacks a numeric keypad', 'Premium price tag'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_trending: true
  },
  {
    product_id: 'prod_003',
    product_name: 'EliteClick X Wireless Mouse',
    product_slug: 'eliteclick-x-wireless-mouse',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYBitS-ucn2kHWgNlbBgTdeR7ZtReGdiM-FnUtsTKXNcWlnjuUXZyg2bfXHxl34Erznt0GKsRblAL5TDWWNPGvYb8Q-8sTcwwBYgr0_pxkT_sdOjM5iVJC77k2O_uVC9us7ZSfbFgw4_3qq3mFsLCkgvQBJAHtsZ6rH_-3IF-c4-dNbrcvDFUGb-9_4yAZ2VIg-TbCtPILlF56feMX7b4v0jhBWXx_42WxJ-rqqOMRI1VSVhGp2nEuCohszN_ijHH6I2xOnCiDvUA',
    category: 'Electronics',
    subcategory: 'Peripherals',
    brand: 'Razer',
    price: 124.50,
    mrp: 149.00,
    discount_percentage: 16,
    available_quantity: 12, // Limited stock (1-20)
    rating: 4.5,
    review_count: 850,
    affiliate_url: 'https://amazon.com',
    affiliate_platform: 'Amazon',
    short_description: 'Ultra-lightweight wireless professional mouse with optical switches and 200 hours battery life.',
    full_description: 'At only 65 grams, the EliteClick X is designed for professional esports and daily productivity. Featuring Razer Focus Pro 30K optical sensor for flawless tracking on any surface, including glass.',
    features: [
      '65g ultra-lightweight ergonomic shape.',
      'Optical mouse switches rated for 90 million clicks.',
      'Up to 200 hours of continuous wireless usage.'
    ],
    specs: {
      'Weight': '65 grams',
      'Sensor': 'Focus Pro 30K Optical Sensor',
      'Connectivity': '2.4Ghz Wireless / Bluetooth'
    },
    pros: ['Incredibly lightweight', 'Flawless tracking sensor', 'Insane battery longevity'],
    cons: ['USB dongle is very tiny and easy to lose'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_trending: true
  },
  {
    product_id: 'prod_004',
    product_name: 'AudioPure Pro Headphones',
    product_slug: 'audiopure-pro-headphones',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5-PfEaoS9I6amMmLN7mXe66KcSQZevBsrw3igtCd1LhD-_Nz5louF7I3Z9iv9WLW7Q2l67yIk7OPXVDXDlqh0L_GZm6-hovhQw-bXWGJmswJinKmds_ySZ_r_FZj6sCPfK4fgzX4_kaUSh3rHdnTeYOPvkaSBqzSQteyk5MPqrVIUlaIv92WxBl9smC1l75i8W_jsQbgBehUJwAjW0RAY2493isiNof1HQLyxCgVR7J3yqNZouOOzpRRS2VDmEk3ylE-0dbHwphw',
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'Sennheiser',
    price: 299.99,
    mrp: 349.99,
    discount_percentage: 14,
    available_quantity: 5, // Limited stock (1-20)
    rating: 4.9,
    review_count: 1200,
    affiliate_url: 'https://amazon.com',
    affiliate_platform: 'Amazon',
    short_description: 'High-end audiophile closed-back headphones featuring 45dB noise reduction and lossless audio support.',
    full_description: 'Expertly tuned by Sennheiser engineers, the AudioPure Pro brings professional studio grade acoustics to a consumer headphone. Ideal for podcasters, audio engineers, and discriminating music lovers.',
    features: [
      '45dB active noise reduction technology.',
      'AptX Adaptive lossless audio stream compatibility.',
      'Multi-device synchronization.'
    ],
    specs: {
      'Driver': '38mm Dynamic Transducer',
      'Noise Reduction': '45dB Hybrid ANC',
      'Battery': '40 hours with ANC active'
    },
    pros: ['Remarkably flat and transparent sound signature', 'Ultra-comfortable memory foam cushions'],
    cons: ['Does not support folding completely flat'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_featured: true
  },
  {
    product_id: 'prod_005',
    product_name: 'VisionStack 4K Dual Monitor',
    product_slug: 'visionstack-4k-dual-monitor',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFPcccKPUCLzaGqI06xbIJoGfhWZSRLH3dtaphLWPnsQmkYSOBcOuITOPh2FWrKGgFGwKwEcVvWYUhaTXs_2vLvgd8B7wyhjUSBeHMnCf1wGXcT9gc_A2lQaI1JqHYNTksuYC98Rdtn2AEWbRVN5DqeELqbt87hKu8I1kc-F8thMqcodw9n1hg81-ujD8KAT4YC3xvh8JmBEL86t8TKIF9ACr4rgESidujuGibCsmLsrYSXzxGTw4puVtJKV3MsT3rzo8S6PD2sKw',
    category: 'Electronics',
    subcategory: 'Monitors',
    brand: 'Dell',
    price: 450.00,
    mrp: 499.00,
    discount_percentage: 10,
    available_quantity: 0, // Out of stock (0)
    rating: 4.7,
    review_count: 430,
    affiliate_url: 'https://amazon.com',
    affiliate_platform: 'Amazon',
    short_description: 'Professional 27-inch 4K IPS monitors with daisy-chaining capability and 144Hz refresh rate.',
    full_description: 'Boost your visual productivity with dual 4K IPS panels. Delivers outstanding color accuracy (99% sRGB) and comes with a modular dual monitor arm for clean organization.',
    features: [
      'Ultra HD 3840x2160 pixels IPS panel.',
      '144Hz refresh rate with AMD FreeSync support.',
      'USB-C Power Delivery up to 90W.'
    ],
    specs: {
      'Screen Size': '27 inches (x2)',
      'Resolution': '3840 x 2160 UHD',
      'Panel Type': 'IPS Panel'
    },
    pros: ['Flawless color accuracy', 'Built-in USB hub', 'Includes heavy-duty monitor arm mounts'],
    cons: ['Requires multiple high-bandwidth video outputs on source computer'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z'
  },
  {
    product_id: 'prod_006',
    product_name: 'Minimalist Zenith Smartwatch',
    product_slug: 'minimalist-zenith-smartwatch',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjs0ZHTLQI9k1PwkbeSGzRMC8uMEdfwzku1kAE0FCL339WatPaDugVc4yg1GEQgdxzKwgRuGqxR_pBlYl7L-fkTF3UwdoJRxDTjIGvU5QGnM2keW0kXLrVmsWa6Sd3cvOGJNyWOqUO6QHED1Vw2nm23yEQchApVql937HwDKOgEkFvQr-Wp1MZeEmpmv_uQtD7EIQ6h8K9ls15B1Co9gkTEhVkO6deCdm2S2wH31F8auV0UShCNpctF9Id7Fw2sPqqt0QvNOiH3zk',
    category: 'Electronics',
    subcategory: 'Wearables',
    brand: 'Zenith',
    price: 2499, // INR representation
    mrp: 4999,
    discount_percentage: 50,
    available_quantity: 80,
    rating: 4.8,
    review_count: 120,
    affiliate_url: 'https://amazon.in',
    affiliate_platform: 'Amazon',
    short_description: 'Sleek smartwatch with metallic bezel, AMOLED screen, and custom step trackers.',
    full_description: 'Track your health in style. Combining classic watch design aesthetics with state-of-the-art smartwatch features like blood oxygen monitoring, heart rate alarm, and active GPS tracking.',
    features: ['Crisp AMOLED display.', 'Classic round metallic body.', 'Waterproof IP68 certified.'],
    specs: {
      'Display': '1.43" AMOLED',
      'Battery Life': '14 Days standard use',
      'Sensors': 'Optical heart rate, Accelerometer'
    },
    pros: ['Very premium metal casing', 'Incredible 14-day battery life'],
    cons: ['NFC payments not supported in some regions'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_trending: true
  },
  {
    product_id: 'prod_007',
    product_name: 'SonicFlow Noise-Canceling Headphones',
    product_slug: 'sonicflow-noise-canceling-headphones',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBowXNlD566RNzc-8sMKj9TJUFpcsTqNH9o7jUrCby7DQHykJ3EvXVIl3R_FZXutB9g1j2gJQreUNAzsaBsoepUMx7QFGibyDm5UyuuIsezbOSD6FrHGgVSceLTHEVqVQ-P-hswVzjgtyQHH6CxG8UkP9bvMierw3ee3Zo0rmI00-NpgNzgasRZB8yW9uxjqOXB0s_k_UTIygEOvfhBmlWgjU5z_knA-vSzsGUCmikaddMMK9O0-Xr8qnY6yMAHYkxukyLVoXSnFBk',
    category: 'Electronics',
    subcategory: 'Audio',
    brand: 'SonicFlow',
    price: 8999,
    mrp: 12999,
    discount_percentage: 30,
    available_quantity: 35,
    rating: 4.9,
    review_count: 850,
    affiliate_url: 'https://flipkart.com',
    affiliate_platform: 'Flipkart',
    short_description: 'High-end wireless noise-canceling headphones in sleek matte black finish.',
    full_description: 'High fidelity audio paired with adaptive noise cancellations that monitors ambient background noises up to 1000 times a second to isolate you in pure acoustic luxury.',
    features: ['Adaptive Active Noise Cancellation.', '40-hour playtime.', 'Matte black anti-scratch surface.'],
    specs: {
      'Drivers': '40mm custom dynamic',
      'Playtime': '40 Hours (ANC On)',
      'Weight': '260g'
    },
    pros: ['Very powerful low-end bass', 'Comfortable earcups for long flights'],
    cons: ['Companion app requires mandatory signup'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_trending: true
  },
  {
    product_id: 'prod_008',
    product_name: 'AeroPace Performance Runners',
    product_slug: 'aeropace-performance-runners',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFXx1ZGPFtRc85zutpCnBjBJlfdb5xlV3_q5QETubNTbNfoD--6ABx50A2Tl7z7SQ0oucvpORqtXo16LozftyVfSuXoi3M8h3CNavb-rnPV2dXV-Ozfus2REEEZlCguhf-XzdGo0jqP6fjcqY4FCLetiPwteopC8rvpLx_HnYgxNCxKt0p-uYat2uNZC8-UnZs_lrdjdhsei5fJe6CZX2cu9AHILiKSuVHfIhZlWejd9MnrfnMHe1wDPk_GPMbCydNUH9qVwwfHE8',
    category: 'Fashion',
    subcategory: 'Footwear',
    brand: 'Nike',
    price: 3499,
    mrp: 5499,
    discount_percentage: 36,
    available_quantity: 15, // Limited stock (1-20)
    rating: 4.7,
    review_count: 50,
    affiliate_url: 'https://nike.com',
    affiliate_platform: 'Nike Store',
    short_description: 'Red professional running shoes optimized for marathon training and maximum rebound.',
    full_description: 'Featuring dynamic foam pods and reinforced meshes, these shoes help prevent runners fatigue and deliver up to 8% higher energy returns than standard trainers.',
    features: ['Dynamic rebound foam pods.', 'Breathable mesh weave.', 'Reinforced heel cup.'],
    specs: {
      'Usage': 'Marathon / Training',
      'Weight': '210g per shoe',
      'Heel Drop': '8mm'
    },
    pros: ['Very springy feedback', 'Vibrant red color stands out'],
    cons: ['Snug fit; may need to size up'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_featured: true
  },
  {
    product_id: 'prod_009',
    product_name: 'NexPad Ultra 12 Pro Tablet',
    product_slug: 'nexpad-ultra-12-pro-tablet',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfoKDCbDVGTXqQusa6EP6e5btOH6O5Rxu5yMpRQb-Ls8CTujgdZE7-DpBrdqDEfdxYJ8x8lAZqk_B9lP1gywKGOcMLdIahjkJsmysBBChSnQiwYWHUvAc4fB6Lci-d6s2JQ2tuYS1WE2bwGDU50-JwvSEcBqPQcP1niA_3phWbaA2BlRo3qTuG4GzNzKAIx9vBbWVTQ7fOZU-GQjpv6m-mUhMWpcVfesLeyeJa66dE1qqjqiZOe1mL4xk-63-lp_18lwmw-wWrVsM',
    category: 'Electronics',
    subcategory: 'Tablets',
    brand: 'Apple',
    price: 45999,
    mrp: 52999,
    discount_percentage: 13,
    available_quantity: 40,
    rating: 4.9,
    review_count: 310,
    affiliate_url: 'https://apple.com',
    affiliate_platform: 'Apple Store',
    short_description: '12-inch tablet with vibrant liquid retina panel and extreme graphics capability.',
    full_description: 'Perfect for artists, video editors, and mobile professionals. Supports pen gestures and keyboard cover attachments.',
    features: ['Liquid Retina edge-to-edge display.', 'M2 High-performance processor.', 'Support for precision writing pen.'],
    specs: {
      'Screen Size': '12.4 inches',
      'Processor': 'M2 chip',
      'Storage options': '128GB / 256GB'
    },
    pros: ['Stunning high-refresh display', 'Incredible processing capabilities'],
    cons: ['Stylus pen sold separately'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z'
  },
  {
    product_id: 'prod_010',
    product_name: 'Pro UltraBook 14"',
    product_slug: 'pro-ultrabook-14',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGPZgIxmqtI4ibMJrFTAy8spoEqPLlLxQjtJmigv27X75MZxRIENSi2i1fWvE4dLc1QMkNRnWtk4W8eaCv77dABpBsoZZAr2-3zhX7Yp4dz0ELM5lnY9JMnHHNJNxPaZ5jT8hoxUWH02LGp2WDxxJ0Nrz6aEibmf-oaxZ5XYLazIVoauScByLJFRS-OPTeIJPNQ9tYVPkzNtTVpAH83wrFWLRD41pkBzAy0zd1mZ09ovk8MJ4mixZSJIiT_l7JB4q7e0EhzvKHiks',
    category: 'Electronics',
    subcategory: 'Computers',
    brand: 'Asus',
    price: 54990,
    mrp: 91650,
    discount_percentage: 40,
    available_quantity: 22,
    rating: 4.8,
    review_count: 145,
    affiliate_url: 'https://amazon.in',
    affiliate_platform: 'Amazon',
    short_description: 'Super thin laptop with aluminum casing, 10-core processing, and full workday battery life.',
    full_description: 'Run heavy IDEs and graphic sheets simultaneously without breaking a sweat. Includes a beautiful high contrast keyboard.',
    features: ['CNC aluminum lightweight shell.', '10-core mobile processor.', 'Thin profile bezel display.'],
    specs: {
      'Processor': 'Intel Core i7 10-Core',
      'RAM': '16GB DDR5',
      'Storage': '512GB NVMe SSD'
    },
    pros: ['Lightweight and portable', 'Fast charging support'],
    cons: ['Limited expansion ports (USB-C only)'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_deal: true,
    deal_end_time: '05h 20m'
  },
  {
    product_id: 'prod_011',
    product_name: 'Classic Leather Chrono',
    product_slug: 'classic-leather-chrono',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxLvLYG68LGzMB3viFqoBO_Qk31teLosrnmz55cDaA3WI8ExTiM5atXHOrRjyc0lAjDHReFkcdh0-wT8zW4W_jk-zm-96gSqTAPPD8IqzjY_vlbTgddQK-NS5rV_mY3CKDFcxH9iFRrhNM61wRYIbgk_JIv5x28av1VbG8zSEHPBiDE9fgjpB4DgX5fgEuZc17VLQJQf3NcePiYGZPsg9VrcJzYxwMJL7DYINvensqKDLI7NSZlHjA1k4edUbwHQhxLL0KfIdLD0w',
    category: 'Fashion',
    subcategory: 'Watches',
    brand: 'Fossil',
    price: 1299,
    mrp: 1999,
    discount_percentage: 35,
    available_quantity: 8, // Limited stock (1-20)
    rating: 4.4,
    review_count: 85,
    affiliate_url: 'https://amazon.in',
    affiliate_platform: 'Amazon',
    short_description: 'Mechanical wristwatch with a tan leather strap and stainless steel bezel.',
    full_description: 'Timeless style meets modern mechanics. A beautiful watch featuring three dial indicators and premium tanned cowhide leather straps.',
    features: ['Genuine cowhide leather straps.', 'Three multi-dial tracking faces.', '30m water resistance.'],
    specs: {
      'Strap Material': 'Genuine Leather',
      'Case Diameter': '42mm',
      'Glass Type': 'Mineral Glass'
    },
    pros: ['Very elegant design', 'Affordable pricing'],
    cons: ['Needs manual time corrections once in a while'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_deal: true,
    deal_end_time: '12h 45m'
  },
  {
    product_id: 'prod_012',
    product_name: 'Nike Air Max Performance',
    product_slug: 'nike-air-max-performance',
    product_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTENKevO7Ccnr1Hy-96s4SHKQfgCfG6dAHxSugvIJQ3NBJ4X2RaOkHWZ9zt3-EBHOXaD5xQfQrMKSQxtjf2mv_Ah7KqxqlIb-FyqlZS9PjPdqYZRChH4iWlLdc1FWxWmZDmcvWG2iIP3lWgS_wmSgnWl9_o8iMDsKVGL7ZElfYUzqCCZqp5tg8PJhbYd85abs3CsKZMtpFYu7xwJ1CLrsuVyH7crXzxw9lqOTRyIVAppxYz9ddl8VOHnJ3uKJ_f0IuOexKgAycbJc',
    category: 'Fashion',
    subcategory: 'Footwear',
    brand: 'Nike',
    price: 120.00,
    mrp: 180.00,
    discount_percentage: 30,
    available_quantity: 34,
    rating: 4.9,
    review_count: 560,
    affiliate_url: 'https://amazon.com',
    affiliate_platform: 'Amazon',
    short_description: 'Sleek, modern red sports sneaker with high-performance cushion pads.',
    full_description: 'Designed for daily comfort and intensive runs. High-quality rubber sole with visible air pod units that deliver maximum protection against foot impacts.',
    features: ['Visible Air Cushion pods.', 'Durable structured mesh.', 'Grippy waffle rubber outsoles.'],
    specs: {
      'Material': 'Mesh / Synthetic leather',
      'Sole Type': 'Cushion rubber Air',
      'Colorway': 'Varsity Red / Black'
    },
    pros: ['Very stylish colorway', 'Unmatched impact cushioning'],
    cons: ['Attracts dirt easily due to mesh gaps'],
    status: 'Active',
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-05T00:00:00Z',
    is_featured: true
  }
];

const mockBlogs: Blog[] = [
  {
    title: '10 Things to Consider Before Buying a New Laptop in 2026',
    slug: '10-things-to-consider-before-buying-a-new-laptop-in-2026',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBln0p5laIIf3r6mP-JM3kwzfWTVgspeElS8VIYBbTqCm39y1pV32sKhsKp8TYXJPlXg62jNLFwDo-0MJKGxIxboNnReFPXu1aw_jTiCwiXNJBFgOpZnDjFRQpI3ihzgSg_HHYVtHfyzUheNnw6iYvFbxB7rl8dR3by6Ibr-jz8n5ZrdiQW5U00xSrl29SwAUshVFuwTLiD-lrh2CXX0xjen3dx0fsNGbPp0L41nAX056D5Xt9eLu5_SDa6voH8q0XrxmnP5hGchts',
    category: "Buyer's Guide",
    date: 'June 5, 2026',
    read_time: '6 min read',
    excerpt: 'Our expert panel reviews the latest processing units and display technologies to help you choose the perfect machine.',
    content: 'Choosing a new laptop in 2026 can be overwhelming given the rapid shifts in AI-accelerated processors and display technologies. Our experts have analyzed the top-performing laptops on the market to help you make an informed decision.\n\nFirst, consider your processor requirements. Intel Core Ultra and Apple M-series chips now offer dedicated Neural Processing Units (NPUs) that handle AI calculations directly on the device, saving battery and keeping data private. Second, focus on screen quality. OLED panels have become highly affordable and offer infinitely deep blacks and contrast. Lastly, always look for at least 16GB of unified memory or RAM, as newer web applications require heavier footprints.'
  },
  {
    title: 'How to Stack Coupons and Get Maximum Discounts Online',
    slug: 'how-to-stack-coupons-and-get-maximum-discounts-online',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7tLUPFZnREqwYRC4gpjcu44WKttgY7VUASHVwRExdmAFCFeUdxtKjN0TMHH_w80XfTxerxpz9FG0UsdqiD0RitM9i34VQE9Ii96EBJZmFYuL_fZSKhS2SJYW91KoxWMrujdAIGoyG6D3QMfd5oq9PF0V2KYgHgkbATndZiwh7ENZD9t9fNHo2rHf57zweSXMNr3mMuzI1nsyOg8vzvAy_IW9QOEEIldSaqsm8kbJO14ktZt2tOwBKAdq71tgWskjRi3h0DY5XbXI',
    category: 'Money Saving',
    date: 'June 4, 2026',
    read_time: '4 min read',
    excerpt: 'Unlock the secrets of digital couponing and seasonal sales cycles with our comprehensive guide.',
    content: 'To maximize your savings, you must understand the art of stacking coupons. Start by combining store-wide discount codes with payment gateway incentives. Often, using a specific credit card will unlock an additional 5% to 10% off. Additionally, track verified deals that offer cashback rewards. By registering with discount trackers and buying during flash sales, you can shave off up to 50% on electronics and lifestyle wear.'
  },
  {
    title: "The Rise of Smart Home Tech: What's Worth the Hype?",
    slug: 'the-rise-of-smart-home-tech-whats-worth-the-hype',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdb-L3NrcjnzhFD6mp8c-DR_PwvfI95VdKxsqOyPOB4nJopXKTc0B6h5o3lMzYNj-aR-0zYCTRqzCBl6s18qWPBH1Ndj0g1Hea9KPIgjZ46XvxHVRtITWE87KVzKEQNjH_g0clJopSHbCrrzAJ2LAyTgi7Qv6TFYvlvwGdod1dxcIi8upE12n0xr5uIWByIdktUAoUozUcp3uf9HKz2CKjeVg3e24Mqw3XXMEEqaEwOUBi3qdE14ibzveu-AbdGqtVbrUoD5Kzfm4',
    category: 'Trend Report',
    date: 'June 2, 2026',
    read_time: '5 min read',
    excerpt: "We separate the essential smart devices from the gimmicks in this year's home automation roundup.",
    content: 'Smart home automation is more popular than ever, but not every gadget is worth your hard-earned money. We separate the essential items from the gimmicks. Smart plugs and thermostat links remain highly useful for saving power bills. Similarly, automated security cameras with object recognition add peace of mind. However, complex smart refrigerators and automated window sweeps are often overpriced and prone to connectivity issues.'
  }
];
