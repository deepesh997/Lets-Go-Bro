import { NextResponse } from 'next/server';

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') { entry += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim()); entry = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(entry.trim());
      lines.push(row);
      row = []; entry = '';
    } else {
      entry += char;
    }
  }
  if (entry || row.length > 0) { row.push(entry.trim()); lines.push(row); }
  return lines;
}

// ─── Slugify ──────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

// ─── Resolve Amazon short links ───────────────────────────────────────────────
async function resolveRedirects(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.url;
  } catch {
    return url;
  }
}

// ─── Scrape Amazon Product ────────────────────────────────────────────────────
async function scrapeAmazonProduct(affiliateUrl: string): Promise<any> {
  try {
    const resolvedUrl = await resolveRedirects(affiliateUrl);

    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const html = await response.text();

    // Title
    let title = '';
    const titleMatch = html.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    } else {
      const parts = new URL(resolvedUrl).pathname.split('/');
      const slug = parts.find(p => p && p !== 'dp' && !p.match(/^B0[A-Z0-9]{8}$/));
      title = slug ? slug.replace(/-/g, ' ') : 'Premium Deal';
    }

    // Price
    const priceWholeMatch = html.match(/class="a-price-whole">([^<]+)/);
    const priceFracMatch  = html.match(/class="a-price-fraction">([^<]+)/);
    const mrpMatch        = html.match(/class="a-text-price"[^>]*>[\s\S]*?class="a-offscreen">([^<]+)/);

    let price = 0;
    let mrp   = 0;

    if (priceWholeMatch) {
      const whole = priceWholeMatch[1].replace(/,/g, '').trim();
      const frac  = priceFracMatch ? priceFracMatch[1].trim() : '00';
      price = parseFloat(`${whole}.${frac}`);
    }
    if (mrpMatch) {
      mrp = parseFloat(mrpMatch[1].replace(/[^\d.]/g, ''));
    }
    if (!price) price = 299;
    if (!mrp || mrp <= price) mrp = Math.round(price * 1.25);

    // Description / Features
    let description = '';
    const descMatch = html.match(/<div id="feature-bullets"[^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch) {
      const items = descMatch[1].match(/<span class="a-list-item">([\s\S]*?)<\/span>/gi);
      if (items) {
        description = items
          .map(item => item.replace(/<[^>]*>/g, '').trim())
          .filter(t => t.length > 0 && !t.includes('Make sure this fits'))
          .join('. ');
      }
    }
    if (!description) description = `${title} — high-quality product available at a great price. Click to view full details and purchase.`;

    // Rating & Reviews
    const ratingMatch  = html.match(/class="a-icon-alt">([^<]+)/) || html.match(/([0-9.]+)\s*out of 5/i);
    const reviewsMatch = html.match(/id="acrCustomerReviewText"[^>]*>([^<]+)/);
    const rating  = ratingMatch  ? parseFloat(ratingMatch[1])                  : 4.5;
    const reviews = reviewsMatch ? parseInt(reviewsMatch[1].replace(/[^\d]/g, '')) : 100;

    // Images
    let images: string[] = [];
    const landingImg = html.match(/id="landingImage"[^>]*src="([^"]+)"/i) || html.match(/src="([^"]+)"[^>]*id="landingImage"/i);
    if (landingImg) images.push(landingImg[1]);

    const dynImg = html.match(/data-a-dynamic-image="([^"]+)"/i);
    if (dynImg) {
      try {
        const parsed = JSON.parse(dynImg[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"'));
        const urls = Object.keys(parsed);
        if (urls.length > 0) images = urls;
      } catch {}
    }

    // Brand
    let brand = '';
    const brandMatch = html.match(/id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/i);
    if (brandMatch) {
      brand = brandMatch[1].replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '').trim()
        .replace(/Visit the\s+/i, '').replace(/\s+Store/i, '').replace(/Brand:\s+/i, '').trim();
    }

    return {
      product_name:     title,
      product_image:    images[0] || '',
      images:           images.slice(0, 5),
      brand:            brand || 'HubPro',
      price,
      mrp,
      discount_percentage: Math.round(((mrp - price) / mrp) * 100),
      full_description: description,
      features:         description.split('. ').filter(f => f.length > 10).slice(0, 5),
      rating:           isNaN(rating)  ? 4.5 : rating,
      review_count:     isNaN(reviews) ? 100 : reviews,
    };
  } catch (e) {
    console.error('Scrape error:', e);
    return null;
  }
}

// ─── In-Memory Cache (works on Vercel serverless) ─────────────────────────────
const memoryCache: Record<string, any> = {
  "https://amzn.to/3RMVDMt": {
    product_name: "Pivalo EVA Waterproof Rain Coat Hooded Universal Outdoor Water Resistant Portable Suit for Men Women Boys & Girls",
    product_image: "https://m.media-amazon.com/images/I/61tKPgUgWAL._SY355_.jpg",
    images: [
      "https://m.media-amazon.com/images/I/61tKPgUgWAL._SY355_.jpg",
      "https://m.media-amazon.com/images/I/61tKPgUgWAL._SY450_.jpg",
    ],
    brand: "Pivalo",
    price: 199,
    mrp: 349,
    discount_percentage: 43,
    full_description: "EVA CONSTRUCTION: Crafted from high-grade EVA material with exceptional water-resistant capabilities. ERGONOMIC HOOD DESIGN: Enhanced head and neck coverage, shielding you from heavy rain. UNIVERSAL COMFY FIT: Designed for all genders and ages with adjustable features. DURABLE AND LIGHTWEIGHT: Remains remarkably lightweight despite robust water-resistant properties. ENHANCED BREATHABILITY: Promotes airflow, reducing internal moisture build-up.",
    features: [
      "High-grade EVA material with exceptional water-resistant capabilities",
      "Ergonomic hood for enhanced head and neck coverage",
      "Universal size fits all genders and ages",
      "Durable and lightweight design",
      "Enhanced breathability for comfort"
    ],
    rating: 3.4,
    review_count: 892,
  }
};

// ─── API Route ────────────────────────────────────────────────────────────────
export async function GET() {
  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  if (!sheetId) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SHEET_ID not set. Add it in Vercel Environment Variables.' },
      { status: 500 }
    );
  }

  try {
    // Fetch sheet CSV — only "Affiliate Link" column matters
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Product+Details`;
    const res = await fetch(sheetUrl, { next: { revalidate: 300 } });
    if (!res.ok) {
      throw new Error(`Sheet fetch failed (${res.status}). Make sure it's shared as "Anyone with the link = Viewer".`);
    }

    const csv   = await res.text();
    const rows  = parseCSV(csv);
    if (rows.length < 2) return NextResponse.json({ products: [] });

    // Find the "Affiliate Link" column index
    const headers  = rows[0].map(h => h.toLowerCase().trim());
    const linkIndex = headers.indexOf('affiliate link');
    if (linkIndex === -1) {
      return NextResponse.json(
        { error: 'Column "Affiliate Link" not found in sheet. Check the header row.' },
        { status: 500 }
      );
    }

    const products: any[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row  = rows[i];
      const link = row[linkIndex]?.trim();
      if (!link) continue; // skip rows with no affiliate link

      // Use cache or scrape fresh
      let data = memoryCache[link];
      if (!data) {
        console.log(`[products] Scraping: ${link}`);
        const scraped = await scrapeAmazonProduct(link);
        if (scraped) {
          data = scraped;
          memoryCache[link] = data;
        } else {
          // Scrape blocked/failed — skip this product
          console.warn(`[products] Skipping ${link} — scrape failed`);
          continue;
        }
      }

      const productName = data.product_name || `Product #${i}`;
      const price       = data.price        || 299;
      const mrp         = data.mrp          || Math.round(price * 1.25);
      const discount    = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const p: any = {
        product_id:          `prod_${i}`,
        product_name:        productName,
        product_slug:        slugify(productName),
        product_image:       data.product_image || '',
        category:            'Electronics',
        subcategory:         'Gadgets',
        brand:               data.brand    || 'HubPro',
        price,
        mrp,
        discount_percentage: discount,
        available_quantity:  50,
        rating:              data.rating       || 4.5,
        review_count:        data.review_count || 100,
        affiliate_url:       link,
        affiliate_platform:  (link.includes('amazon') || link.includes('amzn')) ? 'Amazon' : 'Partner Store',
        short_description:   (data.full_description || '').substring(0, 120) + '...',
        full_description:    data.full_description || '',
        features:            data.features  || [],
        specs:               data.specs     || { Brand: data.brand || 'HubPro' },
        pros:                data.pros      || ['Great price', 'Quality product'],
        cons:                data.cons      || ['Limited stock available'],
        status:              'Active',
        created_at:          new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      };

      // Auto-categorise
      const nl = productName.toLowerCase();
      if      (nl.match(/peeler|vegetable|kitchen|chopper|cooker|grinder/))             { p.category = 'Home';     p.subcategory = 'Kitchen'; }
      else if (nl.match(/glue|adhesive|fabric/))                                        { p.category = 'Home';     p.subcategory = 'Crafts'; }
      else if (nl.match(/cream|ointment|remover|patch|pain|posture|belt|massager/))     { p.category = 'Beauty';   p.subcategory = 'Personal Care'; }
      else if (nl.match(/raincoat|rain coat|umbrella|waterproof suit/))                 { p.category = 'Home';     p.subcategory = 'Rainwear'; }
      else if (nl.match(/shoe|sneaker|sandal|chappal|footwear/))                        { p.category = 'Fashion';  p.subcategory = 'Footwear'; }
      else if (nl.match(/shirt|dress|kurta|top|jeans|saree|lehenga/))                   { p.category = 'Fashion';  p.subcategory = 'Clothing'; }
      else if (nl.match(/phone|mobile|laptop|tablet|earphone|headphone|speaker|watch/)) { p.category = 'Electronics'; p.subcategory = 'Gadgets'; }
      else if (nl.match(/toy|game|puzzle|kids/))                                        { p.category = 'Toys';     p.subcategory = 'Games'; }
      else if (nl.match(/sport|fitness|yoga|gym|dumbbell/))                             { p.category = 'Sports';   p.subcategory = 'Fitness'; }

      products.push(p);
    }

    return NextResponse.json({ products });

  } catch (err: any) {
    console.error('[products API] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
