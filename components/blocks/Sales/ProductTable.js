"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  updateWholeProduct,
  getCartItems,
  deleteFromCart,
} from "@/lib/indexedDB";

export default function ProductTable({
  cartItems,
  onCartChange,
  styles,
  currencySymbol,
  serverLanguage,
}) {
  const [inputs, setInputs] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [errorMessages, setErrorMessages] = useState([]);
  const originalPricesRef = useRef([]); // Store original prices for each item

  // Helper function to get product attribute
  const getAttribute = (item, code) => {
    return (
      item?.product?.custom_attributes?.find(
        (attr) => attr.attribute_code === code
      )?.attribute_value || null
    );
  };

  useEffect(() => {
    if (cartItems?.length) {
      const initialInputs = cartItems.map((item, index) => {
        const qtyStepAttr = getAttribute(item, "qty_increment_step");
        const initialQty = qtyStepAttr ? parseFloat(qtyStepAttr) : 1;
        
        const currentPrice = 
          item?.product?.price?.regularPrice?.amount?.value ||
          item?.product?.price_range?.minimum_price?.regular_price?.value ||
          0;

        // Only set original price if it hasn't been set for this index
        if (!originalPricesRef.current[index]) {
          originalPricesRef.current[index] = currentPrice;
        }

        return {
          price: currentPrice,
          quantity: item.quantity || initialQty,
          qtyIncrementStep: initialQty,
        };
      });
      setInputs(initialInputs);
      setErrorMessages(Array(cartItems.length).fill(""));
    }
  }, [cartItems]);

  const handleInputChange = (index, field, value) => {
    // Ensure we only accept numeric inputs with optional decimal point
    if (field === "price" && !/^\d*\.?\d*$/.test(value)) return;
    if (field === "quantity" && !/^\d*\.?\d*$/.test(value)) return;

    const updated = [...inputs];
    updated[index][field] = value;
    setInputs(updated);

    // Clear error message when input changes
    const updatedErrors = [...errorMessages];
    updatedErrors[index] = "";
    setErrorMessages(updatedErrors);
  };

  const handleEnter = (e, index) => {
    if (e.key === "Enter") {
      triggerUpdate(index);
    }
  };

  const validateDiscount = (index) => {
    const currentItem = cartItems[index];
    
    // Use the preserved original price from ref
    const originalPrice = originalPricesRef.current[index];
    const inputPrice = parseFloat(inputs[index].price);
    const pos_discount_allowed =
      currentItem?.product?.is_pos_discount_allowed == 1;
    const maxDiscountPercent = currentItem?.product?.pos_discount_percent || 0;

    // Check if we have a valid original price
    if (!originalPrice || originalPrice <= 0) {
      const updatedErrors = [...errorMessages];
      updatedErrors[index] = "Unable to validate price - no original price found";
      setErrorMessages(updatedErrors);
      return false;
    }

    if (!pos_discount_allowed && inputPrice !== originalPrice) {
      const updatedErrors = [...errorMessages];
      updatedErrors[index] = "Price changes not allowed for this item";
      setErrorMessages(updatedErrors);
      return false;
    }

    if (pos_discount_allowed && inputPrice < originalPrice) {
      const discountPercent =
        ((originalPrice - inputPrice) / originalPrice) * 100;
      
      if (discountPercent > maxDiscountPercent) {
        const minAllowedPrice = (
          originalPrice *
          (1 - maxDiscountPercent / 100)
        ).toFixed(2);
        const updatedErrors = [...errorMessages];
        updatedErrors[
          index
        ] = `Maximum discount ${maxDiscountPercent}% allowed (min price: ${currencySymbol}${minAllowedPrice} based on original ${currencySymbol}${originalPrice.toFixed(2)})`;
        setErrorMessages(updatedErrors);
        return false;
      }
    }

    return true;
  };

  const triggerUpdate = async (index) => {
    // Validate discount before updating
    if (!validateDiscount(index)) {
      return;
    }

    const qtyStep = inputs[index].qtyIncrementStep || 1;
    const roundedQuantity =
      Math.round(inputs[index].quantity / qtyStep) * qtyStep;
    const finalQuantity = Math.max(roundedQuantity, qtyStep);

    const updatedItem = {
      ...cartItems[index],
      quantity: finalQuantity,
      product: {
        ...cartItems[index].product,
        price: {
          regularPrice: {
            amount: {
              value: parseFloat(inputs[index].price) || 0,
              currency: "USD",
            },
          },
        },
      },
    };

    await updateWholeProduct(
      updatedItem?.product?.uid,
      updatedItem?.addedAt,
      updatedItem
    );

    const refreshedCart = await getCartItems();
    onCartChange(refreshedCart);

    setHighlightedIndex(index);
    setTimeout(() => setHighlightedIndex(null), 1000);
  };

  const isPriceDisabled = (item) => {
    return item?.product?.is_pos_discount_allowed !== 1;
  };

  // Calculate display values for each item
  const getDisplayValues = (item) => {
    const priceShortDetail = getAttribute(item, "price_short_detail");
    const quantityUnit = getAttribute(item, "quantity_unit") || "kg";

    if (!priceShortDetail) return null;

    const totalWeight = (
      inputs[cartItems.indexOf(item)]?.quantity * priceShortDetail
    ).toFixed(2);
    return {
      weightDisplay: `${totalWeight} ${quantityUnit} (est.)`,
      weightPerUnitDisplay: `About ${priceShortDetail} ${quantityUnit} per unit (est.)`,
    };
  };

  return (
    <div className={styles.productTable}>
      <table>
        <thead>
          <tr>
            <th>{serverLanguage?.id ?? "#"}</th>
            <th>{serverLanguage?.Product ?? "Item #"}</th>
            <th>{serverLanguage?.Products ?? "Item Name"}</th>
            <th>{serverLanguage?.Price ?? "Price"}</th>
            <th>{serverLanguage?.quantity ?? "QTY"}</th>
            <th>{serverLanguage?.Total ?? "Total"}</th>
            <th>{serverLanguage?.Actions ?? "Actions"}</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {cartItems?.map((item, index) => {
            const price = inputs[index]?.price ?? "";
            const quantity = inputs[index]?.quantity ?? "";
            const isDisabled = isPriceDisabled(item);
            const displayValues = getDisplayValues(item);
            
            // Get original price from ref for display purposes
            const originalPrice = originalPricesRef.current[index] || 0;
            const specialPrice = item?.product?.special_price;
            const showDiscount = specialPrice && specialPrice < originalPrice;

            return (
              <tr
                key={index}
                className={highlightedIndex === index ? styles.highlight : ""}
              >
                <td>{index + 1}</td>
                <td>{item?.product?.sku || "N/A"}</td>
                <td>{item?.product?.name || "Unnamed"}</td>
                <td>
                  {currencySymbol}
                  <input
                    type="text"
                    value={price}
                    className={`${styles.qtyInput} ${
                      isDisabled ? styles.disabled : ""
                    }`}
                    onChange={(e) =>
                      handleInputChange(index, "price", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index)}
                    disabled={isDisabled}
                  />
                  {errorMessages[index] && (
                    <div className={styles.errorMessage}>
                      {errorMessages[index]}
                    </div>
                  )}
                  {showDiscount && (
                    <div className={styles.discountBadge}>
                      {Math.round(100 - (specialPrice / originalPrice) * 100)}%
                      OFF
                    </div>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={quantity}
                    className={styles.qtyInput}
                    onChange={(e) =>
                      handleInputChange(index, "quantity", e.target.value)
                    }
                    onKeyDown={(e) => handleEnter(e, index)}
                  />
                  <div className={styles.qtyStepNote}>
                    (Step: {inputs[index]?.qtyIncrementStep || 1})
                  </div>
                </td>
                <td>
                  {showDiscount ? (
                    <>
                      <del className={styles.originalTotal}>
                        {currencySymbol}
                        {(originalPrice * quantity).toFixed(2)}
                      </del>
                      <span className={styles.specialTotal}>
                        {currencySymbol}
                        {(specialPrice * quantity).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span>
                      {currencySymbol}
                      {(parseFloat(price || 0) * quantity).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className={styles.flex_td}>
                  <button
                    className={styles.updateBtn}
                    onClick={() => triggerUpdate(index)}
                  >
                    🔁
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={async () => {
                      await deleteFromCart(item?.product?.uid);
                      // Clear the original price for this item when deleted
                      originalPricesRef.current.splice(index, 1);
                      const updatedCart = await getCartItems();
                      onCartChange(updatedCart);
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.deleteIcon}
                    >
                      <path
                        d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M4 7H20M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </td>
                <td>
                  {displayValues && (
                    <div className={styles.weightDetails}>
                      <div>{displayValues.weightDisplay}</div>
                      <div>{displayValues.weightPerUnitDisplay}</div>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}