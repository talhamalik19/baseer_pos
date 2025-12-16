"use client";

import React, { useState, useEffect, useCallback } from "react";
import style from "../Catalog/catalog.module.scss";
import Cards from "@/components/shared/Cards";
import {
    getCategories as getIDBCategories,
    saveCategories,
    getCartItems,
    updateCartItemQuantity,
    updateWholeProduct,
    deleteFromCart,
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
    setCartItems,
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
    const [existingCartItem, setExistingCartItem] = useState(null);
    const [existingCartItems, setExistingCartItems] = useState([]);

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
            }
        } catch (err) {
            console.error("Error loading categories:", err);
        }
    }, [initialCategories, groupCategories, selectedItem, productItems]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Effect to filter products when category or productItems change
    useEffect(() => {
        if (selectedItem) {
            const filtered = productItems?.filter((item) =>
                item?.categories?.some((cat) => cat?.name === selectedItem.name)
            ) || [];
            setProducts(filtered);
        } else {
            setProducts([]);
        }
    }, [selectedItem, productItems]);

    const handleCategoryClick = useCallback(async (category) => {
        setSelectedItem(category);
        setOpenDropdownId(null);

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

    const handleProductClick = async (item) => {
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
            // Find all variants of this product in cart
            const cartItemsList = await getCartItems();
            const variantsInCart = cartItemsList.filter(cartItem => {
                const cartProd = cartItem.product;

                if (item.__typename === "ConfigurableProduct") {
                    // Check if it's a variant of THIS product
                    const isVariant = item.variants?.some(variant =>
                        variant.product.sku === cartProd.sku || variant.product.uid === cartProd.uid
                    );

                    if (!isVariant) return false;

                    // STRICT CHECK: Verify parent product ID matches
                    if (cartProd.product_id && item.id && cartProd.product_id === item.id) {
                        return true;
                    }

                    // Fallback for older items without product_id: check if options match
                    if (!cartProd.product_id && cartItem.selected_options && item.configurable_options) {
                        // If no product_id is stored, we have to rely on the variant check + options check
                        // This is less safe but handles legacy cart items
                        return true;
                    }

                    return false;
                }

                // For simple products
                return cartProd.uid === item.uid || cartProd.id === item.id;
            });

            setExistingCartItems(variantsInCart);
            setExistingCartItem(null);
            setSelectedProduct(item);
            setIsModalOpen(true);
        }
    }

    const handleConfirm = async ({ product, childSku, options, quantity }) => {
        const skuToUse = childSku || product.sku;
        const item = { ...product, sku: skuToUse };

        // Check if this exact variant+options combination already exists
        const cartItemsList = await getCartItems();
        const exactMatch = cartItemsList.find(
            cartItem => {
                // Basic check: UID matches and options match
                const basicMatch = cartItem.product.uid === item.uid &&
                    JSON.stringify(cartItem.selected_options) === JSON.stringify(options);

                if (!basicMatch) return false;

                // STRICT CHECK: Verify parent product ID matches if available
                if (item.product_id) {
                    if (cartItem.product.product_id) {
                        return item.product_id === cartItem.product.product_id;
                    }
                    // If incoming has ID but existing doesn't, assume different to be safe
                    return false;
                }

                return true;
            }
        );

        if (exactMatch) {
            // Replace quantity instead of incrementing
            await updateCartItemQuantity(exactMatch.product.uid, exactMatch.addedAt, quantity);
        } else {
            // Add as new item
            handleAddToCart(item, options, quantity);
        }

        // Update cart state
        const updatedCart = await getCartItems();
        if (setCartItems) {
            setCartItems(updatedCart);
        }

        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    const handleDeleteCartItem = async (cartItem) => {
        await deleteFromCart(cartItem.uid);
        const updatedCart = await getCartItems();

        // Update the existing cart items list in modal
        // Update the existing cart items list in modal
        const variantsInCart = updatedCart.filter(cartItem => {
            const cartProd = cartItem.product;
            if (selectedProduct.__typename === "ConfigurableProduct") {
                const isVariant = selectedProduct.variants?.some(variant =>
                    variant.product.sku === cartProd.sku || variant.product.uid === cartProd.uid
                );
                if (!isVariant) return false;
                if (cartProd.product_id && selectedProduct.id && cartProd.product_id === selectedProduct.id) {
                    return true;
                }
                // Fallback for older items without product_id: check if options match
                if (!cartProd.product_id && cartItem.selected_options && selectedProduct.configurable_options) {
                    return true;
                }
                return false;
            }
            return cartProd.uid === selectedProduct.uid || cartProd.id === selectedProduct.id;
        });

        setExistingCartItems(variantsInCart);

        // Update parent cart state
        if (setCartItems) {
            setCartItems(updatedCart);
        }
    };

    const handleUpdateCartItem = async () => {
        const updatedCart = await getCartItems();
        if (setCartItems) {
            setCartItems(updatedCart);
        }

        // Also update existingCartItems for the modal
        if (selectedProduct) {
            // Also update existingCartItems for the modal
            if (selectedProduct) {
                const variantsInCart = updatedCart.filter(cartItem => {
                    const cartProd = cartItem.product;
                    if (selectedProduct.__typename === "ConfigurableProduct") {
                        const isVariant = selectedProduct.variants?.some(variant =>
                            variant.product.sku === cartProd.sku || variant.product.uid === cartProd.uid
                        );
                        if (!isVariant) return false;
                        if (cartProd.product_id && selectedProduct.id && cartProd.product_id === selectedProduct.id) {
                            return true;
                        }
                        // Fallback for older items without product_id
                        if (!cartProd.product_id && cartItem.selected_options && selectedProduct.configurable_options) {
                            return true;
                        }
                        return false;
                    }
                    return cartProd.uid === selectedProduct.uid || cartProd.id === selectedProduct.id;
                });
                setExistingCartItems(variantsInCart);
            }
        }
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
                                const cartItem = cartItems.find(cartItem => {
                                    const cartProd = cartItem?.product;
                                    if (!cartProd) return false;

                                    // Check direct match (Simple Product or same Configurable parent added directly)
                                    if ((cartProd.uid && item.uid && cartProd.uid === item.uid) ||
                                        (cartProd.id && item.id && cartProd.id === item.id) ||
                                        cartProd.sku === item.sku) {
                                        return true;
                                    }

                                    // For configurable products, check if cart item is a variant of THIS specific parent
                                    if (item.__typename === "ConfigurableProduct" && item.variants) {
                                        // First, verify the cart item is a variant of the current product
                                        const isVariant = item.variants.some(variant =>
                                            variant.product.sku === cartProd.sku || variant.product.uid === cartProd.uid
                                        );

                                        if (!isVariant) return false;

                                        // Now verify this variant belongs to THIS parent product by checking product_id
                                        // The product_id field is set when adding a variant in ProductOptionsModal
                                        if (cartProd.product_id && item.id && cartProd.product_id === item.id) {
                                            return true;
                                        }

                                        // Also check uid-based matching for parent
                                        if (cartProd.product_id && item.uid && cartProd.product_id === item.uid) {
                                            return true;
                                        }

                                        // Fallback: check if selected_options reference this parent's configurable options
                                        if (cartItem.selected_options?.super_attributes && item.configurable_options) {
                                            const hasMatchingOptions = Object.keys(cartItem.selected_options.super_attributes).some(attrCode =>
                                                item.configurable_options.some(configOpt =>
                                                    configOpt.attribute_code === attrCode
                                                )
                                            );
                                            // Only return true if both conditions match: is a variant AND has matching options
                                            if (hasMatchingOptions && isVariant) {
                                                return true;
                                            }
                                        }

                                        return false;
                                    }

                                    return false;
                                });

                                const isInCart = !!cartItem;

                                return (
                                    <div key={index} onClick={() => handleProductClick(item)} style={{ cursor: 'pointer', border: isInCart ? '2px solid #28a745' : 'none', borderRadius: '8px' }}>
                                        <Cards
                                            item={item}
                                            cards={isInCart}
                                            record={cartItem}
                                            setCartItems={setCartItems}
                                            currencySymbol={currencySymbol}
                                        />
                                    </div>
                                )
                            })
                        ) : (
                            <p className="no_prods">Loading...</p>
                        )}
                    </div>
                </div>
            </div>

            {selectedProduct && isModalOpen && (
                <ProductOptionsModal
                    key={selectedProduct.uid || selectedProduct.id}
                    item={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProduct(null);
                    }}
                    onConfirm={handleConfirm}
                    allProducts={allProducts}
                    existingCartItem={existingCartItem}
                    existingCartItems={existingCartItems}
                    onDeleteCartItem={handleDeleteCartItem}
                    onUpdateCartItem={handleUpdateCartItem}
                    currencySymbol={currencySymbol}
                />
            )}
        </div>
    );
}