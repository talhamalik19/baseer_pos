"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import CurrencyLanguageSwitcher from "./CurrencyLanguageSwitcher";

export default function PageHead({
  pageName,
  firstName,
  lastName,
  initials,
  onCartIconClick,
  cartItemsCount,
  serverCurrency,
  serverLanguage,
}) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 767);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };
   const [theme, setTheme] = useState("light");


  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <div className="page_head">
      <h1 className="page_title">{pageName || "Baseer"}</h1>
      <div className="account_block">
        {theme == "light" ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mode_switch"
            onClick={toggleTheme}
          >
            <path
              d="M13.99 8.324C13.9275 9.48143 13.5311 10.596 12.8487 11.5329C12.1663 12.4699 11.2271 13.1891 10.1447 13.6037C9.06223 14.0183 7.88288 14.1104 6.74918 13.869C5.61548 13.6276 4.57597 13.063 3.7563 12.2434C2.93664 11.4239 2.37192 10.3844 2.13041 9.25074C1.88889 8.11706 1.98093 6.9377 2.39538 5.85521C2.80984 4.77272 3.52897 3.83346 4.46585 3.15096C5.40272 2.46845 6.51724 2.07194 7.67466 2.00933C7.94466 1.99467 8.086 2.316 7.94266 2.54467C7.46326 3.3117 7.25798 4.21858 7.36033 5.1173C7.46268 6.01602 7.86661 6.85352 8.50621 7.49312C9.14581 8.13272 9.98331 8.53665 10.882 8.639C11.7808 8.74135 12.6876 8.53607 13.4547 8.05667C13.684 7.91333 14.0047 8.054 13.99 8.324Z"
              stroke="#45556C"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mode_switch"
            onClick={toggleTheme}
          >
            <g clip-path="url(#clip0_831_838)">
              <path
                d="M8.00004 10.6666C9.4728 10.6666 10.6667 9.47268 10.6667 7.99992C10.6667 6.52716 9.4728 5.33325 8.00004 5.33325C6.52728 5.33325 5.33337 6.52716 5.33337 7.99992C5.33337 9.47268 6.52728 10.6666 8.00004 10.6666Z"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M8 1.33325V2.66659"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M8 13.3333V14.6666"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M3.28662 3.28662L4.22662 4.22662"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.7733 11.7734L12.7133 12.7134"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M1.33337 8H2.66671"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M13.3334 8H14.6667"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M4.22662 11.7734L3.28662 12.7134"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12.7133 3.28662L11.7733 4.22662"
                stroke="#FF6900"
                stroke-width="1.33333"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_831_838">
                <rect width="16" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        )}

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
