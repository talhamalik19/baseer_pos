"use client";

import React, { useState, useRef, useEffect } from "react";
import { setCurrentLanguage, setCurrentCurrency } from "@/lib/Magento/actions";

export default function CurrencyLanguageSwitcher({
  serverCurrency,
  serverLanguage,
}) {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState(serverCurrency);
  const [selectedLanguage, setSelectedLanguage] = useState(serverLanguage);

  const currencyRef = useRef(null);
  const languageRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if multiple exist
  const hasMultipleCurrencies =
    serverCurrency?.currencyData?.available_currency_codes?.length > 1;

  const hasMultipleLanguages =
    serverLanguage?.allStores?.length > 1;

  // Currency change
  const handleCurrencyChange = async (currencyCode, currencySymbol) => {
    try {
      const newCurrency = { code: currencyCode, symbol: currencySymbol };

      if (serverCurrency?.code !== currencyCode) {
        setSelectedCurrency(newCurrency);
        setShowCurrencyDropdown(false);
        await setCurrentCurrency(newCurrency.code, newCurrency.symbol);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error changing currency:", error);
    }
  };

  // Language change
  const handleLanguageChange = async (storeCode, storeId, storeName) => {
    try {
      const newLanguage = {
        storeCode,
        storeId,
        storeName,
      };

      if (serverLanguage?.storeId !== storeId) {
        setSelectedLanguage(newLanguage);
        setShowLanguageDropdown(false);

        await setCurrentLanguage(
          newLanguage.storeCode,
          newLanguage.storeId,
          newLanguage.storeName
        );

        window.location.reload();
      }
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  return (
    <>
      {/* ---------------- CURRENCY ---------------- */}
      <div
        className="currency"
        ref={currencyRef}
        onClick={hasMultipleCurrencies ? () => setShowCurrencyDropdown(!showCurrencyDropdown) : undefined}
      >
        {/* Show SVG only if multiple */}
       
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1.33333V14.6667"
              stroke="#62748E"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.3333 3.33333H6.33333C5.71449 3.33333 5.121 3.57917 4.68342 4.01675C4.24583 4.45434 4 5.04783 4 5.66667C4 6.28551 4.24583 6.879 4.68342 7.31658C5.121 7.75417 5.71449 8 6.33333 8H9.66667C10.2855 8 10.879 8.24583 11.3166 8.68342C11.7542 9.121 12 9.7145 12 10.3333C12 10.9522 11.7542 11.5457 11.3166 11.9833C10.879 12.4208 10.2855 12.6667 9.66667 12.6667H4"
              stroke="#62748E"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
      

        <div className={`server_currency ${!hasMultipleCurrencies ? 'single_currency' : ''}`}>
          <div>{selectedCurrency.code}</div>
          <div>{selectedCurrency.symbol}</div>
        </div>

        {hasMultipleCurrencies &&
          showCurrencyDropdown &&
          serverCurrency.currencyData && (
            <div className="currency-dropdown">
              {serverCurrency.currencyData.available_currency_codes?.map(
                (currencyCode) => {
                  const currency =
                    serverCurrency.currencyData.exchange_rates?.find(
                      (rate) => rate.currency_to === currencyCode
                    );

                  return (
                    <div
                      key={currencyCode}
                      className={`currency-option ${
                        selectedCurrency.code === currencyCode ? "selected" : ""
                      }`}
                      onClick={() =>
                        handleCurrencyChange(
                          currencyCode,
                          currency?.currency_to_symbol
                        )
                      }
                    >
                      {currency?.currency_to_symbol} {currencyCode}
                    </div>
                  );
                }
              )}
            </div>
          )}
      </div>

      {/* ---------------- LANGUAGE ---------------- */}
      <div
        className="currency"
        ref={languageRef}
        onClick={hasMultipleLanguages ? () => setShowLanguageDropdown(!showLanguageDropdown) : undefined}
      >
        {/* Show SVG only if multiple */}
        
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_587_859)">
              <path
                d="M10 14V10.6667C10 10.4899 9.92976 10.3203 9.80474 10.1953C9.67971 10.0702 9.51014 10 9.33333 10H6.66667C6.48986 10 6.32029 10.0702 6.19526 10.1953C6.07024 10.3203 6 10.4899 6 10.6667V14"
                stroke="#62748E"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.8493 6.87333C11.7103 6.74029 11.5254 6.66603 11.333 6.66603C11.1406 6.66603 10.9556 6.74029 10.8167 6.87333C10.5067 7.16901 10.0947 7.33397 9.66632 7.33397C9.23793 7.33397 8.82598 7.16901 8.51599 6.87333C8.37705 6.74049 8.19222 6.66635 7.99999 6.66635C7.80776 6.66635 7.62293 6.74049 7.48399 6.87333C7.17396 7.16921 6.76188 7.33429 6.33332 7.33429C5.90477 7.33429 5.49268 7.16921 5.18266 6.87333C5.04368 6.74029 4.85871 6.66603 4.66632 6.66603C4.47393 6.66603 4.28896 6.74029 4.14999 6.87333C3.85055 7.15908 3.4555 7.32318 3.04174 7.3337C2.62797 7.34422 2.2251 7.20041 1.91153 6.93025C1.59795 6.6601 1.39612 6.28293 1.34531 5.87216C1.2945 5.46139 1.39836 5.04641 1.63666 4.708L3.56266 1.91867C3.68486 1.73834 3.84938 1.5907 4.04184 1.48866C4.2343 1.38662 4.44882 1.33329 4.66666 1.33333H11.3333C11.5505 1.33325 11.7644 1.38623 11.9565 1.48766C12.1486 1.58909 12.3129 1.7359 12.4353 1.91533L14.3653 4.71C14.6037 5.04868 14.7074 5.46398 14.6563 5.87496C14.6051 6.28594 14.4028 6.66316 14.0888 6.93313C13.7747 7.20309 13.3714 7.34645 12.9574 7.33527C12.5434 7.32409 12.1484 7.15918 11.8493 6.87267"
                stroke="#62748E"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.66669 7.3V12.6667C2.66669 13.0203 2.80716 13.3594 3.05721 13.6095C3.30726 13.8595 3.6464 14 4.00002 14H12C12.3536 14 12.6928 13.8595 12.9428 13.6095C13.1929 13.3594 13.3334 13.0203 13.3334 12.6667V7.3"
                stroke="#62748E"
                strokeWidth="1.33333"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_587_859">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        

        <div className={`server_currency ${!hasMultipleLanguages ? 'single_currency' : ''}`}>
          {selectedLanguage.storeName}
        </div>

        {hasMultipleLanguages &&
          showLanguageDropdown &&
          serverLanguage.allStores && (
            <div className="currency-dropdown">
              {serverLanguage.allStores?.map((store) => (
                <div
                  key={store.id}
                  className={`currency-option ${
                    selectedLanguage.storeCode === store.store_code
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleLanguageChange(
                      store.store_code,
                      store.id,
                      store.store_name
                    )
                  }
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
