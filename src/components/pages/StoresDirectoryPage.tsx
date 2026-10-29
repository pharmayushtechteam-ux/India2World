import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Shirt,
  Gem,
  Cpu,
  Footprints,
  Home,
  UtensilsCrossed,
  Crown,
  Store,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Page } from '../../types';

interface StoresDirectoryPageProps {
  onNavigate: (page: Page) => void;
  onStartBuyForMe: (initialUrl?: string) => void;
}

export interface BrandItem {
  id: number;
  name: string;
  domain: string;
  url: string;
  specialty: string;
  badgeColor: string;
  popular?: boolean;
}

export interface BrandCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  brands: BrandItem[];
}

export const INDIAN_BRAND_CATEGORIES: BrandCategory[] = [
  {
    id: 'marketplaces',
    title: '1. Mega Marketplaces & Department Stores',
    description: 'All-in-one Indian shopping portals carrying millions of products across every category.',
    icon: <Store className="w-5 h-5" />,
    accentColor: 'from-blue-600 to-indigo-600',
    brands: [
      { id: 1, name: 'Amazon India', domain: 'amazon.in', url: 'https://www.amazon.in', specialty: 'Everything Store & Electronics', badgeColor: 'bg-[#FF9900]', popular: true },
      { id: 2, name: 'Flipkart', domain: 'flipkart.com', url: 'https://www.flipkart.com', specialty: 'Mobiles, Fashion & Appliances', badgeColor: 'bg-[#2874F0]', popular: true },
      { id: 3, name: 'Tata CLiQ', domain: 'tatacliq.com', url: 'https://www.tatacliq.com', specialty: 'Authentic Branded Lifestyle & Tech', badgeColor: 'bg-[#DA1C5C]', popular: true },
      { id: 4, name: 'JioMart', domain: 'jiomart.com', url: 'https://www.jiomart.com', specialty: 'Groceries, Fashion & Home Essentials', badgeColor: 'bg-[#0078AD]' },
      { id: 5, name: 'Meesho', domain: 'meesho.com', url: 'https://www.meesho.com', specialty: 'Value Ethnic Wear, Home & Kitchen', badgeColor: 'bg-[#F43397]' },
      { id: 6, name: 'Snapdeal', domain: 'snapdeal.com', url: 'https://www.snapdeal.com', specialty: 'Value Fashion & Daily Essentials', badgeColor: 'bg-[#E40046]' },
      { id: 7, name: 'Shoppers Stop', domain: 'shoppersstop.com', url: 'https://www.shoppersstop.com', specialty: 'Premium Department Store & Beauty', badgeColor: 'bg-[#111827]' },
      { id: 8, name: 'Lifestyle Stores', domain: 'lifestylestores.com', url: 'https://www.lifestylestores.com', specialty: 'Apparel, Footwear & Handbags', badgeColor: 'bg-[#F59E0B]' },
      { id: 9, name: 'Paytm Mall / ONDC', domain: 'paytmmall.com', url: 'https://paytmmall.com', specialty: 'Pan-India Sellers & Regional Goods', badgeColor: 'bg-[#00BAF2]' },
      { id: 10, name: 'IndiaMART', domain: 'indiamart.com', url: 'https://www.indiamart.com', specialty: 'Wholesale, Bulk & Industrial Supplies', badgeColor: 'bg-[#2E3192]' },
    ],
  },
  {
    id: 'ethnic-wear',
    title: '2. Ethnic Wear, Sarees & Traditional Indian Fashion',
    description: 'Authentic Banarasi & Kanjeevaram sarees, kurtas, lehengas, and festive Indian attire.',
    icon: <Sparkles className="w-5 h-5" />,
    accentColor: 'from-rose-600 to-orange-500',
    brands: [
      { id: 11, name: 'Fabindia', domain: 'fabindia.com', url: 'https://www.fabindia.com', specialty: 'Handloom Apparel, Kurtas & Home', badgeColor: 'bg-[#8B1E24]', popular: true },
      { id: 12, name: 'Manyavar & Mohey', domain: 'manyavar.com', url: 'https://www.manyavar.com', specialty: 'Sherwanis, Lehengas & Celebration Wear', badgeColor: 'bg-[#991B1B]', popular: true },
      { id: 13, name: 'Biba', domain: 'biba.in', url: 'https://www.biba.in', specialty: 'Salwar Suits, Kurtis & Festive Wear', badgeColor: 'bg-[#E11D48]', popular: true },
      { id: 14, name: 'Nalli Silks', domain: 'nalli.com', url: 'https://www.nalli.com', specialty: 'Pure Kanjeevaram & Heritage Silk Sarees', badgeColor: 'bg-[#B91C1C]' },
      { id: 15, name: 'W for Woman', domain: 'wforwoman.com', url: 'https://wforwoman.com', specialty: 'Contemporary Fusion Ethnic Wear', badgeColor: 'bg-[#BE123C]' },
      { id: 16, name: 'Libas', domain: 'libas.in', url: 'https://www.libas.in', specialty: 'Everyday & Party Kurta Sets', badgeColor: 'bg-[#7C2D12]' },
      { id: 17, name: 'Kalki Fashion', domain: 'kalkifashion.com', url: 'https://www.kalkifashion.com', specialty: 'Bridal Lehengas, Sarees & Indo-Western', badgeColor: 'bg-[#9D174D]' },
      { id: 18, name: 'Jaypore', domain: 'jaypore.com', url: 'https://www.jaypore.com', specialty: 'Artisanal Handblock Sarees & Craft', badgeColor: 'bg-[#B45309]' },
      { id: 19, name: 'House of Indya', domain: 'houseofindya.com', url: 'https://www.houseofindya.com', specialty: 'Modern Festive & Fusion Ethnic Wear', badgeColor: 'bg-[#C026D3]' },
      { id: 20, name: 'Aurelia', domain: 'shopforaurelia.com', url: 'https://shopforaurelia.com', specialty: 'Effortless Daily Kurtas & Ethnic Sets', badgeColor: 'bg-[#EA580C]' },
    ],
  },
  {
    id: 'fashion-apparel',
    title: '3. Fashion, Western Wear & Everyday Apparel',
    description: 'Leading Indian fashion portals, streetwear labels, menswear, and family clothing stores.',
    icon: <Shirt className="w-5 h-5" />,
    accentColor: 'from-pink-600 to-purple-600',
    brands: [
      { id: 21, name: 'Myntra', domain: 'myntra.com', url: 'https://www.myntra.com', specialty: 'India’s #1 Fashion & Lifestyle Destination', badgeColor: 'bg-[#FF3F6C]', popular: true },
      { id: 22, name: 'AJIO', domain: 'ajio.com', url: 'https://www.ajio.com', specialty: 'Trendy Fashion, Indie Labels & Sneakers', badgeColor: 'bg-[#2C4152]', popular: true },
      { id: 23, name: 'Bewakoof', domain: 'bewakoof.com', url: 'https://www.bewakoof.com', specialty: 'Graphic Tees, Streetwear & Merch', badgeColor: 'bg-[#FACC15]' },
      { id: 24, name: 'The Souled Store', domain: 'thesouledstore.com', url: 'https://www.thesouledstore.com', specialty: 'Pop-Culture Merch, Oversized Tees & Polos', badgeColor: 'bg-[#DC2626]' },
      { id: 25, name: 'Raymond', domain: 'myraymond.com', url: 'https://www.myraymond.com', specialty: 'Fine Suiting, Tailoring & Menswear', badgeColor: 'bg-[#991B1B]' },
      { id: 26, name: 'Pantaloons', domain: 'pantaloons.com', url: 'https://www.pantaloons.com', specialty: 'Family Fashion, Casuals & Kids Wear', badgeColor: 'bg-[#0D9488]' },
      { id: 27, name: 'Allen Solly', domain: 'allensolly.abfrl.in', url: 'https://allensolly.abfrl.in', specialty: 'Smart Casuals & Friday Dressing', badgeColor: 'bg-[#1E3A8A]' },
      { id: 28, name: 'Peter England', domain: 'peterengland.abfrl.in', url: 'https://peterengland.abfrl.in', specialty: 'Men’s Shirts, Suits & Formals', badgeColor: 'bg-[#15803D]' },
      { id: 29, name: 'Van Heusen', domain: 'vanheusenindia.abfrl.in', url: 'https://vanheusenindia.abfrl.in', specialty: 'Power Formals & Corporate Wear', badgeColor: 'bg-[#1F2937]' },
      { id: 30, name: 'Snitch', domain: 'snitch.co.in', url: 'https://www.snitch.co.in', specialty: 'Modern Men’s Fast Fashion & Shirts', badgeColor: 'bg-[#0F172A]' },
    ],
  },
  {
    id: 'luxury-couture',
    title: '4. Luxury & Indian Designer Couture',
    description: 'Curated multi-designer luxury boutiques and flagship Indian couture houses.',
    icon: <Crown className="w-5 h-5" />,
    accentColor: 'from-amber-600 to-yellow-600',
    brands: [
      { id: 31, name: 'Tata CLiQ Luxury', domain: 'luxury.tatacliq.com', url: 'https://luxury.tatacliq.com', specialty: 'Premier Luxury Fashion, Watches & Beauty', badgeColor: 'bg-[#1C1917]', popular: true },
      { id: 32, name: 'Pernia’s Pop-Up Shop', domain: 'perniaspopupshop.com', url: 'https://www.perniaspopupshop.com', specialty: '500+ Top Indian Couture Designers', badgeColor: 'bg-[#831843]', popular: true },
      { id: 33, name: 'Aza Fashions', domain: 'azafashions.com', url: 'https://www.azafashions.com', specialty: 'Bridal Couture & Runway Collections', badgeColor: 'bg-[#9A3412]' },
      { id: 34, name: 'Ogaan', domain: 'ogaan.com', url: 'https://www.ogaan.com', specialty: 'Curated Designer Ethnic & Pret Wear', badgeColor: 'bg-[#374151]' },
      { id: 35, name: 'Anita Dongre', domain: 'anitadongre.com', url: 'https://www.anitadongre.com', specialty: 'Sustainable Luxury & Rajasthani Craft', badgeColor: 'bg-[#B45309]' },
      { id: 36, name: 'Ritu Kumar', domain: 'ritukumar.com', url: 'https://www.ritukumar.com', specialty: 'Iconic Indian Prints, Suits & Couture', badgeColor: 'bg-[#78350F]' },
      { id: 37, name: 'Sabyasachi', domain: 'sabyasachi.com', url: 'https://www.sabyasachi.com', specialty: 'Heritage Bridal Couture & Accessories', badgeColor: 'bg-[#451A03]' },
      { id: 38, name: 'Manish Malhotra', domain: 'manishmalhotra.in', url: 'https://manishmalhotra.in', specialty: 'Bespoke Glamour, Sarees & Sherwanis', badgeColor: 'bg-[#581C87]' },
      { id: 39, name: 'Tarun Tahiliani', domain: 'taruntahiliani.com', url: 'https://www.taruntahiliani.com', specialty: 'Draped Couture & Bridal Ensembles', badgeColor: 'bg-[#713F12]' },
      { id: 40, name: 'Ensemble India', domain: 'ensembleindia.com', url: 'https://www.ensembleindia.com', specialty: 'Pioneer Multi-Designer Luxury Store', badgeColor: 'bg-[#1E293B]' },
    ],
  },
  {
    id: 'beauty-ayurveda',
    title: '5. Beauty, Cosmetics & Ayurveda Personal Care',
    description: 'Skincare, makeup, luxury Ayurvedic wellness, and natural personal care brands from India.',
    icon: <ShoppingBag className="w-5 h-5" />,
    accentColor: 'from-fuchsia-600 to-pink-500',
    brands: [
      { id: 41, name: 'Nykaa', domain: 'nykaa.com', url: 'https://www.nykaa.com', specialty: 'Cosmetics, Skincare & Luxury Beauty', badgeColor: 'bg-[#FC2779]', popular: true },
      { id: 42, name: 'Forest Essentials', domain: 'forestessentialsindia.com', url: 'https://www.forestessentialsindia.com', specialty: 'Luxury Ayurvedic Skincare & Fragrances', badgeColor: 'bg-[#92400E]', popular: true },
      { id: 43, name: 'Kama Ayurveda', domain: 'kamaayurveda.in', url: 'https://www.kamaayurveda.in', specialty: 'Authentic Ayurvedic Hair & Skin Care', badgeColor: 'bg-[#78350F]', popular: true },
      { id: 44, name: 'Purplle', domain: 'purplle.com', url: 'https://www.purplle.com', specialty: 'Affordable Makeup & Beauty Essentials', badgeColor: 'bg-[#7E22CE]' },
      { id: 45, name: 'Mamaearth', domain: 'mamaearth.in', url: 'https://mamaearth.in', specialty: 'Toxin-Free Natural Personal Care', badgeColor: 'bg-[#16A34A]' },
      { id: 46, name: 'Minimalist', domain: 'beminimalist.co', url: 'https://beminimalist.co', specialty: 'Science-Backed Active Serums & Skincare', badgeColor: 'bg-[#18181B]' },
      { id: 47, name: 'SUGAR Cosmetics', domain: 'sugarcosmetics.com', url: 'https://in.sugarcosmetics.com', specialty: 'High-Pigment Lipsticks & Bold Makeup', badgeColor: 'bg-[#DB2777]' },
      { id: 48, name: 'Plum Goodness', domain: 'plumgoodness.com', url: 'https://plumgoodness.com', specialty: '100% Vegan Skincare & Body Mist', badgeColor: 'bg-[#6D28D9]' },
      { id: 49, name: 'Biotique', domain: 'biotique.com', url: 'https://www.biotique.com', specialty: 'Botanical Ayurvedic Beauty & Haircare', badgeColor: 'bg-[#15803D]' },
      { id: 50, name: 'Dot & Key', domain: 'dotandkey.com', url: 'https://www.dotandkey.com', specialty: 'Sunscreens,Barrier Repair & Moisturizers', badgeColor: 'bg-[#EC4899]' },
    ],
  },
  {
    id: 'jewellery-watches',
    title: '6. Jewellery, Silver, Ethnic Ornaments & Watches',
    description: 'Fine Indian craftsmanship in silver, fashion jewellery, temple ornaments, and timepieces.',
    icon: <Gem className="w-5 h-5" />,
    accentColor: 'from-amber-500 to-rose-500',
    brands: [
      { id: 51, name: 'Tanishq', domain: 'tanishq.co.in', url: 'https://www.tanishq.co.in', specialty: 'Tata Fine Jewellery & Festive Collections', badgeColor: 'bg-[#881337]', popular: true },
      { id: 52, name: 'CaratLane', domain: 'caratlane.com', url: 'https://www.caratlane.com', specialty: 'Everyday Fine & Contemporary Jewellery', badgeColor: 'bg-[#6B21A8]', popular: true },
      { id: 53, name: 'GIVA', domain: 'giva.co', url: 'https://www.giva.co', specialty: '925 Sterling Silver & Rose Gold Jewellery', badgeColor: 'bg-[#F43F5E]', popular: true },
      { id: 54, name: 'BlueStone', domain: 'bluestone.com', url: 'https://www.bluestone.com', specialty: 'Modern Designer Rings, Pendants & Bangles', badgeColor: 'bg-[#1E40AF]' },
      { id: 55, name: 'Kushal’s Fashion Jewellery', domain: 'kushals.com', url: 'https://www.kushals.com', specialty: 'Antique Temple, Kundan & Bridal Jewellery', badgeColor: 'bg-[#BE123C]' },
      { id: 56, name: 'Voylla', domain: 'voylla.com', url: 'https://www.voylla.com', specialty: 'Handcrafted Ethnic & Oxidised Jewellery', badgeColor: 'bg-[#B45309]' },
      { id: 57, name: 'Titan Watches', domain: 'titan.co.in', url: 'https://www.titan.co.in', specialty: 'Raga, Edge & Iconic Indian Timepieces', badgeColor: 'bg-[#111827]' },
      { id: 58, name: 'Fastrack', domain: 'fastrack.in', url: 'https://www.fastrack.in', specialty: 'Youth Watches, Smartwatches & Eyewear', badgeColor: 'bg-[#EA580C]' },
      { id: 59, name: 'Tribe Amrapali', domain: 'tribeamrapali.com', url: 'https://www.tribeamrapali.com', specialty: 'Jaipur Heritage Silver & Tribal Jewellery', badgeColor: 'bg-[#9A3412]' },
      { id: 60, name: 'Palmonas', domain: 'palmonas.com', url: 'https://palmonas.com', specialty: 'Demi-Fine Waterproof Everyday Jewellery', badgeColor: 'bg-[#A16207]' },
    ],
  },
  {
    id: 'electronics-gadgets',
    title: '7. Electronics, Audio & Smart Tech Accessories',
    description: 'Indian electronics retailers, smart wearables, audio gear, and mobile accessories.',
    icon: <Cpu className="w-5 h-5" />,
    accentColor: 'from-cyan-600 to-blue-600',
    brands: [
      { id: 61, name: 'Croma', domain: 'croma.com', url: 'https://www.croma.com', specialty: 'Tata Electronics, Appliances & Gadgets', badgeColor: 'bg-[#00E9BF]', popular: true },
      { id: 62, name: 'Reliance Digital', domain: 'reliancedigital.in', url: 'https://www.reliancedigital.in', specialty: 'Smartphones, Laptops & Personal Tech', badgeColor: 'bg-[#E11D48]', popular: true },
      { id: 63, name: 'boAt Lifestyle', domain: 'boat-lifestyle.com', url: 'https://www.boat-lifestyle.com', specialty: 'Earbuds, Headphones, Speakers & Watches', badgeColor: 'bg-[#EF4444]', popular: true },
      { id: 64, name: 'Noise', domain: 'gonoise.com', url: 'https://www.gonoise.com', specialty: 'Smartwatches, Rings & Wireless Audio', badgeColor: 'bg-[#2563EB]' },
      { id: 65, name: 'Vijay Sales', domain: 'vijaysales.com', url: 'https://www.vijaysales.com', specialty: 'Consumer Electronics & Home Appliances', badgeColor: 'bg-[#DC2626]' },
      { id: 66, name: 'DailyObjects', domain: 'dailyobjects.com', url: 'https://www.dailyobjects.com', specialty: 'Designer Phone Cases, Desk & Tech Gear', badgeColor: 'bg-[#1F2937]' },
      { id: 67, name: 'Portronics', domain: 'portronics.com', url: 'https://www.portronics.com', specialty: 'Portable Chargers, Hubs & Audio', badgeColor: 'bg-[#EA580C]' },
      { id: 68, name: 'Zebronics', domain: 'zebronics.com', url: 'https://zebronics.com', specialty: 'Soundbars, Gaming Peripherals & IT', badgeColor: 'bg-[#0284C7]' },
      { id: 69, name: 'Poorvika Mobiles', domain: 'poorvika.com', url: 'https://www.poorvika.com', specialty: 'Smartphones, Tablets & Accessories', badgeColor: 'bg-[#F97316]' },
      { id: 70, name: 'Stuffcool', domain: 'stuffcool.com', url: 'https://www.stuffcool.com', specialty: 'Made-in-India GaN Chargers & Cables', badgeColor: 'bg-[#4F46E5]' },
    ],
  },
  {
    id: 'footwear-bags',
    title: '8. Footwear, Handbags, Leather & Travel Gear',
    description: 'Traditional kolhapuris, juttis, vegan bags, leather craft, and Indian footwear brands.',
    icon: <Footprints className="w-5 h-5" />,
    accentColor: 'from-emerald-600 to-teal-600',
    brands: [
      { id: 71, name: 'Bata India', domain: 'bata.com/in', url: 'https://www.bata.com/in', specialty: 'Comfort Footwear, Formals & Sandals', badgeColor: 'bg-[#DC2626]', popular: true },
      { id: 72, name: 'Metro Shoes', domain: 'metroshoes.com', url: 'https://www.metroshoes.com', specialty: 'Ethnic Footwear, Heels, Mojaris & Bags', badgeColor: 'bg-[#B91C1C]', popular: true },
      { id: 73, name: 'Zouk', domain: 'zouk.co.in', url: 'https://zouk.co.in', specialty: '100% Vegan Indian Print Bags & Wallets', badgeColor: 'bg-[#0F766E]', popular: true },
      { id: 74, name: 'Hidesign', domain: 'hidesign.com', url: 'https://hidesign.com', specialty: 'Handcrafted Vegetable-Tanned Leather Bags', badgeColor: 'bg-[#78350F]' },
      { id: 75, name: 'Mochi Shoes', domain: 'mochishoes.com', url: 'https://www.mochishoes.com', specialty: 'Party, Bridal & Casual Footwear', badgeColor: 'bg-[#E11D48]' },
      { id: 76, name: 'Woodland', domain: 'woodlandworldwide.com', url: 'https://www.woodlandworldwide.com', specialty: 'Rugged Outdoor Boots, Jackets & Gear', badgeColor: 'bg-[#166534]' },
      { id: 77, name: 'Fizzy Goblet', domain: 'fizzygoblet.com', url: 'https://www.fizzygoblet.com', specialty: 'Handcrafted Designer Juttis & Sliders', badgeColor: 'bg-[#DB2777]' },
      { id: 78, name: 'Campus Activewear', domain: 'campusshoes.com', url: 'https://www.campusshoes.com', specialty: 'Running Shoes, Sneakers & Athleisure', badgeColor: 'bg-[#2563EB]' },
      { id: 79, name: 'Needledust', domain: 'needledust.com', url: 'https://www.needledust.com', specialty: 'Embroidered Festive Juttis & Clutches', badgeColor: 'bg-[#BE185D]' },
      { id: 80, name: 'Mokobara', domain: 'mokobara.com', url: 'https://mokobara.com', specialty: 'Modern Travel Luggage & Backpacks', badgeColor: 'bg-[#111827]' },
    ],
  },
  {
    id: 'home-kitchen-craft',
    title: '9. Home Decor, Indian Handicrafts, Kitchen & Living',
    description: 'Indian kitchenware, brass pooja items, ceramic tableware, textiles, and artisan decor.',
    icon: <Home className="w-5 h-5" />,
    accentColor: 'from-orange-600 to-amber-600',
    brands: [
      { id: 81, name: 'Pepperfry', domain: 'pepperfry.com', url: 'https://www.pepperfry.com', specialty: 'Home Decor, Lamps, Brass & Furnishings', badgeColor: 'bg-[#EA580C]', popular: true },
      { id: 82, name: 'Chumbak', domain: 'chumbak.com', url: 'https://www.chumbak.com', specialty: 'Quirky India-Inspired Decor, Mugs & Gifts', badgeColor: 'bg-[#0D9488]', popular: true },
      { id: 83, name: 'TTK Prestige', domain: 'shop.ttkprestige.com', url: 'https://shop.ttkprestige.com', specialty: 'Pressure Cookers, Idli Makers & Cookware', badgeColor: 'bg-[#DC2626]', popular: true },
      { id: 84, name: 'Nestasia', domain: 'nestasia.in', url: 'https://nestasia.in', specialty: 'Artisanal Dinnerware, Serveware & Decor', badgeColor: 'bg-[#9333EA]' },
      { id: 85, name: 'ExclusiveLane', domain: 'exclusivelane.com', url: 'https://exclusivelane.com', specialty: 'Handcrafted Warli, Terracotta & Brass Art', badgeColor: 'bg-[#B45309]' },
      { id: 86, name: 'Borosil', domain: 'myborosil.com', url: 'https://myborosil.com', specialty: 'Glassware, Tiffins, Bottles & Appliances', badgeColor: 'bg-[#1D4ED8]' },
      { id: 87, name: 'Milton', domain: 'milton.in', url: 'https://www.milton.in', specialty: 'Thermosteel Flasks, Casseroles & Lunchboxes', badgeColor: 'bg-[#E11D48]' },
      { id: 88, name: 'Jaipur Rugs', domain: 'jaipurrugs.com', url: 'https://www.jaipurrugs.com', specialty: 'Hand-Knotted Artisan Carpets & Dhurries', badgeColor: 'bg-[#991B1B]' },
      { id: 89, name: 'Okhai', domain: 'okhai.org', url: 'https://okhai.org', specialty: 'Rural Women Artisan Mirror-Work & Crafts', badgeColor: 'bg-[#C2410C]' },
      { id: 90, name: 'Phool.co', domain: 'phool.co', url: 'https://phool.co', specialty: 'Temple-Flower Incense Cones, Dhoop & Gift Boxes', badgeColor: 'bg-[#D97706]' },
    ],
  },
  {
    id: 'groceries-sweets-books',
    title: '10. Indian Sweets, Tea, Spices, Wellness, Kids & Books',
    description: 'Authentic Indian snacks, namkeen, Darjeeling teas, Ayurvedic wellness, books, and kids wear.',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    accentColor: 'from-green-600 to-emerald-600',
    brands: [
      { id: 91, name: 'Haldiram’s', domain: 'haldirams.com', url: 'https://www.haldirams.com', specialty: 'Authentic Indian Namkeen, Bhujia & Mithai', badgeColor: 'bg-[#DC2626]', popular: true },
      { id: 92, name: 'BigBasket', domain: 'bigbasket.com', url: 'https://www.bigbasket.com', specialty: 'Indian Spices, Masalas, Dry Fruits & Staples', badgeColor: 'bg-[#65A30D]', popular: true },
      { id: 93, name: 'FirstCry', domain: 'firstcry.com', url: 'https://www.firstcry.com', specialty: 'India’s #1 Kids Ethnic Wear, Toys & Baby Store', badgeColor: 'bg-[#F97316]', popular: true },
      { id: 94, name: 'Vahdam India', domain: 'vahdam.in', url: 'https://www.vahdam.in', specialty: 'Darjeeling Teas, Chai Assortments & Spices', badgeColor: 'bg-[#065F46]' },
      { id: 95, name: 'Bikanervala', domain: 'bikanervala.com', url: 'https://bikanervala.com', specialty: 'Traditional Sweets, Gift Hampers & Snacks', badgeColor: 'bg-[#B91C1C]' },
      { id: 96, name: 'Organic India', domain: 'organicindia.com', url: 'https://organicindia.com', specialty: 'Tulsi Teas, Herbal Supplements & Ghee', badgeColor: 'bg-[#15803D]' },
      { id: 97, name: 'Kapiva Ayurveda', domain: 'kapiva.in', url: 'https://kapiva.in', specialty: 'Shilajit, Amla Juices & Modern Ayurveda', badgeColor: 'bg-[#166534]' },
      { id: 98, name: 'Blue Tokai Coffee', domain: 'bluetokaicoffee.com', url: 'https://bluetokaicoffee.com', specialty: 'Single-Estate Indian Specialty Roast Coffee', badgeColor: 'bg-[#0284C7]' },
      { id: 99, name: 'SapnaOnline', domain: 'sapnaonline.com', url: 'https://www.sapnaonline.com', specialty: 'Indian Regional & English Books Superstore', badgeColor: 'bg-[#1E3A8A]' },
      { id: 100, name: 'Bookswagon', domain: 'bookswagon.com', url: 'https://www.bookswagon.com', specialty: 'Academic, Spiritual & Indian Literature Books', badgeColor: 'bg-[#991B1B]' },
    ],
  },
];

export const StoresDirectoryPage: React.FC<StoresDirectoryPageProps> = ({
  onNavigate,
  onStartBuyForMe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INDIAN_BRAND_CATEGORIES.map((category) => {
      if (selectedCategory !== 'all' && category.id !== selectedCategory) {
        return { ...category, brands: [] };
      }
      if (!q) return category;
      return {
        ...category,
        brands: category.brands.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.domain.toLowerCase().includes(q) ||
            b.specialty.toLowerCase().includes(q) ||
            category.title.toLowerCase().includes(q)
        ),
      };
    }).filter((cat) => cat.brands.length > 0);
  }, [searchQuery, selectedCategory]);

  const totalMatchingBrands = useMemo(
    () => filteredCategories.reduce((sum, cat) => sum + cat.brands.length, 0),
    [filteredCategories]
  );

  return (
    <div className="w-full min-h-screen bg-slate-50/70 pb-16">
      {/* Top Hero Banner */}
      <section className="w-full bg-gradient-to-br from-[#0B1940] via-[#102A6B] to-[#0D59F2] text-white py-10 sm:py-12 px-4 sm:px-6 md:px-10 lg:px-12 border-b border-slate-200">
        <div className="w-full">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-200 hover:text-white mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-blue-100 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100 Verified Indian Online Stores • 10 Categories</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Directory of Top 100 Indian Shopping Brands
              </h1>
              <p className="text-blue-100/90 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                Browse India&apos;s top 100 online stores by category. Visit any store to explore products and copy the product URL, or click{' '}
                <span className="font-semibold text-white">&ldquo;Buy For Me&rdquo;</span> on any brand to start an Assisted Purchase order directly.
              </p>
            </div>

            {/* Quick Custom URL CTA */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => onStartBuyForMe('')}
                className="inline-flex items-center gap-2.5 bg-white text-[#0B1940] hover:bg-blue-50 font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <span>Paste Any Product Link</span>
                <ArrowRight className="w-4 h-4 text-[#0D59F2]" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-7 max-w-2xl">
            <div className="relative flex items-center bg-white rounded-xl shadow-lg overflow-hidden border-2 border-white/20 focus-within:border-blue-300">
              <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across 100 Indian brands (e.g. Manyavar, Nykaa, Sarees, Jewellery, Haldiram)..."
                className="w-full py-3.5 px-3 text-slate-800 placeholder:text-slate-400 text-sm sm:text-base font-medium focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mr-3 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-md bg-slate-100 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Category Filter Bar */}
      <div className="sticky top-18 sm:top-20 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-12 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0D59F2] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            All Categories (100)
          </button>
          {INDIAN_BRAND_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0D59F2] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <span>{cat.title.replace(/^\d+\.\s*/, '')}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {cat.brands.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Category-Wise Brand Grids */}
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-12 pt-8 space-y-10">
        {/* Result Summary */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
          <span>
            Showing <strong className="text-slate-900">{totalMatchingBrands}</strong> Indian shopping brands across{' '}
            <strong className="text-slate-900">{filteredCategories.length}</strong>{' '}
            {filteredCategories.length === 1 ? 'category' : 'categories'}
          </span>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-[#0D59F2] font-semibold hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {filteredCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-lg font-bold text-slate-800 mb-1">No brands matched &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-sm text-slate-500 mb-4">
              Don&apos;t worry — we can still purchase from ANY Indian online store for you!
            </p>
            <button
              type="button"
              onClick={() => onStartBuyForMe('')}
              className="inline-flex items-center gap-2 bg-[#0D59F2] text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <span>Paste Custom Store Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section
              key={category.id}
              id={`cat-${category.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
            >
              {/* Category Header */}
              <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.accentColor} text-white flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-[#0B1940] tracking-tight">
                      {category.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{category.description}</p>
                  </div>
                </div>
                <span className="self-start sm:self-center shrink-0 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {category.brands.length} Brands
                </span>
              </div>

              {/* 10 Brands Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {category.brands.map((brand) => {
                  const initials = brand.name
                    .replace(/[^a-zA-Z0-9\s]/g, '')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join('');

                  return (
                    <div
                      key={brand.id}
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 hover:border-[#0D59F2]/60 hover:shadow-md transition-all"
                    >
                      <div>
                        {/* Top Row: Brand Monogram + Popular Badge + Brand # */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <a
                            href={brand.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 min-w-0 cursor-pointer"
                            title={`Visit ${brand.name} (${brand.domain})`}
                          >
                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0D59F2] group-hover:scale-105 transition-all">
                              <img
                                src={`/assets/brands/brand-${brand.id}.png`}
                                alt={`${brand.name} logo`}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-[#0B1940] truncate group-hover:text-[#0D59F2] transition-colors">
                                {brand.name}
                              </h3>
                              <p className="text-[11px] font-medium text-slate-400 truncate">{brand.domain} ?</p>
                            </div>
                          </a>
                          {brand.popular ? (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70">
                              Top
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-semibold text-slate-400">#{brand.id}</span>
                          )}
                        </div>

                        {/* Specialty Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-snug">{brand.specialty}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onStartBuyForMe(brand.url)}
                          className="flex-1 inline-flex items-center justify-center gap-1 bg-[#EAF2FF] hover:bg-[#0D59F2] text-[#0D59F2] hover:text-white font-bold text-[11.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
                          title={`Start Buy For Me order from ${brand.name}`}
                        >
                          <span>Buy For Me</span>
                        </button>
                        <a
                          href={brand.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 text-slate-500 hover:text-[#0B1940] hover:bg-slate-100 text-[11.5px] font-semibold py-1.5 px-2.5 rounded-lg transition-colors"
                          title={`Open ${brand.domain} in a new tab`}
                        >
                          <span>Visit</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
