import { cookies } from 'next/headers';
import { fetchCurrencyData } from '@/lib/Magento/actions';

export default async function CurrencyProvider() {
  const cookieStore = await cookies();
  
  const currencyCodeFromCookie = cookieStore.get('currency_code')?.value;
  const currencySymbolFromCookie = cookieStore.get('currency_symbol')?.value;

  let currencyData = null;
  let selectedCurrencyCode = currencyCodeFromCookie;
  let selectedCurrencySymbol = currencySymbolFromCookie;

  // ✅ Always fetch currency data to validate
  try {
    currencyData = await fetchCurrencyData();
    
    if (currencyData) {
      // If no cookies exist, use API defaults
      if (!currencyCodeFromCookie || !currencySymbolFromCookie) {
        selectedCurrencyCode = currencyData.default_display_currency_code || 'USD';
        selectedCurrencySymbol = currencyData.default_display_currency_symbol || '$';
      }
      // If cookies exist but currency is not available, use API defaults
      else if (!currencyData.available_currency_codes?.includes(currencyCodeFromCookie)) {
        selectedCurrencyCode = currencyData.default_display_currency_code || 'USD';
        selectedCurrencySymbol = currencyData.default_display_currency_symbol || '$';
      }
    } else {
      // If API fails, fallback to cookies or hardcoded defaults
      selectedCurrencyCode = currencyCodeFromCookie || 'USD';
      selectedCurrencySymbol = currencySymbolFromCookie || '$';
    }
  } catch (error) {
    console.error('Error fetching currency data:', error);
    // If API throws error, fallback to cookies or hardcoded defaults
    selectedCurrencyCode = currencyCodeFromCookie || 'USD';
    selectedCurrencySymbol = currencySymbolFromCookie || '$';
  }

  return {
    code: selectedCurrencyCode,
    symbol: selectedCurrencySymbol,
    currencyData,
  };
}