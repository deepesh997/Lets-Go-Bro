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
  if (!isSheetConfigured) return [];

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
    return [];
  } catch (err) {
    console.error('Error fetching sheet products from Next.js server API:', err);
    return [];
  }
}

// Dynamic API Services with Mock Data Fallbacks
export const api = {
  async getProducts(category?: string, sort?: string, page = 1, limit = 12): Promise<{ products: Product[]; total: number }> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      let filtered = (await fetchProductsFromApi()).filter((p) => p.status === 'Active');

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
      const list = await fetchProductsFromApi();
      const found = list.find((p) => p.product_slug === slug && p.status === 'Active');
      if (!found) throw new ApiError(404, 'Product not found');
      return found;
    }
    return fetchWithRetry(getFullUrl(`/products/${slug}`));
  },

  async getCategories(): Promise<Category[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = (await fetchProductsFromApi()).filter(p => p.status === 'Active');
      return mockCategories.map(cat => ({
        ...cat,
        product_count: list.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length
      }));
    }
    return fetchWithRetry(getFullUrl('/categories'));
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = await fetchProductsFromApi();
      return list.filter((p) => p.status === 'Active').slice(0, 8);
    }
    return fetchWithRetry(getFullUrl('/featured-products'));
  },

  async getTrendingProducts(): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = await fetchProductsFromApi();
      return list.filter((p) => p.status === 'Active').slice(0, 8);
    }
    return fetchWithRetry(getFullUrl('/trending-products'));
  },

  async getDeals(): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const list = await fetchProductsFromApi();
      return list.filter((p) => p.status === 'Active').slice(0, 8);
    }
    return fetchWithRetry(getFullUrl('/deals'));
  },

  async searchProducts(query: string): Promise<Product[]> {
    const isSheetConfigured = typeof process.env.NEXT_PUBLIC_SHEET_ID === 'string' && process.env.NEXT_PUBLIC_SHEET_ID.length > 0;
    
    if (isSheetConfigured || !isApiConfigured()) {
      const q = query.toLowerCase().trim();
      if (!q) return [];
      const list = await fetchProductsFromApi();
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
      const list = await fetchProductsFromApi();
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
      return [];
    }
    return fetchWithRetry(getFullUrl('/blogs'));
  },

  async getBlogBySlug(slug: string): Promise<Blog> {
    if (!isApiConfigured()) {
      throw new ApiError(404, 'Blog post not found');
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

// All product data comes from Google Sheet via /api/products — no mock/dummy data

