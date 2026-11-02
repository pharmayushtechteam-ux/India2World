export interface CurrencyDefinition {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  /** How many units of this currency equal 1 USD */
  ratePerUSD: number;
  /** How many INR equal 1 unit of this currency */
  inrPerUnit: number;
}

export const SUPPORTED_CURRENCIES: CurrencyDefinition[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (Default)', flag: '🇮🇳', ratePerUSD: 86.5, inrPerUnit: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', ratePerUSD: 1, inrPerUnit: 86.5 },
  { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', flag: '🇦🇪', ratePerUSD: 3.67, inrPerUnit: 23.57 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', ratePerUSD: 0.79, inrPerUnit: 109.49 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', ratePerUSD: 0.92, inrPerUnit: 94.02 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', ratePerUSD: 1.39, inrPerUnit: 62.23 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺', ratePerUSD: 1.54, inrPerUnit: 56.17 },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', flag: '🇸🇬', ratePerUSD: 1.34, inrPerUnit: 64.55 },
  { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', flag: '🇸🇦', ratePerUSD: 3.75, inrPerUnit: 23.07 },
];

export function getCurrencyInfo(selectedCurrency?: string): CurrencyDefinition {
  if (!selectedCurrency) return SUPPORTED_CURRENCIES[0];
  const cleanCode = selectedCurrency.trim().split(/[\s(]/)[0].toUpperCase();
  return SUPPORTED_CURRENCIES.find((c) => c.code === cleanCode) || SUPPORTED_CURRENCIES[0];
}

export function formatINR(amountINR: number, selectedCurrency?: string): string {
  const info = getCurrencyInfo(selectedCurrency);
  if (info.code === 'INR') {
    return `₹${Math.round(amountINR).toLocaleString('en-IN')}`;
  }
  const converted = amountINR / info.inrPerUnit;
  if (converted >= 100) {
    return `${info.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  }
  return `${info.symbol}${converted.toFixed(2)}`;
}

export function formatUSD(amountUSD: number, selectedCurrency?: string): string {
  const info = getCurrencyInfo(selectedCurrency);
  if (info.code === 'USD') {
    return `$${Math.round(amountUSD).toLocaleString('en-US')}`;
  }
  if (info.code === 'INR') {
    const inr = Math.round(amountUSD * 86.5);
    return `₹${inr.toLocaleString('en-IN')}`;
  }
  const converted = amountUSD * info.ratePerUSD;
  if (converted >= 100) {
    return `${info.symbol}${Math.round(converted).toLocaleString('en-US')}`;
  }
  return `${info.symbol}${Math.round(converted * 10) / 10}`;
}
