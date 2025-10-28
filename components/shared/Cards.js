import React, { useState, useEffect, useRef } from "react";
import style from "../../styles/card.module.scss";
import Image from "next/image";
import {
  getCartItems,
  removeFromCart,
  updateCartItemQuantity,
  updateWholeProduct,
} from "@/lib/indexedDB";
import UpdateProductModal from "../blocks/Catalog/UpdateProductModal";
import { usePathname } from "next/navigation";

export default function Cards({
  item,
  cards,
  record,
  setCartItems,
  currencySymbol,
  serverLanguage,
  discountIncludingTax,
  payment,
  fbrDetails
}) {
  const pathname = usePathname();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const originalPriceRef = useRef(null);
  const discountedPriceRef = useRef(null);
  const [originalPrice, setOriginalPrice] = useState(null);

  const getAttribute = (code) => {
    return (
      item?.custom_attributes?.find((attr) => attr.attribute_code === code)
        ?.attribute_value || null
    );
  };

  const qtyIncrementStep = parseFloat(getAttribute("qty_increment_step")) || 1;
  const quantityUnit = getAttribute("quantity_unit") || "kg";
  const priceUnit = getAttribute("price_unit") || "each";
  const priceShortDetail = getAttribute("price_short_detail");
  const weightPerUnit =
    parseFloat(getAttribute("weight_per_price_unit")) || 0.2;

  useEffect(() => {
    if (item) {
      const specialPrice = item?.special_price || 0;
      const regularPrice =
        item?.price?.regularPrice?.amount?.value ||
        item?.price_range?.minimum_price?.regular_price?.value ||
        0;

      const basePrice = specialPrice > 0 ? specialPrice : regularPrice;

      setPriceInput(item?.discounted_price || basePrice);

      if (originalPriceRef.current === null) {
        originalPriceRef.current = basePrice;
        setOriginalPrice(basePrice);
        if(discountIncludingTax != null || discountIncludingTax != undefined){
        if (discountIncludingTax == 1) {
          if (payment == "checkmo") {
            discountedPriceRef.current = (basePrice * fbrDetails?.fbr_offline_discount) / 100;
          }
          if (payment == "credit") {
            discountedPriceRef.current = (basePrice * fbrDetails?.fbr_online_discount) / 100;
          }
        } else{
        } if(discountIncludingTax == null || discountIncludingTax == undefined){
           discountedPriceRef.current = (basePrice * item?.tax_percent) / 100;
        }
      }
      }

      setQuantity(record?.quantity ?? qtyIncrementStep);
    }
  }, [item, record, discountIncludingTax, payment]);

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    setPriceInput(value);
    setErrorMessage("");
  };

  const handleQuantityChange = async (productUid, addedAt, newQuantity) => {
    const roundedQuantity =
      Math.round(newQuantity / qtyIncrementStep) * qtyIncrementStep;
    setQuantity(roundedQuantity);

    if (roundedQuantity < qtyIncrementStep) {
      await removeFromCart(productUid);
    } else {
      await updateCartItemQuantity(productUid, addedAt, roundedQuantity);
    }

    const updatedCart = await getCartItems();
    setCartItems(updatedCart);
  };

const validateDiscount = () => {
  const basePrice = originalPriceRef.current || 0;
  const inputPrice = parseFloat(priceInput);
  const pos_discount_allowed = item?.is_pos_discount_allowed == 1;
  const maxDiscountPercent = item?.pos_discount_percent || 0;
  const taxOrDiscountedPrice = discountedPriceRef.current || 0;
  const effectiveBase = basePrice + taxOrDiscountedPrice;

  if (!basePrice || basePrice <= 0) {
    setErrorMessage("Unable to validate price - no original price found");
    setTimeout(() => setErrorMessage(""), 3000);
    return false;
  }

  if (!pos_discount_allowed && inputPrice !== basePrice) {
    setErrorMessage("Price changes not allowed for this item");
    setTimeout(() => setErrorMessage(""), 3000);
    return false;
  }

  if (pos_discount_allowed && inputPrice < basePrice) {
    const discountPercent = ((effectiveBase - inputPrice) / effectiveBase) * 100;

    if (discountPercent > maxDiscountPercent) {
      const minAllowedPrice = (
        effectiveBase *
        (1 - maxDiscountPercent / 100)
      ).toFixed(2);

      setErrorMessage(
        `Minimum allowed price is ${currencySymbol}${minAllowedPrice} (based on original ${currencySymbol}${basePrice.toFixed(
          2
        )}${
          taxOrDiscountedPrice
            ? ` & Tax ${currencySymbol}${taxOrDiscountedPrice.toFixed(2)}`
            : ""
        })`
      );

      // ❗ Automatically clear after 5 seconds
      setTimeout(() => setErrorMessage(""), 3000);

      return false;
    }
  }

  return true;
};


  const handleUpdatePrice = async () => {
    if (!validateDiscount()) return;

    const updatedItem = {
      ...record,
      quantity,
      product: {
        ...item,
        discounted_price: parseFloat(priceInput),
      },
    };

    await updateWholeProduct(item?.uid, record?.addedAt, updatedItem);
    const updatedCart = await getCartItems();
    setCartItems(updatedCart);

    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 1000);
  };
  const isPriceDisabled = () => item?.is_pos_discount_allowed !== 1;

  const totalWeight = (quantity * weightPerUnit).toFixed(2);
  const weightDisplay = `${totalWeight} ${quantityUnit} (est.)`;
  const pricePerUnitDisplay = `${currencySymbol}${originalPrice?.toFixed(
    2
  )} / ${quantityUnit}`;
  const weightPerUnitDisplay = `About ${weightPerUnit} ${quantityUnit} / ${priceUnit} (est.)`;

  const discounted = parseFloat(item?.discounted_price || 0);
  const effectivePrice = discounted > 0 ? discounted : originalPrice;

  const showDiscount = discounted > 0 && discounted < originalPrice;

  return (
    <div className={`${style.card} ${isHighlighted ? style.highlight : ""}`}>
      
        {showDiscount && (
          <div className={style.discount_sec}>
          <span className={style.discount}>
            {Math.round(100 - (effectivePrice / originalPrice) * 100)}%
          </span>
          </div>
        )}
        {pathname !== "/sale" && (
          <div className={style.top_row}>
          <span
            className={style.svg}
            onClick={() => setIsUpdateModalOpen(true)}
            role="button"
            aria-label="Edit Product"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="15"
              viewBox="0 0 24 24"
              width="15"
              fill="#657196"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path
                d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zM20.71 
                7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 
                0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
              />
            </svg>
          </span>
            </div>
        )}
    

      <div className={style.image_container}>
        <Image
          src={item?.image?.url || "/placeholder-product.png"}
          alt={item?.name || "Product Image"}
          width={270}
          height={180}
          style={{ width: "auto", height: "auto" }}
          priority
        />
      </div>

      <div className={style.product_info}>
        <h3 className={style.name}>{item?.name}</h3>
        {priceShortDetail && (
          <>
            <div className={style.price_unit_display}>{pricePerUnitDisplay}</div>
            <div className={style.weight_per_unit}>{weightPerUnitDisplay}</div>
          </>
        )}
      </div>

     <div className={style.price_info}>
  <div className={style.price}>
    {showDiscount ? (
      <>
        <del className={style.final_price}>
          {currencySymbol}
          {originalPrice.toFixed(2)}
        </del>
        <span className={style.special_price}>
          {currencySymbol}
          {effectivePrice.toFixed(2)}
        </span>
      </>
    ) : (
      <span className={style.special_price}>
        {currencySymbol}
        {originalPrice?.toFixed(2)}
      </span>
    )}
  </div>

  {cards && (
    <div className={style.link}>
      <div className={style.itemControls}>
        <div className={style.quantityControls}>
          <button
            className={style.NegQuantityButton}
            onClick={() =>
              handleQuantityChange(
                item?.uid,
                record?.addedAt,
                quantity - qtyIncrementStep
              )
            }
          >
            -
          </button>
          <input
            type="text"
            className={style.quantityInput}
            value={quantity}
            onChange={(e) =>
              handleQuantityChange(
                item?.uid,
                record?.addedAt,
                parseFloat(e.target.value) || qtyIncrementStep
              )
            }
          />
          <button
            className={style.quantityButton}
            onClick={() =>
              handleQuantityChange(
                item?.uid,
                record?.addedAt,
                quantity + qtyIncrementStep
              )
            }
          >
            +
          </button>
        </div>
      </div>
    </div>
  )}
</div>


      {record && (
        <div className={style.priceInputContainer}>
          {/* <label className={style.priceLabel}>
            {serverLanguage?.DiscountedPrice ?? "Discounted Price"}:
          </label> */}
          <p className={style.currency}>{currencySymbol}</p>
          <input
            type="text"
            className={`${style.priceInput} ${
              isPriceDisabled() ? style.disabled : ""
            }`}
            value={priceInput}
            onChange={handlePriceChange}
            onKeyDown={(e) => e.key === "Enter" && handleUpdatePrice()}
            disabled={isPriceDisabled()}
          />
          <button
            className={style.updatePriceBtn}
            onClick={handleUpdatePrice}
            disabled={isPriceDisabled()}
          >
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.59375 8.09375C2.59375 9.28044 2.94564 10.4405 3.60493 11.4272C4.26422 12.4139 5.20129 13.1829 6.29765 13.637C7.39401 14.0912 8.60041 14.21 9.76429 13.9785C10.9282 13.747 11.9973 13.1755 12.8364 12.3364C13.6755 11.4973 14.247 10.4282 14.4785 9.26429C14.71 8.10041 14.5912 6.89401 14.137 5.79765C13.6829 4.70129 12.9139 3.76422 11.9272 3.10493C10.9405 2.44564 9.78044 2.09375 8.59375 2.09375C6.91638 2.10006 5.3064 2.75457 4.10042 3.92042L2.59375 5.42708" stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M2.59375 2.09375V5.42708H5.92708" stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

          </button>
          {errorMessage && (
            <div className={style.errorMessage}>{errorMessage}</div>
          )}

          {/* ✅ Price Summary */}
          {/* <div className={style.summary}>
            <p>
              <strong>Original Price:</strong> {currencySymbol}
              {originalPriceRef?.current?.toFixed(2)}
            </p>
            {showDiscount && (
              <p>
                <strong>Discounted Price:</strong> {currencySymbol}
                {effectivePrice.toFixed(2)}
              </p>
            )}
            <p>
              <strong>Total:</strong> {currencySymbol}
              {(effectivePrice * quantity).toFixed(2)}
            </p>
          </div> */}
        </div>
      )}

      {isUpdateModalOpen && (
        <UpdateProductModal
          item={item}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}
    </div>
  );
}
