import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// RFC 4180 CSV Parser Helper
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim());
      entry = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(entry.trim());
      lines.push(row);
      row = [];
      entry = '';
    } else {
      entry += char;
    }
  }
  if (entry || row.length > 0) {
    row.push(entry.trim());
    lines.push(row);
  }
  return lines;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function resolveRedirects(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { 
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.url;
  } catch {
    return url;
  }
}

// Scrape details from Amazon HTML
async function scrapeAmazonProduct(affiliateUrl: string): Promise<any> {
  try {
    const resolvedUrl = await resolveRedirects(affiliateUrl);
    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const html = await response.text();

    // Parse title
    let title = '';
    const titleMatch = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i);
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    } else {
      // Extract from URL slug
      const pathname = new URL(resolvedUrl).pathname;
      const parts = pathname.split('/');
      const titlePart = parts.find(p => p && p !== 'dp' && !p.startsWith('B0'));
      title = titlePart ? titlePart.replace(/-/g, ' ') : 'Premium Merchant Deal';
    }

    // Parse price
    const priceWholeMatch = html.match(/class="a-price-whole">([^<]+)/);
    const priceFractionMatch = html.match(/class="a-price-fraction">([^<]+)/);
    const mrpMatch = html.match(/class="a-text-price"[^>]*>[\s\S]*?class="a-offscreen">([^<]+)/);

    let price = 299;
    let mrp = 349;

    if (priceWholeMatch) {
      const whole = priceWholeMatch[1].replace(/,/g, '').trim();
      const frac = priceFractionMatch ? priceFractionMatch[1].trim() : '00';
      price = parseFloat(`${whole}.${frac}`);
    }
    
    if (mrpMatch) {
      mrp = parseFloat(mrpMatch[1].replace(/[^\d.]/g, ''));
    }

    if (price && (!mrp || mrp <= price)) {
      mrp = Math.round(price * 1.25);
    }

    // Parse description
    let description = '';
    const descMatch = html.match(/<div id="feature-bullets"[^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch) {
      const listItems = descMatch[1].match(/<span class="a-list-item">([\s\S]*?)<\/span>/gi);
      if (listItems) {
        description = listItems
          .map(item => item.replace(/<[^>]*>/g, '').trim())
          .filter(text => text.length > 0 && !text.includes('Make sure this fits'))
          .join('. ');
      }
    }
    if (!description) {
      description = `Genuine deal for ${title} sourced from our retail merchant partners. High quality and verified product.`;
    }

    // Parse ratings
    const ratingMatch = html.match(/class="a-icon-alt">([^<]+)/) || html.match(/([0-9.]+)\s*out of 5 stars/i);
    const reviewsMatch = html.match(/id="acrCustomerReviewText"[^>]*>([^<]+)/);

    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.5;
    const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/[^\d]/g, '')) : 120;

    // Parse images
    let images: string[] = [];
    const landingImageMatch = html.match(/id="landingImage"[^>]*src="([^"]+)"/i) || html.match(/src="([^"]+)"[^>]*id="landingImage"/i);
    if (landingImageMatch) {
      images.push(landingImageMatch[1]);
    }

    const dynamicImageMatch = html.match(/data-a-dynamic-image="([^"]+)"/i);
    if (dynamicImageMatch) {
      try {
        const parsed = JSON.parse(dynamicImageMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
        const dynamicUrls = Object.keys(parsed);
        if (dynamicUrls.length > 0) {
          images = dynamicUrls;
        }
      } catch {}
    }

    // Parse brand
    let brand = 'HubPro';
    const brandMatch = html.match(/id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/i);
    if (brandMatch) {
      const cleanBrandText = brandMatch[1]
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
      brand = cleanBrandText
        .replace(/Visit the\s+/i, '')
        .replace(/\s+Store/i, '')
        .replace(/Brand:\s+/i, '')
        .trim();
    }

    return {
      product_name: title,
      product_image: images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
      brand,
      price,
      mrp,
      discount_percentage: Math.round(((mrp - price) / mrp) * 100),
      full_description: description,
      rating: isNaN(rating) ? 4.5 : rating,
      review_count: isNaN(reviews) ? 120 : reviews,
      features: description.split('. ').slice(0, 3),
      images: images.slice(0, 4)
    };
  } catch (e) {
    console.error('Error scraping Amazon in API products route:', e);
    return null;
  }
}

export async function GET() {
  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  if (!sheetId) {
    return NextResponse.json({ error: 'Spreadsheet ID not configured' }, { status: 500 });
  }

  const cacheFilePath = path.join(process.cwd(), 'src/services/scraped_cache.json');
  let cache: Record<string, any> = {};

  try {
    const fileContent = await fs.readFile(cacheFilePath, 'utf8');
    cache = JSON.parse(fileContent);
  } catch {
    cache = {};
  }

  try {
    // 1. Fetch Google Sheet CSV
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Product+Details`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Spreadsheet fetch failed');
    
    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return NextResponse.json({ products: [] });
    }

    // Column Indices
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const stockIndex = headers.indexOf('stock');
    const statusIndex = headers.indexOf('status');
    const linkIndex = headers.indexOf('affiliate link');

    const products: any[] = [];
    let cacheUpdated = false;

    // Loop through links to build the product details
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const link = row[linkIndex];
      if (!link || link.trim() === '') continue;

      const stock = parseInt(row[stockIndex]) || 0;
      const status = row[statusIndex] || 'Active';

      let details = cache[link];

      // If not in cache, resolve and scrape
      if (!details) {
        console.log(`Link not cached. Scraping dynamically: ${link}`);
        const scraped = await scrapeAmazonProduct(link);
        if (scraped) {
          details = scraped;
          cache[link] = details;
          cacheUpdated = true;
        } else {
          // Scraper fallback if it fails or gets blocked
          details = {
            product_name: `Premium Deal Product #${i}`,
            product_image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
            brand: 'HubPro',
            price: 299,
            mrp: 349,
            discount_percentage: 15,
            full_description: 'High-quality deal sourced directly from our merchant partners. Click View Deal to get live reviews and purchase options.',
            rating: 4.5,
            review_count: 90,
            features: ['High durability', 'Versatile style', 'Tested product quality']
          };
        }
      }

      // Map dynamic product fields
      const productName = details.product_name;
      const slug = slugify(productName);
      
      const p = {
        product_id: `prod_${i}`,
        product_name: productName,
        product_slug: slug,
        product_image: details.product_image,
        category: 'Electronics', // fallback
        subcategory: 'Gadgets',
        brand: details.brand || 'HubPro',
        price: details.price,
        mrp: details.mrp,
        discount_percentage: details.discount_percentage,
        available_quantity: stock,
        rating: details.rating,
        review_count: details.review_count,
        affiliate_url: link,
        affiliate_platform: link.includes('amazon') || link.includes('amzn') ? 'Amazon' : 'Store Partner',
        short_description: details.full_description.substring(0, 100) + '...',
        full_description: details.full_description,
        features: details.features || ['Premium product', 'Optimal quality'],
        specs: details.specs || { 'Brand': details.brand || 'HubPro', 'Availability': stock > 0 ? 'In Stock' : 'Out of Stock' },
        pros: details.pros || ['Great price', 'Verified quality'],
        cons: details.cons || ['Limited stock'],
        status: status === 'Active' ? 'Active' : 'Inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Classification based on Name
      const nameLower = productName.toLowerCase();
      if (nameLower.includes('peeler') || nameLower.includes('vegetable')) {
        p.category = 'Home';
        p.subcategory = 'Kitchen';
      } else if (nameLower.includes('glue') || nameLower.includes('adhesive') || nameLower.includes('fabric')) {
        p.category = 'Home';
        p.subcategory = 'Crafts';
      } else if (nameLower.includes('remover') || nameLower.includes('ointment') || nameLower.includes('cream') || nameLower.includes('posture') || nameLower.includes('belt') || nameLower.includes('patch')) {
        p.category = 'Beauty';
        p.subcategory = 'Personal Care';
      } else if (nameLower.includes('raincoat') || nameLower.includes('rain coat') || nameLower.includes('umbrella')) {
        p.category = 'Home';
        p.subcategory = 'Rainwear';
      }

      products.push(p);
    }

    // Persist new scraped items to cache file
    if (cacheUpdated) {
      await fs.writeFile(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
      console.log('Product scraped details cache updated successfully.');
    }

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error('Error fetching Google Sheets links:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
