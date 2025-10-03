"use client";

import React, { useState, useEffect } from "react";
import styles from "./Sidebar.module.scss";
import Image from "next/image";
import Link from "next/link";
import SideBarList from "./SideBarList";
import { useMyContext } from "@/context/SidebarContext";
import { getPOSData, isSuperAdmin, permissionMap } from "@/lib/acl";
import CurrencyLanguageSwitcher from "@/components/global/PageHead/CurrencyLanguageSwitcher";

export default function SideBarClient({ nav, language, currency}) {
  const { state, setState } = useMyContext();
  const [isOpen, setIsOpen] = useState(state ?? true);
  const [isMobile, setIsMobile] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [permissions, setPermissions] = useState({});
  const [hasPosCode, setHasPosCode] = useState(false);

  useEffect(() => {
    const code = localStorage.getItem('pos_code');
    if (code) {
      setHasPosCode(true);
    }
  }, []);

  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      
      if (isMobileView) {
        setIsOpen(false);
        setState(false);
      } else {
        setIsOpen(state);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, [state]);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    setIsNavHovered(false);
  };

  const handleNavMouseEnter = () => {
    if (!isMobile && !isOpen && typeof window !== 'undefined' && localStorage.getItem("pos_code") !== null) {
      setIsNavHovered(true);
    }
  };

  const handleNavMouseLeave = () => !isMobile && !isOpen && setIsNavHovered(false);

  useEffect(() => {
    const loadPermissions = async () => {
      const posData = await getPOSData();
      setPermissions((posData?.acl ? posData?.acl : posData?.admin_acl) || {});
    };

    loadPermissions();
    window.addEventListener('storage', loadPermissions);
    return () => window.removeEventListener('storage', loadPermissions);
  }, []);

  const hasAccess = (itemText) => {
    const alwaysVisible = ["Sales", "Orders", "Manage POS", "Catalog"];
    if (alwaysVisible.includes(itemText)) return true;
    if (isSuperAdmin()) return true;

    const permissionKey = permissionMap[itemText];
    return permissionKey ? permissions[permissionKey] : false;
  };

  const filterNavItems = (items) => {
    if (isSuperAdmin()) return items;

    return items
      .map(item => {
        if (item.children) {
          const filteredChildren = item.children.filter(child => hasAccess(child.field_text));
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter(item => {
        return (
          hasAccess(item.field_text) ||
          (item.children && item.children.length > 0)
        );
      });
  };

  const filteredNav = filterNavItems(nav);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById("sidebar");
      if (isMobile && isOpen && sidebar && !sidebar.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isMobile) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  return (
    <>
      {isMobile && (
        <button className={styles.toggleButton} onClick={toggleSidebar}>
          {!isOpen && "☰"}
        </button>
      )}

      {isMobile && isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      <aside
        id="sidebar"
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed} ${
          isNavHovered ? styles.hovered : ""
        }`}
      >
        <div className={styles.logo}>
          {isOpen || isNavHovered ? (
            <Link href="/dashboard">
              <Image src={`${process.env.NEXT_PUBLIC_API_URL}/media/.thumbswysiwyg/desktop_logo.png`} alt="Logo" width={148} height={40} />
            </Link>
          ) : (
            <Link href="/dashboard">
              <Image src={`${process.env.NEXT_PUBLIC_API_URL}/media/.thumbswysiwyg/responsive_logo.png`} alt="Logo" width={40} height={40} style={{maxWidth: "40px", height: "40px"}} />
            </Link>
          )}
        </div>

        <div 
          className={styles.aside}
          onMouseEnter={handleNavMouseEnter}
          onMouseLeave={handleNavMouseLeave}
        >
          <nav className={styles.nav}>
            {hasPosCode && <SideBarList
  styles={styles}
  nav={filteredNav}
  isSidebarExpanded={isOpen || isNavHovered}
  onLinkClick={() => {
    if (isMobile) setIsOpen(false);
  }}
/>
}
          </nav>
          
          {/* Mobile Currency/Language Switcher */}
          {isMobile && (
            <div className={'mobileSwitcherContainer'}>
              <CurrencyLanguageSwitcher 
                serverCurrency={currency}
                serverLanguage={language}
              />
            </div>
          )}
        </div> 
      </aside>
    </>
  );
}