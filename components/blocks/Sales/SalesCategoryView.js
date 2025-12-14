"use client";

import React, { useState, useEffect, useCallback } from "react";
import style from "../Catalog/catalog.module.scss";
import Cards from "@/components/shared/Cards";
import {
    getCategories as getIDBCategories,
    saveCategories,
} from "@/lib/indexedDB";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import ProductOptionsModal from "../Catalog/ProductOptionsModal";

// Helper function to normalize categories
const normalizeCategories = (categories) => {
    if (!categories) return [];

    const allCategories = [];
    const parentCategories = [];

    categories.forEach((parentCategory) => {
        if (parentCategory?.children) {
            parentCategories.push({
                id: parentCategory.id,
                name: parentCategory.name,
                level: parentCategory.level,
            });

            parentCategory.children.forEach((childCategory) => {
                allCategories.push({
                    id: childCategory.id,
                    name: childCategory.name,
                    level: childCategory.level,
                    parent_id: parentCategory.id,
                });

                if (childCategory.children) {
                    childCategory.children.forEach((grandChild) => {
                        allCategories.push({
                            id: grandChild.id,
                            name: grandChild.name,
                            level: grandChild.level,
                            parent_id: childCategory.id,
                        });
                    });
                }
            });
        }
    });

    return { allCategories, parentCategories };
};

export default function SalesCategoryView({
    categories: initialCategories,
    productItems,
    handleAddToCart,
    currencySymbol,
    currency,
    cartItems,
}) {

    const isOnline = useNetworkStatus();
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedParent, setSelectedParent] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const allProducts = productItems

    // Modal state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Memoized function to group categories
    const groupCategories = useCallback((allCategories) => {
        const parentCategories = allCategories.filter((cat) => cat.level === 2);
        const childMap = allCategories.reduce((acc, cat) => {
            if (cat.level === 3) {
                acc[cat.parent_id] = acc[cat.parent_id] || [];
                acc[cat.parent_id].push(cat);
            }
            return acc;
        }, {});

        return [
            ...parentCategories.map((parent) => ({
                ...parent,
                children: childMap[parent.id] || [],
            })),
        ];
    }, []);

    // Load categories with synchronization logic
    const loadCategories = useCallback(async () => {
        try {
            let allCategories = initialCategories;

            try {
                if (allCategories?.data?.length > 0) {
                    const normalized = normalizeCategories(allCategories.data);
                    allCategories = normalized.allCategories;
                    await saveCategories(allCategories);
                }
            } catch (onlineError) {
                console.warn("Failed to fetch fresh categories, falling back to offline data:", onlineError);
            }

            // If no fresh data or offline, use IndexedDB
            if (!allCategories || allCategories.length === 0) {
                const offlineCategories = await getIDBCategories();
                if (offlineCategories?.length > 0) {
                    allCategories = offlineCategories;
                }
            }

            // Update state
            const groupedCategories = groupCategories(allCategories || []);
            setCategories(groupedCategories);

            // Set the first category as selected initially
            if (groupedCategories.length > 0 && !selectedItem) {
                const firstCategory = groupedCategories[0];
                setSelectedItem(firstCategory);

                // Filter products for the initial category
                const filtered = productItems?.filter((item) =>
                    item?.categories?.some((cat) => cat?.name === firstCategory.name)
                ) || [];
                setProducts(filtered);
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    }, [initialCategories, groupCategories, selectedItem, productItems]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const handleCategoryClick = useCallback(async (category) => {
        setSelectedItem(category);
        setOpenDropdownId(null);

        // Filter products based on selected category
        const filtered = productItems?.filter((item) =>
            item?.categories?.some((cat) => cat?.name === category.name)
        ) || [];

        setProducts(filtered);

        if (category.level === 2) {
            setSelectedParent(category);
        } else {
            try {
                const allCategories = await getIDBCategories();
                const parent = allCategories.find((cat) => cat.id === category.parent_id);
                if (parent) {
                    setSelectedParent(parent);
                }
            } catch (err) {
                console.error("Error finding parent category:", err);
            }
        }
    }, [productItems]);

    const toggleDropdown = useCallback((e, id) => {
        e.stopPropagation();
        setOpenDropdownId((prev) => (prev === id ? null : id));
    }, []);

    const handleProductClick = (item) => {
        const isSimple = item?.__typename === "SimpleProduct";
        const hasRequiredOptions = Array.isArray(item?.options)
            ? item.options.some((option) => option.required)
            : false;
        const quantityToAdd =
            parseFloat(
                item?.custom_attributes?.find(
                    (attr) => attr?.attribute_code === "qty_increment_step"
                )?.attribute_value
            ) || 1;

        if (isSimple && !hasRequiredOptions) {
            handleAddToCart(item, [], quantityToAdd);
        } else {
            // Either it's not simple OR it has required options, show modal
            setSelectedProduct(item);
            setIsModalOpen(true);
        }
    }

    const handleConfirm = ({ product, childSku, options }) => {
        const skuToUse = childSku || product.sku;
        const item = { ...product, sku: skuToUse };
        handleAddToCart(item, options, 1);
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    return (
        <div className={style.product_page} style={{ padding: 0 }}>
            <div className={style.categories}>
                <div className={style.cat_block}>
                    {categories.map((item) => {
                        const isOpen = openDropdownId === item.id;
                        const hasChildren = item.children?.length > 0;

                        return (
                            <div className={style.dropdown_container} key={item.id}>
                                <div
                                    className={`${style.dropdown_button} ${item.id === selectedItem?.id ||
                                        item.id === selectedParent?.id
                                        ? style.active
                                        : ""
                                        }`}
                                    onClick={() => handleCategoryClick(item)}
                                >
                                    {item.name}
                                    {hasChildren && (
                                        <span
                                            className={style.arrow}
                                            onClick={(e) => toggleDropdown(e, item.id)}
                                        >
                                            {isOpen ? "▲" : "▼"}
                                        </span>
                                    )}
                                </div>

                                {hasChildren && isOpen && (
                                    <ul className={style.dropdown_menu}>
                                        {item.children.map((child) => (
                                            <li
                                                key={child.id}
                                                className={
                                                    child.id === selectedItem?.id ? style.active : ""
                                                }
                                                onClick={() => handleCategoryClick(child)}
                                            >
                                                {child.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="page_detail section_padding" style={{ width: '100%' }}>
                    <div className="grid_4">
                        {products?.length > 0 ? (
                            products.map((item, index) => {
                                const isInCart = cartItems.some(cartItem => {
                                    const cartProd = cartItem?.product;
                                    if (!cartProd) return false;

                                    // Check direct match (Simple Product or same Configurable)
                                    if ((cartProd.uid && item.uid && cartProd.uid === item.uid) ||
                                        (cartProd.id && item.id && cartProd.id === item.id) ||
                                        cartProd.sku === item.sku) {
                                        return true;
                                    }

                                    // Check if cart item is a variant of this parent product
                                    if (item.__typename === "ConfigurableProduct" && item.variants) {
                                        return item.variants.some(variant =>
                                            variant.product.sku === cartProd.sku ||
                                            variant.product.uid === cartProd.uid
                                        );
                                    }

                                    return false;
                                });
                                return (
                                    <div key={index} onClick={() => handleProductClick(item)} style={{ cursor: 'pointer', border: isInCart ? '2px solid #28a745' : 'none', borderRadius: '8px' }}>
                                        <Cards item={item} cards={false} currencySymbol={currencySymbol} />
                                    </div>
                                )
                            })
                        ) : (
                            <p className="no_prods">No products found in this category</p>
                        )}
                    </div>
                </div>
            </div>

            {selectedProduct && isModalOpen && (
                <ProductOptionsModal
                    item={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProduct(null);
                    }}
                    onConfirm={handleConfirm}
                    allProducts={allProducts}
                />
            )}
        </div>
    );
}