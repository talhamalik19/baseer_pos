"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";

export default function SideBarList({ styles, nav, isSidebarExpanded, onLinkClick }) {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderItems = (items, parentKey = "") => {
    return (
      <ul className={styles.nav_list}>
        {items.map((item, index) => {
          const key = `${parentKey}-${index}`;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = !!openDropdowns[key];
          const isActive = pathname.startsWith(item?.field_redirect);

          return (
            <li
              key={key}
              className={`${styles.nav_item} ${isOpen ? styles.dropdown_open : ""}`}
            >
              <div className={styles.nav_wrapper}>
                {item.field_redirect ? (
                  <Link
                    href={item.field_redirect}
                    onClick={onLinkClick} // 👈 Call the handler to close sidebar in mobile
                    className={`
                      ${styles.nav_link}
                      ${isActive ? styles.active : ""}
                      ${hasChildren ? styles.has_children : ""}
                    `}
                  >
                    {item.svg && <span className={styles.nav_icon}>{item.svg}</span>}
                    {isSidebarExpanded && (
                      <span className={styles.nav_text}>{item.field_text}</span>
                    )}
                  </Link>
                ) : (
                  <div
                    className={`${styles.nav_link} ${hasChildren ? styles.has_children : ""}`}
                    onClick={(e) => toggleDropdown(key, e)}
                  >
                    {item.svg && <span className={styles.nav_icon}>{item.svg}</span>}
                    {isSidebarExpanded && (
                      <span className={styles.nav_text}>{item.field_text}</span>
                    )}
                  </div>
                )}

                {/* Real clickable arrow */}
                {hasChildren && isSidebarExpanded && (
                  <span
                    className={`${styles.dropdown_arrow} ${isOpen ? styles.arrow_open : ""}`}
                    onClick={(e) => toggleDropdown(key, e)}
                  />
                )}
              </div>

              {/* Render children */}
              {hasChildren && isSidebarExpanded && (
                <ul
                  className={`${styles.dropdown_panel} ${isOpen ? styles.expanded : ""}`}
                  style={{
                    maxHeight: isOpen ? "500px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.3s ease",
                  }}
                >
                  {item.children.map((child, childIndex) => (
                    <li key={`${key}-child-${childIndex}`} className={styles.nav_item}>
                      <Link
                        href={child.field_redirect}
                        onClick={onLinkClick} // 👈 close sidebar when child clicked
                        className={`
                          ${styles.nav_link}
                          ${pathname.startsWith(child?.field_redirect) ? styles.active : ""}
                        `}
                      >
                        {child.svg && <span className={styles.nav_icon}>{child.svg}</span>}
                        {isSidebarExpanded && (
                          <span className={styles.nav_text}>{child.field_text}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return <>{renderItems(nav)}</>;
}
