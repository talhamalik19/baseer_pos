'use client';

import React, { useState, useRef, useEffect } from 'react';
import { setCurrentLanguage, setCurrentCurrency } from "@/lib/Magento/actions";

export default function CurrencyLanguageSwitcher({
  serverCurrency,
  serverLanguage
}) {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(serverCurrency);
  const [selectedLanguage, setSelectedLanguage] = useState(serverLanguage);
  const currencyRef = useRef(null);
  const languageRef = useRef(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCurrencyChange = async (currencyCode, currencySymbol) => {
    try {
      const newCurrency = {
        code: currencyCode,
        symbol: currencySymbol
      };
      setSelectedCurrency(newCurrency);
      setShowCurrencyDropdown(false);
      await setCurrentCurrency(newCurrency.code, newCurrency.symbol);
      window.location.reload();
    } catch (error) {
      console.error('Error changing currency:', error);
    }
  };

  const handleLanguageChange = async (storeCode, languageCode, languageName) => {
    try {
      const newLanguage = {
        storeCode: storeCode,
        code: languageCode,
        name: languageName
      };
      setSelectedLanguage(newLanguage);
      setShowLanguageDropdown(false);
      await setCurrentLanguage(newLanguage?.storeCode, newLanguage.code, newLanguage.name);
      window.location.reload();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const toggleCurrencyDropdown = () => {
    setShowCurrencyDropdown(!showCurrencyDropdown);
    setShowLanguageDropdown(false);
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
    setShowCurrencyDropdown(false);
  };

  return (
    <>
      {/* Currency Dropdown */}
      <div className="currency" onClick={toggleCurrencyDropdown} ref={currencyRef}>
        <div>{selectedCurrency.symbol} </div>
         <div>{selectedCurrency.code}</div>
        
        {showCurrencyDropdown && serverCurrency.currencyData && (
          <div className="currency-dropdown">
            {serverCurrency.currencyData.available_currency_codes?.map((currencyCode) => {
              const currency = serverCurrency.currencyData.exchange_rates?.find(
                rate => rate.currency_to === currencyCode
              );
              return (
                <div
                  key={currencyCode}
                  className={`currency-option ${
                    selectedCurrency.code === currencyCode ? 'selected' : ''
                  }`}
                  onClick={() => handleCurrencyChange(
                    currencyCode, 
                    currency?.currency_to_symbol
                  )}
                >
                  {currency?.currency_to_symbol} {currencyCode}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Language Dropdown */}
      <div className="currency" onClick={toggleLanguageDropdown} ref={languageRef}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
          <path d="M1 8.33049C1 12.3791 4.21041 15.661 8.1709 15.661C12.1314 15.661 15.3418 12.3791 15.3418 8.33049C15.3418 4.28186 12.1314 1 8.1709 1C4.21041 1 1 4.28186 1 8.33049Z" stroke="#242424" strokeOpacity="0.7" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"></path>
          <path d="M8.88739 1.03516C8.88739 1.03516 11.0387 3.9307 11.0387 8.329C11.0387 12.7273 8.88739 15.6228 8.88739 15.6228M7.45321 15.6228C7.45321 15.6228 5.30194 12.7273 5.30194 8.329C5.30194 3.9307 7.45321 1.03516 7.45321 1.03516M1.45117 10.8947H14.8894M1.45117 5.76332H14.8894" stroke="#242424" strokeOpacity="0.7" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        {selectedLanguage.storeName}
        
        {showLanguageDropdown && serverLanguage.allStores && (
          <div className="currency-dropdown">
            {serverLanguage.allStores?.map((store) => (
              <div
                key={store.locale}
                className={`currency-option ${
                  selectedLanguage.storeCode === store.store_code ? 'selected' : ''
                }`}
                onClick={() => handleLanguageChange(
                  store.store_code,
                  store.id,
                  store.store_name
                )}
              >
                {store.store_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}