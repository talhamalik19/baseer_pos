import React, { useState, useEffect, useCallback } from "react";
import styles from "./productOptionsModal.module.scss";
import {
  updateCartItemQuantity,
  updateWholeProduct,
  deleteFromCart,
  getCartItems
} from "@/lib/indexedDB";

export default function ProductOptionsModal({
  item,
  isOpen,
  onClose,
  onConfirm,
  allProducts,
  existingCartItem = null,
  existingCartItems = [],
  onDeleteCartItem,
  onUpdateCartItem,
  currencySymbol
}) {
  const [selectedConfigurable, setSelectedConfigurable] = useState({});
  const [selectedCustomizable, setSelectedCustomizable] = useState({});
  const [childSku, setChildSku] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantityInput, setQuantityInput] = useState("1");
  const [priceInput, setPriceInput] = useState("");
  const [percentageInput, setPercentageInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentCartItemUid, setCurrentCartItemUid] = useState(null);

  const loginDetail = JSON.parse(localStorage.getItem("loginDetail"));
  const adminAcl = loginDetail?.admin_acl;

  // Add this function to handle real-time cart updates
  const updateCartInRealTime = useCallback(async (quantity, price = null) => {
    if (!isCustomizableComplete()) return;
    if (item.__typename === "ConfigurableProduct" && !isConfigurableComplete()) return;

    const finalPrice = price || parseFloat(priceInput) || getCurrentPrice();
    const finalQuantity = parseFloat(quantity) || parseFloat(quantityInput) || 1;

    const productToAdd = selectedVariant || item;
    const product_id = item.id;
    const variantSku = selectedVariant ? selectedVariant.sku : item.sku;

    const productWithCorrectPrice = {
      ...productToAdd,
      id: item.id,
      product_id: product_id,
      sku: variantSku,
      product_type: item.__typename === "ConfigurableProduct" ? "configurable" : "simple",
      price: finalPrice,
      discounted_price: finalPrice,
      qty: finalQuantity,
      name: getProductName(),
      image: item.image,
      small_image: item.small_image,
      thumbnail: item.thumbnail,
      media_gallery: item.media_gallery
    };

    const options = {
      super_attributes: { ...selectedConfigurable },
      custom_attributes: Object.entries(selectedCustomizable).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value.join(',') : value;
        return acc;
      }, {})
    };

    try {
      // If we have a specific cart item UID we are working with, use that
      if (currentCartItemUid) {
        // Update existing cart item by UID
        const { updateCartItemQuantity } = await import("@/lib/indexedDB");
        await updateCartItemQuantity(
          currentCartItemUid,
          finalQuantity
        );

        // Also update price if changed
        if (price !== null) {
          const { updateWholeProduct } = await import("@/lib/indexedDB");
          await updateWholeProduct(
            currentCartItemUid,
            {
              // We need to fetch the item first to get the full object, but for now we assume we are just updating price
              // Ideally updateWholeProduct should handle partial updates or we fetch first.
              // But here we are constructing the product object.
              // Let's rely on the fact that updateWholeProduct in DB fetches the item if needed or we pass the full new item.
              // Actually updateWholeProduct takes (uid, newItem). We need to construct newItem correctly.
              // Since we don't have the full old item here easily without fetching, let's fetch it or construct it.
              // For safety, let's fetch the current item from DB to merge.
              // But wait, we have existingCartItems prop, maybe we can find it there?
              // existingCartItems might be stale.
              // Let's just update the price on the product object we have constructed.

              product: productWithCorrectPrice,
              selected_options: options,
              quantity: finalQuantity,
              uid: currentCartItemUid,
              addedAt: Date.now() // Update timestamp? Maybe not needed.
            }
          );
        }
      } else {
        // Fallback to finding matching item if no UID tracked yet (e.g. first add)
        // Check if this item already exists in cart
        let matchingCartItem = null;
        if (item.__typename === "ConfigurableProduct") {
          if (selectedVariant) {
            matchingCartItem = existingCartItems.find(cartItem =>
              cartItem.product.sku === selectedVariant.sku ||
              cartItem.product.uid === selectedVariant.uid
            );
          }
        } else {
          matchingCartItem = existingCartItems.find(cartItem =>
            cartItem.product.uid === item.uid ||
            cartItem.product.id === item.id
          );
        }

        if (matchingCartItem) {
          // Update existing cart item
          const { updateCartItemQuantity } = await import("@/lib/indexedDB");
          await updateCartItemQuantity(
            matchingCartItem.uid,
            finalQuantity
          );
          setCurrentCartItemUid(matchingCartItem.uid);

          // Also update price if changed
          if (price !== null) {
            const { updateWholeProduct } = await import("@/lib/indexedDB");
            await updateWholeProduct(
              matchingCartItem.uid,
              {
                ...matchingCartItem,
                product: {
                  ...matchingCartItem.product,
                  discounted_price: finalPrice,
                  price: finalPrice
                }
              }
            );
          }
        } else if (isConfigurableComplete() && isCustomizableComplete()) {
          // Add new item to cart
          const { addToCart } = await import("@/lib/indexedDB");
          const newUid = await addToCart(productWithCorrectPrice, options, finalQuantity, 0);
          if (newUid) {
            setCurrentCartItemUid(newUid);
          }
        }
      }

      // Trigger parent update
      if (onUpdateCartItem) {
        onUpdateCartItem();
      }
    } catch (error) {
      console.error("Error updating cart in real-time:", error);
    }
  }, [selectedVariant, selectedConfigurable, selectedCustomizable, item, existingCartItems, priceInput, currentCartItemUid]);

  useEffect(() => {
    if (item?.__typename === "ConfigurableProduct" && item?.variants) {
      findMatchingVariant();
    }
  }, [selectedConfigurable, item, allProducts]);

  // Auto-select first variant when modal opens
  useEffect(() => {
    if (isOpen && item?.__typename === "ConfigurableProduct" && item?.configurable_options && !existingCartItem) {
      if (Object.keys(selectedConfigurable).length === 0) {
        const firstVariantSelection = {};
        item.configurable_options.forEach(option => {
          if (option.values && option.values.length > 0) {
            firstVariantSelection[option.attribute_id] = option.values[0].value_index;
          }
        });
        setSelectedConfigurable(firstVariantSelection);
      }
    }
  }, [isOpen, item, existingCartItem]);

  // Pre-populate modal from existing cart item
  useEffect(() => {
    if (existingCartItem && isOpen) {
      setQuantityInput(String(existingCartItem.quantity || 1));
      setCurrentCartItemUid(existingCartItem.uid);

      if (existingCartItem.selected_options?.super_attributes) {
        setSelectedConfigurable(existingCartItem.selected_options.super_attributes);
      }

      if (existingCartItem.selected_options?.custom_attributes) {
        const customAttrs = existingCartItem.selected_options.custom_attributes;
        const customizable = {};

        Object.entries(customAttrs).forEach(([optionId, value]) => {
          if (typeof value === 'string' && value.includes(',')) {
            customizable[optionId] = value.split(',');
          } else {
            customizable[optionId] = value;
          }
        });

        setSelectedCustomizable(customizable);
      }

      if (existingCartItem.product?.discounted_price) {
        setPriceInput(existingCartItem.product.discounted_price);
      }
    } else if (isOpen) {
      setQuantityInput("1");
      setSelectedConfigurable({});
      setSelectedCustomizable({});
      setChildSku(null);
      setSelectedVariant(null);
      setPriceInput("");
      setPercentageInput("");
      setPriceInput("");
      setPercentageInput("");
      setErrorMessage("");
      setCurrentCartItemUid(null);
    }
  }, [existingCartItem, isOpen, item]);

  // Sync quantity input with existing cart items AND update cart when quantity changes
  useEffect(() => {
    if (!isOpen) return;

    // If we are in "Edit Mode" (existingCartItem is passed), we rely on the initial population effect
    if (existingCartItem) return;

    let match = null;

    if (item.__typename === "ConfigurableProduct") {
      if (selectedVariant) {
        match = existingCartItems.find(cartItem =>
          cartItem.product.sku === selectedVariant.sku ||
          cartItem.product.uid === selectedVariant.uid
        );
      }
    } else {
      // Simple product
      match = existingCartItems.find(cartItem =>
        cartItem.product.uid === item.uid ||
        cartItem.product.id === item.id
      );
    }

    if (match) {
      setQuantityInput(String(match.quantity));
      setCurrentCartItemUid(match.uid);
    } else {
      setQuantityInput("1");
      setCurrentCartItemUid(null);
    }
  }, [selectedVariant, existingCartItems, item, isOpen, existingCartItem]);

  // Add this effect to update cart when quantity changes in real-time
  // useEffect(() => {
  //   if (isOpen && !existingCartItem && quantityInput !== "1") {
  //     // Debounce the update to prevent too many rapid updates
  //     const timeoutId = setTimeout(() => {
  //       if (isConfigurableComplete() && isCustomizableComplete()) {
  //         updateCartInRealTime(parseFloat(quantityInput));
  //       }
  //     }, 300); // 300ms delay

  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [quantityInput, isOpen, existingCartItem, updateCartInRealTime]);

  const findMatchingVariant = () => {
    if (!item.variants || !item.configurable_options) return;

    const attributeCodeToId = {};
    item.configurable_options.forEach(opt => {
      attributeCodeToId[opt.attribute_code] = opt.attribute_id.toString();
    });

    const matchedVariant = item.variants.find(variant =>
      variant.attributes.every(attr => {
        const attributeId = attributeCodeToId[attr.code];
        return selectedConfigurable[attributeId] === attr.value_index;
      })
    );

    setChildSku(matchedVariant?.product?.sku || null);

    if (matchedVariant?.product?.sku && allProducts) {
      const variantProduct = allProducts.find(
        product => product.sku === matchedVariant.product.sku
      );
      setSelectedVariant(variantProduct || null);
    } else {
      setSelectedVariant(null);
    }
  };

  const getSelectedOptionUid = (attributeId) => {
    const selectedValueIndex = selectedConfigurable[attributeId];
    if (!selectedValueIndex) return "";

    const optionGroup = item.configurable_options?.find(
      opt => opt.attribute_id === attributeId.toString()
    );

    if (!optionGroup) return "";

    const selectedValue = optionGroup.values.find(
      val => val.value_index === selectedValueIndex
    );

    return selectedValue?.uid || "";
  };

  const getSelectedVariantLabel = () => {
    if (!selectedVariant) return null;
    const variantName = selectedVariant.name?.toLowerCase() || '';
    if (variantName.includes('small')) return 'small';
    if (variantName.includes('medium')) return 'medium';
    if (variantName.includes('large')) return 'large';
    return null;
  };

  const getCupAdditionalPrice = () => {
    const variantLabel = getSelectedVariantLabel();
    if (!variantLabel) return 0;

    const priceMap = {
      'small': item?.small_cup_additional_price || 0,
      'medium': item?.medium_cup_additional_price || 0,
      'large': item?.large_cup_additional_price || 0
    };

    return parseFloat(priceMap[variantLabel]) || 0;
  };

  const getProductName = () => {
    if (selectedVariant) {
      return `${item.name} - ${selectedVariant.name}`;
    }
    return item.name;
  };

  const getBasePrice = () => {
    let basePrice = 0;

    if (selectedVariant) {
      basePrice = selectedVariant.special_price ||
        selectedVariant.price?.regularPrice?.amount?.value ||
        selectedVariant.price_range?.minimum_price?.regular_price?.value ||
        item.special_price ||
        item.price?.regularPrice?.amount?.value ||
        item.price_range?.minimum_price?.regular_price?.value;
    } else {
      basePrice = item.special_price ||
        item.price?.regularPrice?.amount?.value ||
        item.price_range?.minimum_price?.regular_price?.value;
    }

    const cupAdditionalPrice = getCupAdditionalPrice();
    return basePrice + cupAdditionalPrice;
  };

  const getOptionsPrice = () => {
    let totalOptionsPrice = 0;

    if (item.options) {
      item.options.forEach(option => {
        const selectedValue = selectedCustomizable[option.option_id];

        if (selectedValue) {
          if (Array.isArray(selectedValue)) {
            selectedValue.forEach(valueId => {
              const optionValue = option.checkbox_option?.find(
                opt => opt.option_type_id == valueId
              );
              if (optionValue?.price) {
                totalOptionsPrice += optionValue.price;
              }
            });
          } else {
            const optionValue = option.radio_option?.find(
              opt => opt.option_type_id == selectedValue
            );
            if (optionValue?.price) {
              totalOptionsPrice += optionValue.price;
            }
          }
        }
      });
    }

    return totalOptionsPrice;
  };

  const getCurrentPrice = () => {
    const basePrice = getBasePrice();
    const optionsPrice = getOptionsPrice();
    return basePrice + optionsPrice;
  };

  useEffect(() => {
    if (!existingCartItem) {
      const currentTotal = getCurrentPrice();
      setPriceInput(currentTotal.toFixed(2));
      setPercentageInput("");
    }
  }, [selectedConfigurable, selectedCustomizable, selectedVariant]);

  const handleOptionChange = async (selectedUid, attributeCode) => {
    const optionGroup = item.configurable_options.find(
      (opt) => opt.attribute_code === attributeCode
    );
    const selectedValue = optionGroup?.values.find((val) => val.uid === selectedUid);

    if (!selectedValue) return;

    const newSelectedConfigurable = {
      ...selectedConfigurable,
      [optionGroup.attribute_id]: selectedValue.value_index
    };

    setSelectedConfigurable(newSelectedConfigurable);

    const attributeCodeToId = {};
    item.configurable_options.forEach(opt => {
      attributeCodeToId[opt.attribute_code] = opt.attribute_id.toString();
    });

    const matchedVariant = item.variants?.find(variant =>
      variant.attributes.every(attr => {
        const attributeId = attributeCodeToId[attr.code];
        return newSelectedConfigurable[attributeId] === attr.value_index;
      })
    );

    if (matchedVariant?.product?.sku && allProducts) {
      const variantProduct = allProducts.find(
        product => product.sku === matchedVariant.product.sku
      );

      if (variantProduct) {
        setSelectedVariant(variantProduct);
        setChildSku(matchedVariant.product.sku);

        if (isCustomizableComplete()) {
          try {
            const basePrice = variantProduct.special_price ||
              variantProduct.price?.regularPrice?.amount?.value ||
              variantProduct.price_range?.minimum_price?.regular_price?.value ||
              item.special_price ||
              item.price?.regularPrice?.amount?.value ||
              item.price_range?.minimum_price?.regular_price?.value || 0;

            const variantName = variantProduct.name?.toLowerCase() || '';
            let cupAdditionalPrice = 0;
            if (variantName.includes('small')) {
              cupAdditionalPrice = parseFloat(item?.small_cup_additional_price || 0);
            } else if (variantName.includes('medium')) {
              cupAdditionalPrice = parseFloat(item?.medium_cup_additional_price || 0);
            } else if (variantName.includes('large')) {
              cupAdditionalPrice = parseFloat(item?.large_cup_additional_price || 0);
            }

            const optionsPrice = getOptionsPrice();
            const finalPrice = basePrice + cupAdditionalPrice + optionsPrice;

            let currentQuantity = 1;
            if (existingCartItem) {
              currentQuantity = parseFloat(quantityInput) || 1;
            } else {
              const existingMatch = existingCartItems.find(cartItem =>
                cartItem.product.sku === variantProduct.sku ||
                cartItem.product.uid === variantProduct.uid
              );
              currentQuantity = existingMatch ? existingMatch.quantity : 1;
            }

            setQuantityInput(String(currentQuantity));

            const productToAdd = {
              ...variantProduct,
              id: item.id,
              product_id: item.id,
              sku: variantProduct.sku,
              product_type: "configurable",
              price: finalPrice,
              discounted_price: finalPrice,
              qty: currentQuantity,
              name: `${item.name} - ${variantProduct.name}`,
              image: item.image,
              small_image: item.small_image,
              thumbnail: item.thumbnail,
            };

            const options = {
              super_attributes: { ...newSelectedConfigurable },
              custom_attributes: Object.entries(selectedCustomizable).reduce((acc, [key, value]) => {
                acc[key] = Array.isArray(value) ? value.join(',') : value;
                return acc;
              }, {})
            };

            // If we have a current cart item AND we are in Edit Mode (existingCartItem passed), update it.
            // If we are in Add Mode (no existingCartItem), we always add a new item when switching variants,
            // to allow adding multiple different variants (e.g. Small then Medium) quickly.
            if (existingCartItem && currentCartItemUid) {
              const { updateWholeProduct } = await import("@/lib/indexedDB");
              await updateWholeProduct(currentCartItemUid, {
                product: productToAdd,
                selected_options: options,
                quantity: currentQuantity,
                uid: currentCartItemUid,
                addedAt: Date.now()
              });
            } else {
              const { addToCart } = await import("@/lib/indexedDB");
              const newUid = await addToCart(productToAdd, options, currentQuantity, 0);
              if (newUid) {
                setCurrentCartItemUid(newUid);
              }
            }

            // Trigger parent update
            if (onUpdateCartItem) {
              onUpdateCartItem();
            }
          } catch (error) {
            console.error("Error adding variant to cart:", error);
          }
        }
      }
    }
  };

  const handleCustomizableChange = (optionId, value, type = "text") => {
    setSelectedCustomizable(prev => {
      const updated = { ...prev };

      if (type === "checkbox") {
        const currentArray = updated[optionId] || [];
        const valueIndex = currentArray.indexOf(value);

        if (valueIndex > -1) {
          const newArray = currentArray.filter(v => v !== value);
          if (newArray.length === 0) {
            delete updated[optionId];
          } else {
            updated[optionId] = newArray;
          }
        } else {
          updated[optionId] = [...currentArray, value];
        }
      } else if (type === "radio") {
        if (updated[optionId] === value) {
          delete updated[optionId];
        } else {
          updated[optionId] = value;
        }
      } else {
        if (value === "" || value === undefined) {
          delete updated[optionId];
        } else {
          updated[optionId] = value;
        }
      }

      // Update cart in real-time when customizable options change
      if (isConfigurableComplete() && isCustomizableComplete()) {
        setTimeout(() => {
          updateCartInRealTime(parseFloat(quantityInput));
        }, 300);
      }

      return updated;
    });
  };

  const isConfigurableComplete = () => {
    if (item.__typename !== "ConfigurableProduct") return true;
    return Object.keys(selectedConfigurable).length === (item.configurable_options?.length || 0);
  };

  const isCustomizableComplete = () => {
    const requiredOptions = item.options?.filter(opt => opt.required) || [];
    return requiredOptions.every(opt => {
      const val = selectedCustomizable[opt.option_id];
      if (opt.checkbox_option) {
        return Array.isArray(val) && val.length > 0;
      }
      return val !== undefined && val !== "" && val !== null;
    });
  };

  const handleQuantityInputChange = (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    setQuantityInput(value);
  };

  const handleQuantityButtonChange = (delta) => {
    const currentQty = parseFloat(quantityInput) || 1;
    const newQty = Math.max(1, currentQty + delta);
    setQuantityInput(String(newQty));

    // Update cart immediately when quantity button is clicked
    if (isConfigurableComplete() && isCustomizableComplete()) {
      updateCartInRealTime(newQty);
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    setPriceInput(value);

    const currentTotal = getCurrentPrice();

    if (currentTotal > 0) {
      const discountPercent = ((currentTotal - parseFloat(value)) / currentTotal) * 100;
      setPercentageInput(discountPercent > 0 ? discountPercent.toFixed(2) : "");
    }

    setErrorMessage("");

    // Update cart with new price
    if (isConfigurableComplete() && isCustomizableComplete()) {
      updateCartInRealTime(parseFloat(quantityInput), parseFloat(value));
    }
  };

  const handlePercentageChange = (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    setPercentageInput(value);

    const currentTotal = getCurrentPrice();

    if (value && currentTotal > 0) {
      const percentage = parseFloat(value);
      const discountedPrice = currentTotal * (1 - percentage / 100);
      setPriceInput(discountedPrice.toFixed(2));

      // Update cart with new price
      if (isConfigurableComplete() && isCustomizableComplete()) {
        updateCartInRealTime(parseFloat(quantityInput), discountedPrice);
      }
    } else if (!value) {
      setPriceInput(currentTotal.toFixed(2));

      // Update cart with original price
      if (isConfigurableComplete() && isCustomizableComplete()) {
        updateCartInRealTime(parseFloat(quantityInput), currentTotal);
      }
    }

    setErrorMessage("");
  };

  const validateDiscount = () => {
    const currentTotal = getCurrentPrice();
    const inputPrice = parseFloat(priceInput);
    const pos_discount_allowed = item?.is_pos_discount_allowed == 1;
    const maxDiscountPercent = item?.pos_discount_percent || 0;

    if (!currentTotal || currentTotal <= 0) {
      return true;
    }

    // If priceInput is empty, we consider it valid (no change) or it will be handled by default value logic
    if (priceInput === "" || priceInput === null) {
      return true;
    }

    if (!pos_discount_allowed && inputPrice !== currentTotal) {
      setErrorMessage("Price changes not allowed for this item");
      setTimeout(() => setErrorMessage(""), 3000);
      return false;
    }

    if (pos_discount_allowed && inputPrice < currentTotal) {
      const discountPercent = ((currentTotal - inputPrice) / currentTotal) * 100;

      if (discountPercent > maxDiscountPercent) {
        const minAllowedPrice = (
          currentTotal *
          (1 - maxDiscountPercent / 100)
        ).toFixed(2);

        setErrorMessage(
          `Minimum allowed price is ${currencySymbol}${minAllowedPrice} (based on original ${currencySymbol}${currentTotal.toFixed(2)})`
        );

        setTimeout(() => setErrorMessage(""), 3000);

        return false;
      }
    }

    return true;
  };


  const handleConfirm = () => {
    if (!isCustomizableComplete()) return;
    if (item.__typename === "ConfigurableProduct" && !isConfigurableComplete()) {
      onClose()
      return
    };
    if (!validateDiscount()) {
      onClose()
      return
    };

    const finalPrice = parseFloat(priceInput) || getCurrentPrice();
    const quantity = parseFloat(quantityInput) || 1;

    const productToAdd = selectedVariant || item;
    const product_id = item.id;
    const sku = item.sku;
    const variantSku = selectedVariant ? selectedVariant.sku : item.sku;
    let super_attribute = {};
    if (item.__typename === "ConfigurableProduct" && Object.keys(selectedConfigurable).length > 0) {
      Object.entries(selectedConfigurable).forEach(([key, value]) => {
        super_attribute[key] = value;
      });
    }
    let custom_options = {};
    if (Object.keys(selectedCustomizable).length > 0) {
      Object.entries(selectedCustomizable).forEach(([optionId, value]) => {
        if (Array.isArray(value)) {
          custom_options[optionId] = value.join(',');
        } else {
          custom_options[optionId] = value;
        }
      });
    }
    const options = {
      super_attributes: { ...selectedConfigurable },
      custom_attributes: Object.entries(selectedCustomizable).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value.join(',') : value;
        return acc;
      }, {})
    };
    const productWithCorrectPrice = {
      ...productToAdd,
      id: item.id,
      product_id: product_id,
      sku: variantSku,
      product_type: item.__typename === "ConfigurableProduct" ? "configurable" : "simple",
      price: finalPrice,
      discounted_price: finalPrice,
      qty: quantity,
      ...(item.__typename === "ConfigurableProduct" && Object.keys(super_attribute).length > 0 && {
        super_attribute: super_attribute
      }),
      ...(Object.keys(custom_options).length > 0 && {
        custom_options: custom_options
      }),
      name: getProductName(),
      special_price: productToAdd.special_price ? finalPrice : productToAdd.special_price,
      price: {
        ...productToAdd.price,
        regularPrice: {
          ...productToAdd.price?.regularPrice,
          amount: {
            ...productToAdd.price?.regularPrice?.amount,
            value: finalPrice
          }
        }
      },
      image: item.image,
      small_image: item.small_image,
      thumbnail: item.thumbnail,
      media_gallery: item.media_gallery
    };

    onConfirm({
      product: productWithCorrectPrice,
      childSku: variantSku,
      options,
      price: finalPrice,
      quantity,
      existingCartItem
    });
    console.log("===========")
    onClose();
    setSelectedConfigurable({});
    setSelectedCustomizable({});
    setChildSku(null);
    setSelectedVariant(null);
    setQuantityInput("1");
    setPriceInput("");
    setPercentageInput("");
  };

  const renderOptionLabelWithPrice = (option) => {
    if (option.price && option.price > 0) {
      return `${option.title} (+Rs${option.price})`;
    }
    return option.title;
  };

  if (!isOpen) return null;

  const isDisabled = (item.__typename === "ConfigurableProduct" && !isConfigurableComplete()) ||
    !isCustomizableComplete();

  const basePrice = getBasePrice();
  const optionsPrice = getOptionsPrice();
  const totalPrice = getCurrentPrice();
  const productName = getProductName();
  const isUpdateMode = !!existingCartItem;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Select Options</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.productNameLabel}>{productName}</label>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.priceBreakdown}>
              <div className={styles.priceRow}>
                <span>Base Price:</span>
                <span className={styles.priceValue}>Rs{basePrice.toFixed(2)}</span>
              </div>
              {optionsPrice > 0 && (
                <div className={styles.priceRow}>
                  <span>Options:</span>
                  <span className={styles.priceValue}>+Rs{optionsPrice.toFixed(2)}</span>
                </div>
              )}
              <div className={`${styles.priceRow} ${styles.totalPriceRow}`}>
                <span>Total:</span>
                <span className={`${styles.priceValue} ${styles.totalPriceValue}`}>
                  Rs{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>



          {existingCartItems && existingCartItems.length > 0 && (
            <div className={styles.formGroup}>
              <label>Already in Cart:</label>
              <div className={styles.existingVariants}>
                {existingCartItems.map((cartItem, index) => (
                  <CartItemRow
                    key={cartItem.product.uid + index}
                    cartItem={cartItem}
                    onDeleteCartItem={onDeleteCartItem}
                    onUpdateCartItem={onUpdateCartItem}
                    adminAcl={adminAcl}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Quantity</label>
            <div className={styles.quantityControls}>
              <button
                type="button"
                className={styles.quantityButton}
                onClick={() => handleQuantityButtonChange(-1)}
              >
                -
              </button>
              <input
                type="text"
                className={styles.quantityInput}
                value={quantityInput}
                onChange={handleQuantityInputChange}
                onBlur={() => {
                  if (isConfigurableComplete() && isCustomizableComplete()) {
                    updateCartInRealTime(parseFloat(quantityInput));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
              />
              <button
                type="button"
                className={styles.quantityButton}
                onClick={() => handleQuantityButtonChange(1)}
              >
                +
              </button>
            </div>
            {errorMessage && (
              <div className={styles.errorMessage} style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
                {errorMessage}
              </div>
            )}
          </div>

          {childSku && (
            <div className={styles.formGroup}>
              <label>Selected Variant: {childSku} (Qty: {quantityInput})</label>
            </div>
          )}

          {item?.configurable_options?.map((option) => (
            <div key={option.attribute_code} className={styles.formGroup}>
              <label>{option.label}</label>
              <div className={styles.variantBoxes}>
                {option.values.map((value) => {
                  const isSelected = getSelectedOptionUid(option.attribute_id) === value.uid;
                  return (
                    <div
                      key={value.uid}
                      className={`${styles.variantBox} ${isSelected ? styles.selected : ""}`}
                      onClick={() => handleOptionChange(value.uid, option.attribute_code)}
                    >
                      {value.label}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {item?.options?.map((opt) => (
            <div key={opt.option_id} className={styles.formGroup}>
              <label>
                {opt.title} {opt.required && "*"}
              </label>

              {opt.radio_option?.map((val) => {
                const isChecked = selectedCustomizable[opt.option_id] === val.option_type_id;
                return (
                  <label key={val.option_type_id} className={styles.checkboxWrapper}>
                    <input
                      type="radio"
                      className={styles.checkbox}
                      name={`option-${opt.option_id}`}
                      value={val.option_type_id}
                      checked={isChecked}
                      onChange={(e) =>
                        handleCustomizableChange(opt.option_id, e.target.value, "radio")
                      }
                    />
                    <span className={styles.customCheck} style={{ borderRadius: '50%' }}></span>
                    {renderOptionLabelWithPrice(val)}
                  </label>
                );
              })}
              {opt.checkbox_option?.map((val) => {
                const isChecked = (selectedCustomizable[opt.option_id] || []).includes(val.option_type_id);
                return (
                  <label key={val.option_type_id} className={styles.checkboxWrapper}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      value={val.option_type_id}
                      checked={isChecked}
                      onChange={(e) =>
                        handleCustomizableChange(opt.option_id, val.option_type_id, "checkbox")
                      }
                    />
                    <span className={styles.customCheck}></span>
                    {renderOptionLabelWithPrice(val)}
                  </label>
                );
              })}

              {!opt.radio_option && !opt.checkbox_option && (
                <input
                  type="text"
                  className={styles.formControl}
                  value={selectedCustomizable[opt.option_id] || ""}
                  onChange={(e) =>
                    handleCustomizableChange(opt.option_id, e.target.value, "text")
                  }
                  onBlur={() => {
                    if (isConfigurableComplete() && isCustomizableComplete()) {
                      updateCartInRealTime(parseFloat(quantityInput));
                    }
                  }}
                  placeholder={`Enter ${opt.title}`}
                />
              )}
            </div>
          ))}

          <div className={styles.formFooter}>
            {isUpdateMode && (
              <button
                onClick={() => {
                  if (onDeleteCartItem && existingCartItem) {
                    onDeleteCartItem(existingCartItem);
                    onClose();
                  }
                }}
                className={styles.btnSecondary}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', marginRight: 'auto' }}
              >
                Delete
              </button>
            )}
            <button onClick={onClose} className={styles.btnSecondary}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={styles.btnPrimary}
            // disabled={isDisabled}
            >
              {isUpdateMode ? `Update Cart - Rs${parseFloat(priceInput || totalPrice).toFixed(2)}` : `Add to Cart - Rs${parseFloat(priceInput || totalPrice).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CartItemRow = ({ cartItem, onDeleteCartItem, onUpdateCartItem, adminAcl }) => {
  const [localQty, setLocalQty] = useState(cartItem.quantity);
  const [localPrice, setLocalPrice] = useState(cartItem.product.discounted_price || cartItem.product.price);
  const [errorMessage, setErrorMessage] = useState("");

  const variantName = cartItem.product.name;
  const variantSku = cartItem?.product?.sku;
  const variantProduct = cartItem?.product;

  // Currency symbol - you can make this dynamic based on your app
  const currencySymbol = "Rs";

  const isPriceDisabled = () => variantProduct?.is_pos_discount_allowed !== 1;

  // Get quantity increment step from product attributes
  const getAttribute = (code) => {
    return (
      cartItem.product?.custom_attributes?.find((attr) => attr.attribute_code === code)
        ?.attribute_value || null
    );
  };
  const qtyIncrementStep = parseFloat(getAttribute("qty_increment_step")) || 1;

  useEffect(() => {
    setLocalQty(cartItem.quantity);
  }, [cartItem.quantity]);

  useEffect(() => {
    setLocalPrice(cartItem.product.discounted_price || cartItem.product.price);
  }, [cartItem.product.discounted_price, cartItem.product.price]);

  // Validation function similar to validateDiscount
  const validatePriceChange = (inputPrice) => {
    const basePrice = variantProduct.price || 0;
    const inputPriceNum = parseFloat(inputPrice);
    const pos_discount_allowed = variantProduct?.is_pos_discount_allowed == 1;
    const maxDiscountPercent = variantProduct?.pos_discount_percent || 0;

    // Handle tax/discounted price if available
    // Note: You might need to adjust this based on how tax is stored in cartItem
    const taxOrDiscountedPrice = variantProduct?.tax_amount || 0;
    const effectiveBase = basePrice + taxOrDiscountedPrice;

    if (!basePrice || basePrice <= 0) {
      setErrorMessage("Unable to validate price - no original price found");
      setTimeout(() => setErrorMessage(""), 3000);
      return false;
    }

    if (!pos_discount_allowed && inputPriceNum !== basePrice) {
      setErrorMessage("Price changes not allowed for this item");
      setTimeout(() => setErrorMessage(""), 3000);
      return false;
    }

    if (pos_discount_allowed && inputPriceNum < basePrice) {
      const discountPercent = ((effectiveBase - inputPriceNum) / effectiveBase) * 100;

      if (discountPercent > maxDiscountPercent) {
        const minAllowedPrice = (
          effectiveBase *
          (1 - maxDiscountPercent / 100)
        ).toFixed(2);

        setErrorMessage(
          `Minimum allowed price is ${currencySymbol}${minAllowedPrice} (based on original ${currencySymbol}${basePrice.toFixed(
            2
          )}${taxOrDiscountedPrice
            ? ` & Tax ${currencySymbol}${taxOrDiscountedPrice.toFixed(2)}`
            : ""
          })`
        );

        setTimeout(() => setErrorMessage(""), 3000);
        return false;
      }
    }

    return true;
  };

  const processQuantityUpdate = async (rawQty) => {
    try {
      // Calculate rounded quantity based on step
      const steps = Math.round(rawQty / qtyIncrementStep);
      const rounded = steps * qtyIncrementStep;
      const finalQuantity = Number(rounded.toFixed(2));

      if (finalQuantity < qtyIncrementStep) {
        // Remove item if quantity is less than step (or 0)
        const { removeFromCart } = await import("@/lib/indexedDB");
        await removeFromCart(cartItem.uid);
        if (onDeleteCartItem) {
          onDeleteCartItem(cartItem);
        }
      } else {
        // Update quantity
        setLocalQty(finalQuantity);
        const { updateCartItemQuantity } = await import("@/lib/indexedDB");
        await updateCartItemQuantity(cartItem.uid, finalQuantity);
        if (onUpdateCartItem) {
          onUpdateCartItem();
        }
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      // Revert to original on error
      setLocalQty(cartItem.quantity);
    }
  };

  const handleQuantityButton = (delta) => {
    const currentQty = parseFloat(localQty) || 0;
    processQuantityUpdate(currentQty + delta);
  };

  const handleManualQuantityBlur = () => {
    const val = parseFloat(localQty);
    if (!isNaN(val)) {
      processQuantityUpdate(val);
    } else {
      setLocalQty(cartItem.quantity);
    }
  };

  const handlePriceChange = async (newPrice) => {
    try {
      if (!isNaN(newPrice) && newPrice >= 0) {
        // Run validation
        if (!validatePriceChange(newPrice)) {
          // If validation fails, reset to current price
          setLocalPrice(cartItem.product.discounted_price || cartItem.product.price);
          return;
        }

        // Clear any previous error message
        setErrorMessage("");

        setLocalPrice(newPrice);
        const updatedItem = {
          ...cartItem,
          product: {
            ...cartItem.product,
            discounted_price: newPrice
          }
        };
        const { updateWholeProduct } = await import("@/lib/indexedDB");
        await updateWholeProduct(cartItem.uid, updatedItem);
        if (onUpdateCartItem) {
          onUpdateCartItem();
        }
      }
    } catch (error) {
      console.error("Error updating price:", error);
      // Revert on error
      setLocalPrice(cartItem.product.discounted_price || cartItem.product.price);
    }
  };

  return (
    <div className={styles.variantItem} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      marginBottom: '8px',
      position: 'relative'
    }}>
      {/* Error Message Display */}
      {errorMessage && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '0',
          right: '0',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          textAlign: 'center',
          zIndex: 10
        }}>
          {errorMessage}
        </div>
      )}

      <div className={styles.variantInfo} style={{ flex: 2 }}>
        <span className={styles.variantName}>{variantName}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityButton(-qtyIncrementStep);
          }}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: '1px solid #D8DCE2',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            color: "#000"
          }}
        >
          -
        </button>
        <input
          type="text"
          value={localQty}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*\.?\d*$/.test(val)) {
              setLocalQty(val);
            }
          }}
          onBlur={handleManualQuantityBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.target.blur();
            }
          }}
          style={{
            width: '50px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #D8DCE2',
            borderRadius: '4px',
            padding: '4px'
          }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityButton(qtyIncrementStep);
          }}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: '1px solid #D8DCE2',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            color: "#000"
          }}
        >
          +
        </button>
      </div>

      {adminAcl?.sales_discount && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '12px' }}>{currencySymbol}</span>
          <input
            type="text"
            value={localPrice}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val)) {
                setLocalPrice(val);
              }
            }}
            disabled={isPriceDisabled()}
            onBlur={(e) => {
              const newPrice = parseFloat(e.target.value);
              handlePriceChange(newPrice);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newPrice = parseFloat(e.target.value);
                handlePriceChange(newPrice);
                e.target.blur();
              }
            }}
            // style={{
            //   width: '70px',
            //   textAlign: 'center',
            //   border: errorMessage ? '1px solid #ff4444' : '1px solid #D8DCE2',
            //   borderRadius: '4px',
            //   padding: '4px',
            //   fontSize: '14px',
            //   backgroundColor: isPriceDisabled() ? '#f5f5f5' : ''
            // }}
            className={`${styles.priceInput} ${errorMessage ? styles.priceInputError : ''} ${isPriceDisabled() ? styles.priceInputDisabled : ''}`}
          />
        </div>
      )}

      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation();
          try {
            const { deleteFromCart } = await import("@/lib/indexedDB");
            await deleteFromCart(cartItem.uid);
            if (onDeleteCartItem) {
              onDeleteCartItem(cartItem);
            }
          } catch (error) {
            console.error("Error deleting item:", error);
          }
        }}
        style={{
          border: 'none',
          background: 'none',
          color: '#ff4d4f',
          cursor: 'pointer',
          padding: '5px'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
};

