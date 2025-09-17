'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import CurrencyLanguageSwitcher from './CurrencyLanguageSwitcher';

export default function PageHead({
  pageName,
  firstName,
  lastName,
  initials,
  onCartIconClick,
  cartItemsCount,
  serverCurrency,
  serverLanguage
}) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 767)
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="page_head">
      <h1 className="page_title">{pageName || 'Baseer'}</h1>
      <div className="account_block">
        <CurrencyLanguageSwitcher 
          serverCurrency={serverCurrency}
          serverLanguage={serverLanguage}
        />
        
        <div className="account">
          {pageName === "Product" && (
            <div className="account_cart_logo" onClick={onCartIconClick}>
              <svg
                width="34"
                height="35"
                viewBox="0 0 34 35"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Cart SVG */}
              </svg>
              {cartItemsCount > 0 && <p>{cartItemsCount}</p>}
            </div>
          )}
          <div
            className="account_icon"
            onClick={isMobile ? toggleDropdown : null}
            style={{ cursor: isMobile ? "pointer" : "default" }}
          >
            {initials || "M"}
          </div>
          {isMobile ? (
            showDropdown && (
              <div className="mobile_dropdown">
                <p className="mobile_dropdown_name">{`${firstName} ${lastName}`}</p>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )
          ) : (
            <div className="account_detail">
              <p>{`${firstName} ${lastName}`}</p>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}