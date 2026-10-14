import { ProductItem } from '../types/index';

export interface ParsedProduct {
  name: string;
  store: ProductItem['store'];
  storeName: string;
  imageUrl: string;
  priceINR: number;
  size?: string;
  colour?: string;
  suggestedSizes: string[];
  suggestedColours: string[];
  category: string;
  brand?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  storeName?: string;
  store?: ProductItem['store'];
  cleanUrl?: string;
  isDirectImage?: boolean;
}

export interface PresetProductOption {
  id: string;
  label: string;
  imageUrl: string;
  category: string;
}

// Kept for type compatibility; unrelated random presets are no longer used for product guessing
export const PRESET_PRODUCT_IMAGES: PresetProductOption[] = [];

/**
 * Checks if a string or URL is a direct image address.
 */
export function isDirectImageUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().split('?')[0].toLowerCase();
  const full = url.trim().toLowerCase();

  return (
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.avif') ||
    clean.endsWith('.gif') ||
    full.includes('.jpg') ||
    full.includes('.jpeg') ||
    full.includes('.png') ||
    full.includes('.webp') ||
    full.includes('rukminim') ||
    full.includes('media-amazon.com/images') ||
    full.includes('images-amazon.com/images') ||
    full.includes('assets.myntassets.com') ||
    full.includes('bbassets.com/media/uploads') ||
    full.includes('adn-static1.nykaa.com') ||
    full.includes('img.tatacliq.com') ||
    full.includes('assets.tatacliq.com') ||
    full.includes('assets.ajio.com')
  );
}

/**
 * Validates a product URL or image link before processing.
 * Disallows invalid strings, non-URLs, or unsupported formats.
 */
export function validateProductUrl(rawUrl: string): ValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter a product URL from Amazon, Flipkart, BigBasket, Myntra, Nykaa, etc.',
    };
  }

  // Handle direct image URL
  if (isDirectImageUrl(trimmed)) {
    return {
      isValid: true,
      cleanUrl: trimmed,
      isDirectImage: true,
      storeName: 'Direct Image Link',
      store: 'other',
    };
  }

  // Format with https:// if user pasted domain directly without protocol
  let urlToTest = trimmed;
  if (!/^https?:\/\//i.test(urlToTest)) {
    urlToTest = `https://${urlToTest}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlToTest);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format. Please paste a valid web link (e.g. https://www.amazon.in/dp/...)',
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Ensure there is a legitimate domain with a dot
  if (!hostname.includes('.') || hostname.length < 4) {
    return {
      isValid: false,
      error: 'Invalid website domain. Please check the product link and try again.',
    };
  }

  // Identify known stores
  let store: ProductItem['store'] = 'other';
  let storeName = hostname.replace(/^www\./, '');

  if (hostname.includes('amazon.')) {
    store = 'amazon';
    storeName = 'Amazon India';
  } else if (hostname.includes('flipkart.')) {
    store = 'flipkart';
    storeName = 'Flipkart';
  } else if (hostname.includes('myntra.')) {
    store = 'myntra';
    storeName = 'Myntra';
  } else if (hostname.includes('nykaa.')) {
    store = 'nykaa';
    storeName = 'Nykaa';
  } else if (hostname.includes('bigbasket.')) {
    store = 'other';
    storeName = 'bigbasket';
  } else if (hostname.includes('ajio.')) {
    store = 'ajio';
    storeName = 'AJIO';
  } else if (hostname.includes('tatacliq.')) {
    store = 'tatacliq';
    storeName = 'Tata CLiQ';
  } else if (hostname.includes('meesho.')) {
    store = 'other';
    storeName = 'Meesho';
  } else if (hostname.includes('croma.')) {
    store = 'other';
    storeName = 'Croma';
  } else if (hostname.includes('reliancedigital.')) {
    store = 'other';
    storeName = 'Reliance Digital';
  }

  return {
    isValid: true,
    cleanUrl: urlToTest,
    store,
    storeName,
    isDirectImage: false,
  };
}

/**
 * Capitalizes every word in a slug or string nicely.
 */
function toTitleCase(str: string): string {
  return str
    .split(/[\s\-_]+/)
    .filter(Boolean)
    .map((word) => {
      // Keep acronyms like ANC, USB, LED, 5G, 4K capitalized
      if (/^(anc|usb|led|5g|4g|hd|fhd|uhd|tv|gb|tb|mb|mah|kg|gm|ml|ltr|cm|mm|uk|us|in)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Extracts clean, human-readable product title from a URL slug or path.
 */
function extractSlugTitle(urlPath: string): { title: string; brand?: string } {
  try {
    const parts = urlPath.split('/').map((p) => p.trim()).filter(Boolean);

    // Filter out typical non-product URL parts, query parameters, and IDs
    const candidates = parts.filter((part) => {
      const clean = part.split('?')[0].split('#')[0].toLowerCase();
      if (
        clean === 'p' ||
        clean === 'dp' ||
        clean === 'pr' ||
        clean === 'gp' ||
        clean === 'pd' ||
        clean === 'product' ||
        clean === 'products' ||
        clean === 'item' ||
        clean === 'items' ||
        clean === 'itm' ||
        clean === 'buy' ||
        clean === 'buy-for-me' ||
        clean.startsWith('itm') ||
        clean.startsWith('p-') ||
        clean.startsWith('~') ||
        clean.startsWith('ref') ||
        clean.startsWith('sspa') ||
        clean.startsWith('qid') ||
        clean.startsWith('sr_') ||
        clean.includes('=') ||
        clean.length < 3 ||
        /^[0-9]+$/.test(clean) ||
        /^[0-9a-f]{8,}$/i.test(clean) ||
        /^[a-z0-9]{10}$/i.test(clean) // Filter out pure 10-char ASINs like B07VZ81MJD
      ) {
        return false;
      }
      return true;
    });

    if (candidates.length > 0) {
      // Find the candidate with the longest slug
      let bestIndex = 0;
      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].length > candidates[bestIndex].length) {
          bestIndex = i;
        }
      }
      const bestSlug = candidates[bestIndex];
      const clean = bestSlug.split('?')[0].split('#')[0];

      // Remove noise query-like parameters in slug and trailing alphanumeric sku hashes
      const cleanedSlug = clean
        .replace(/\.(html?|php|aspx?)$/i, '')
        .replace(/^[0-9]+-/, '')
        .replace(/-[0-9]{5,}$/, '')
        .replace(/-[A-Z0-9]{10,}$/i, ''); // Strip trailing Amazon SKU / ASIN from slug

      const words = cleanedSlug.split(/[-_]+/).filter((w) => w.length > 0 && !/^[0-9a-f]{10,}$/i.test(w) && !/^[A-Z0-9]{12,}$/i.test(w));
      if (words.length >= 1) {
        let title = words.map(toTitleCase).join(' ');
        let brand = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();

        // If the preceding path segment exists and is a brand name (e.g. Myntra: /kurta-sets/anouk/women-printed-kurta/)
        if (bestIndex > 0) {
          const prev = candidates[bestIndex - 1].split('?')[0].split('#')[0].toLowerCase();
          if (
            prev.length >= 3 &&
            !prev.includes('-') &&
            !['kurta', 'sets', 'men', 'women', 'kids', 'shoes', 'clothing', 'fashion', 'pd', 'item', 'product'].includes(prev)
          ) {
            brand = toTitleCase(prev);
            if (!title.toLowerCase().includes(prev)) {
              title = `${brand} ${title}`;
            }
          }
        }

        return { title, brand };
      }
    }
  } catch {
    // fallback
  }

  return { title: 'Assisted Purchase Item' };
}

/**
 * Intelligent parser that extracts platform, accurate product title,
 * attributes (size, colour), and category from any Indian e-commerce URL.
 * NEVER returns unrelated images or random photos.
 */
export function parseProductFromUrl(rawUrl: string): ParsedProduct {
  const cleanUrl = rawUrl.trim();
  const lowerUrl = cleanUrl.toLowerCase();

  // 1. Detect Store & StoreName
  let store: ProductItem['store'] = 'other';
  let storeName = 'Indian Store';

  if (lowerUrl.includes('amazon.')) {
    store = 'amazon';
    storeName = 'Amazon India';
  } else if (lowerUrl.includes('flipkart.')) {
    store = 'flipkart';
    storeName = 'Flipkart';
  } else if (lowerUrl.includes('myntra.')) {
    store = 'myntra';
    storeName = 'Myntra';
  } else if (lowerUrl.includes('ajio.')) {
    store = 'ajio';
    storeName = 'AJIO';
  } else if (lowerUrl.includes('nykaa.')) {
    store = 'nykaa';
    storeName = 'Nykaa';
  } else if (lowerUrl.includes('tatacliq.')) {
    store = 'tatacliq';
    storeName = 'Tata CLiQ';
  } else if (lowerUrl.includes('bigbasket.')) {
    store = 'other';
    storeName = 'bigbasket';
  } else if (lowerUrl.includes('meesho.')) {
    store = 'other';
    storeName = 'Meesho';
  } else if (lowerUrl.includes('croma.')) {
    store = 'other';
    storeName = 'Croma';
  } else if (lowerUrl.includes('reliancedigital.')) {
    store = 'other';
    storeName = 'Reliance Digital';
  }

  // 2. Extract URL path
  let urlPath = '';
  let fullSearchPath = '';
  try {
    const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    urlPath = decodeURIComponent(parsed.pathname);
    fullSearchPath = decodeURIComponent(parsed.pathname + ' ' + parsed.search);
  } catch {
    urlPath = cleanUrl;
    fullSearchPath = cleanUrl;
  }

  const lowerPath = fullSearchPath.toLowerCase();

  // 3. Extract exact Title & Brand from URL slug
  const { title: slugTitle, brand } = extractSlugTitle(urlPath);
  let name = slugTitle;

  // If no slug was found in the path but it is an Amazon ASIN URL
  if (name === 'Assisted Purchase Item' && store === 'amazon') {
    const asinMatch = cleanUrl.match(/\/dp\/([A-Z0-9]{10})/i) || cleanUrl.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (asinMatch) {
      name = `Amazon Item (${asinMatch[1]})`;
    }
  }

  // 4. Detect Attributes (Size, Colour) from slug
  let size = 'Standard';
  let colour = 'Default';

  // Size detection
  if (/(\d+\s*cm)/i.test(lowerPath)) {
    const m = lowerPath.match(/(\d+\s*cm)/i);
    if (m) size = `${m[1].replace(/\s+/g, ' ').toUpperCase()}`;
  } else if (/(\d+\s*(?:gb|tb|mb))/i.test(lowerPath)) {
    const m = lowerPath.match(/(\d+\s*(?:gb|tb|mb))/i);
    if (m) size = `${m[1].replace(/\s+/g, ' ').toUpperCase()}`;
  } else if (/(\d+\s*(?:litres?|liter?|ltr?|l\b))/i.test(lowerPath)) {
    const m = lowerPath.match(/(\d+\s*(?:litres?|liter?|ltr?|l\b))/i);
    if (m) size = `${m[1].replace(/\s+/g, ' ').toUpperCase()}`;
  } else if (/(\d+\s*(?:kg|grams?|gm|g\b|ml\b))/i.test(lowerPath)) {
    const m = lowerPath.match(/(\d+\s*(?:kg|grams?|gm|g\b|ml\b))/i);
    if (m) size = `${m[1].replace(/\s+/g, ' ').toUpperCase()}`;
  } else if (/\b(uk\s*\d+|us\s*\d+)\b/i.test(lowerPath)) {
    const m = lowerPath.match(/\b(uk\s*\d+|us\s*\d+)\b/i);
    if (m) size = `${m[1].replace(/\s+/g, ' ').toUpperCase()}`;
  } else if (/\b(xxl|xl|large|medium|small|free\s*size)\b/i.test(lowerPath)) {
    const m = lowerPath.match(/\b(xxl|xl|large|medium|small|free\s*size)\b/i);
    if (m) size = toTitleCase(m[1]);
  }

  // Colour detection
  const colours = [
    'black',
    'blue',
    'navy blue',
    'navy',
    'red',
    'maroon',
    'green',
    'olive green',
    'teal',
    'pink',
    'white',
    'silver',
    'gold',
    'grey',
    'gray',
    'yellow',
    'purple',
    'brown',
    'orange',
    'beige',
  ];
  for (const c of colours) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(lowerPath)) {
      colour = toTitleCase(c);
      break;
    }
  }

  // 5. Category & Suggested options matching
  let category = 'General Goods';
  let priceINR = 1499;
  let suggestedSizes = ['Standard', 'Small', 'Medium', 'Large'];
  let suggestedColours = ['Default', 'Black', 'Blue', 'White'];

  if (
    lowerPath.includes('suitcase') ||
    lowerPath.includes('luggage') ||
    lowerPath.includes('trolley') ||
    lowerPath.includes('duffel') ||
    lowerPath.includes('cabin-bag')
  ) {
    category = 'Travel Luggage';
    priceINR = 2999;
    suggestedSizes = ['Cabin (55 cm)', 'Medium (65 cm)', 'Large (75 cm)', 'Set of 3'];
    suggestedColours = ['Navy Blue', 'Black', 'Teal', 'Silver', 'Ruby Red'];
  } else if (lowerPath.includes('backpack') || lowerPath.includes('laptop-bag') || lowerPath.includes('handbag')) {
    category = 'Bags & Backpacks';
    priceINR = 1299;
    suggestedSizes = ['15.6 inch', '17 inch', 'Compact', 'Standard'];
    suggestedColours = ['Black', 'Charcoal Grey', 'Navy Blue', 'Olive Green'];
  } else if (lowerPath.includes('cooker') || lowerPath.includes('pan') || lowerPath.includes('kadai') || lowerPath.includes('cookware')) {
    category = 'Kitchen & Cookware';
    priceINR = 1899;
    suggestedSizes = ['2 Litres', '3 Litres', '5 Litres', '6.5 Litres'];
    suggestedColours = ['Stainless Steel', 'Matte Black', 'Silver'];
  } else if (lowerPath.includes('saree') || lowerPath.includes('lehenga') || lowerPath.includes('anarkali')) {
    category = 'Ethnic Wear';
    priceINR = 2499;
    suggestedSizes = ['Free Size', 'Unstitched Blouse Piece'];
    suggestedColours = ['Crimson Red', 'Royal Blue', 'Golden Yellow', 'Emerald Green'];
  } else if (lowerPath.includes('kurta') || lowerPath.includes('kurti') || lowerPath.includes('shirt') || lowerPath.includes('dress')) {
    category = 'Fashion & Apparel';
    priceINR = 1299;
    suggestedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    suggestedColours = ['Soft Pink', 'Sky Blue', 'White', 'Mustard', 'Black'];
  } else if (lowerPath.includes('shoe') || lowerPath.includes('sneaker') || lowerPath.includes('footwear') || lowerPath.includes('sandals')) {
    category = 'Footwear';
    priceINR = 2999;
    suggestedSizes = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];
    suggestedColours = ['Blue / White', 'Triple Black', 'Grey / Orange', 'All White'];
  } else if (lowerPath.includes('watch') || lowerPath.includes('smartwatch')) {
    category = 'Watches';
    priceINR = 2499;
    suggestedSizes = ['38mm', '42mm', 'Standard Dial'];
    suggestedColours = ['Midnight Black', 'Brown Leather', 'Rose Gold', 'Silver Mesh'];
  } else if (lowerPath.includes('smartphone') || lowerPath.includes('iphone') || lowerPath.includes('mobile-phone')) {
    category = 'Smartphones & Mobile';
    priceINR = 29999;
    suggestedSizes = ['128 GB', '256 GB', '512 GB'];
    suggestedColours = ['Black', 'Blue', 'Green', 'Silver'];
  } else if (lowerPath.includes('earbud') || lowerPath.includes('headphone') || lowerPath.includes('earphone') || lowerPath.includes('airdopes')) {
    category = 'Audio & Electronics';
    priceINR = 1799;
    suggestedSizes = ['Standard'];
    suggestedColours = ['Carbon Black', 'Active White', 'Teal Green', 'Royal Navy'];
  } else if (lowerPath.includes('beauty') || lowerPath.includes('skincare') || lowerPath.includes('serum') || lowerPath.includes('cream') || lowerPath.includes('lip')) {
    category = 'Beauty & Cosmetics';
    priceINR = 799;
    suggestedSizes = ['30 ml', '50 ml', '100 ml', 'Standard'];
    suggestedColours = ['Original', 'Natural', 'Shade 01', 'Shade 02'];
  } else if (lowerPath.includes('noodle') || lowerPath.includes('maggi') || lowerPath.includes('snack') || lowerPath.includes('tea') || lowerPath.includes('spice') || lowerPath.includes('grocery')) {
    category = 'Grocery & Gourmet Food';
    priceINR = lowerPath.includes('noodle') || lowerPath.includes('maggi') ? 60 : 350;
    suggestedSizes = ['70 g', '140 g', '280 g', '500 g', '1 kg'];
    suggestedColours = ['Standard Pack'];
  } else if (lowerPath.includes('book') || lowerPath.includes('novel')) {
    category = 'Books';
    priceINR = 499;
    suggestedSizes = ['Paperback', 'Hardcover'];
    suggestedColours = ['Standard Edition'];
  }

  // If the user pasted a direct image URL, use that URL.
  // Otherwise, leave imageUrl as empty string (''). NEVER assign a fake Unsplash image!
  let imageUrl = '';
  if (isDirectImageUrl(cleanUrl)) {
    imageUrl = cleanUrl;
  }

  return {
    name,
    store,
    storeName,
    imageUrl,
    priceINR,
    size,
    colour,
    suggestedSizes,
    suggestedColours,
    category,
    brand,
  };
}
