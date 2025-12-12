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
  discountIncludingTax,
  payment,
  fbrDetails,
}) {
  const loginDetail = JSON.parse(localStorage.getItem("loginDetail"));
  const adminAcl = loginDetail?.admin_acl;
  const [inputs, setInputs] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [errorMessages, setErrorMessages] = useState([]);
  const originalPricesRef = useRef([]); // Store original prices for each item
  const discountedPricesRef = useRef([]); // Store discounted (tax) prices per item

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

      // get unit attribute
      const unit = getAttribute(item, "price_unit");

      // Base price
      const specialPrice = item?.product?.special_price || 0;
      const regularPrice =
        item?.product?.price?.regularPrice?.amount?.value ||
        item?.product?.price_range?.minimum_price?.regular_price?.value ||
        0;

      const basePrice = specialPrice > 0 ? specialPrice : regularPrice;

      if (!originalPricesRef.current[index]) {
        originalPricesRef.current[index] = basePrice;

        if (discountIncludingTax != null && discountIncludingTax != undefined) {
          if (discountIncludingTax == 1) {
            if (payment == "cashondelivery") {
              discountedPricesRef.current[index] =
                (basePrice * fbrDetails?.fbr_offline_tax) / 100;
            }
            if (payment == "credit") {
              discountedPricesRef.current[index] =
                (basePrice * fbrDetails?.fbr_online_tax) / 100;
            }
          }
        } else {
          discountedPricesRef.current[index] =
            (basePrice * item?.product?.tax_percent) / 100;
        }
      }

      return {
        price: item?.product?.discounted_price || basePrice,
        quantity: item.quantity || initialQty,
        qtyIncrementStep: initialQty,
        unit: unit || "", // 👈 ADD UNIT HERE
      };
    });

    setInputs(initialInputs);
    setErrorMessages(Array(cartItems.length).fill(""));
  }
}, [cartItems, discountIncludingTax, payment]);



  const handleInputChange = (index, field, value) => {
    if (field === "price" && !/^\d*\.?\d*$/.test(value)) return;
    if (field === "quantity" && !/^\d*\.?\d*$/.test(value)) return;

    const updated = [...inputs];
    updated[index][field] = value;
    setInputs(updated);

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
  const basePrice = originalPricesRef.current[index] || 0;
  const inputPrice = parseFloat(inputs[index].price);
  const pos_discount_allowed =
    currentItem?.product?.is_pos_discount_allowed == 1;
  const maxDiscountPercent = currentItem?.product?.pos_discount_percent || 0;
  const taxOrDiscountedPrice = discountedPricesRef.current[index] || 0;
  const effectiveBase = basePrice + taxOrDiscountedPrice;

  const updatedErrors = [...errorMessages];

  if (!basePrice || basePrice <= 0) {
    updatedErrors[index] = "Unable to validate price - no original price found";
    setErrorMessages(updatedErrors);
    setTimeout(() => {
      setErrorMessages((prev) => {
        const newErrors = [...prev];
        newErrors[index] = "";
        return newErrors;
      });
    }, 3000);
    return false;
  }

  if (!pos_discount_allowed && inputPrice !== basePrice) {
    updatedErrors[index] = "Price changes not allowed for this item";
    setErrorMessages(updatedErrors);
    setTimeout(() => {
      setErrorMessages((prev) => {
        const newErrors = [...prev];
        newErrors[index] = "";
        return newErrors;
      });
    }, 3000);
    return false;
  }

  if (pos_discount_allowed && inputPrice < basePrice) {
    const discountPercent =
      ((effectiveBase - inputPrice) / effectiveBase) * 100;

    if (discountPercent > maxDiscountPercent) {
      const minAllowedPrice = (
        effectiveBase *
        (1 - maxDiscountPercent / 100)
      ).toFixed(2);

      updatedErrors[
        index
      ] = `Minimum allowed price is ${currencySymbol}${minAllowedPrice} (based on original ${currencySymbol}${basePrice.toFixed(
        2
      )}${
        taxOrDiscountedPrice
          ? ` & Tax ${currencySymbol}${taxOrDiscountedPrice.toFixed(2)}`
          : ""
      })`;

      setErrorMessages(updatedErrors);
      // ⏱️ Auto-clear message after 5 seconds
      setTimeout(() => {
        setErrorMessages((prev) => {
          const newErrors = [...prev];
          newErrors[index] = "";
          return newErrors;
        });
      }, 3000);

      return false;
    }
  }

  return true;
};


const triggerUpdate = async (index) => {
  if (!validateDiscount(index)) {
    return;
  }

  const qtyStep = inputs[index].qtyIncrementStep || 1;

  // 1️⃣ safe float
  const rawQty = parseFloat(inputs[index].quantity) || 0;

  // 2️⃣ round by step
  const steps = Math.round(rawQty / qtyStep);
  const rounded = steps * qtyStep;

  // 3️⃣ always 2 decimals
  const finalQuantity = Number(rounded.toFixed(2));

  // 4️⃣ also fix price to 2 decimals
  const fixedPrice = Number(parseFloat(inputs[index].price || 0).toFixed(2));

  const updatedItem = {
    ...cartItems[index],
    quantity: finalQuantity,
    product: {
      ...cartItems[index].product,
      discounted_price: fixedPrice,
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
            const unit = inputs[index]?.unit ?? ""

            const originalPrice = originalPricesRef.current[index] || 0;
            const currentItemDiscountedPrice = item?.product?.discounted_price;
            const specialPrice = item?.product?.special_price;

            // Use discounted_price if it exists and differs from original, otherwise use specialPrice
            const effectivePrice =
              currentItemDiscountedPrice || specialPrice || originalPrice;
            const showDiscount = effectivePrice < originalPrice;

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
                  {adminAcl?.sales_discount ? <input
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
                  /> : price}
                  {errorMessages[index] && (
                    <div className={styles.errorMessage}>
                      {errorMessages[index]}
                    </div>
                  )}
                  {showDiscount && (
                    <div className={styles.discountBadge}>
                      {Math.round(100 - (effectivePrice / originalPrice) * 100)}
                      % OFF
                    </div>
                  )} {unit != "" ? ` / ${unit}` : ''}
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
                        {(effectivePrice * quantity).toFixed(2)}
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
               {adminAcl?.sales_discount && <button
                    className={styles.updateBtn}
                    onClick={() => triggerUpdate(index)}
                  >
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.59375 8.09375C2.59375 9.28044 2.94564 10.4405 3.60493 11.4272C4.26422 12.4139 5.20129 13.1829 6.29765 13.637C7.39401 14.0912 8.60041 14.21 9.76429 13.9785C10.9282 13.747 11.9973 13.1755 12.8364 12.3364C13.6755 11.4973 14.247 10.4282 14.4785 9.26429C14.71 8.10041 14.5912 6.89401 14.137 5.79765C13.6829 4.70129 12.9139 3.76422 11.9272 3.10493C10.9405 2.44564 9.78044 2.09375 8.59375 2.09375C6.91638 2.10006 5.3064 2.75457 4.10042 3.92042L2.59375 5.42708" stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2.59375 2.09375V5.42708H5.92708" stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                  </button> }
                  <button
                    className={styles.deleteBtn}
                    onClick={async () => {
                      await deleteFromCart(item?.product?.uid);
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
