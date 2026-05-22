export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'JPY' | 'KRW' | 'VND' | 'THB' | 'SGD';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  flag: string;
  symbol: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  PHP: { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭', symbol: '₱', decimals: 2 },
  USD: { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£', decimals: 2 },
  AUD: { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: 'A$', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', symbol: '¥', decimals: 0 },
  KRW: { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷', symbol: '₩', decimals: 0 },
  VND: { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳', symbol: '₫', decimals: 0 },
  THB: { code: 'THB', name: 'Thai Baht', flag: '🇹🇭', symbol: '฿', decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', symbol: 'S$', decimals: 2 },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);
