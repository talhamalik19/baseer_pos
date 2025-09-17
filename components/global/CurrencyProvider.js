import { cookies } from 'next/headers';
import { fetchCurrencyData } from '@/lib/Magento/actions';

export default async function CurrencyProvider() {
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get('currency_code')?.value || 'USD';
  const currencySymbol = cookieStore.get('currency_symbol')?.value || '$';
  
  let currencyData = null;
  try {
    currencyData = await fetchCurrencyData();
    
    if (currencyData && !currencyData.available_currency_codes.includes(currencyCode)) {
      const defaultCurrency = {
        code: currencyData.default_display_currency_code,
        symbol: currencyData.default_display_currency_symbol
      };
      return { ...defaultCurrency, currencyData };
    }
  } catch (error) {
    console.error('Error fetching currency data:', error);
  }

  return {
    code: currencyCode,
    symbol: currencySymbol,
    currencyData
  };
}