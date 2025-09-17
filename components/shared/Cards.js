import React, { useState, useEffect } from "react";
import style from "../../styles/card.module.scss";
import Image from "next/image";
import ProductOptionsModal from "../blocks/Catalog/ProductOptionsModal";
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
}) {
  const pathname = usePathname();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [priceInput, setPriceInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Extract qty_increment_step
  const getAttribute = (code) => {
    return (
      item?.custom_attributes?.find((attr) => attr.attribute_code === code)
        ?.attribute_value || null
    );
  };

  const qtyIncrementStep = parseFloat(getAttribute("qty_increment_step")) || 1;
  const priceUnit = getAttribute("price_unit") || "each";
  const quantityUnit = getAttribute("quantity_unit") || "kg";
  const weightPerUnit =
    parseFloat(getAttribute("weight_per_price_unit")) || 0.2;
  const priceShortDetail = getAttribute("price_short_detail");

  const [originalPrice, setOriginalPrice] = useState(null);
  const [quantity, setQuantity] = useState(qtyIncrementStep); // Initialize with qtyIncrementStep

  useEffect(() => {
    if (item) {
      const initialPrice =
        item?.price?.regularPrice?.amount?.value ||
        item?.price_range?.minimum_price?.regular_price?.value ||
        0;
      setPriceInput(initialPrice);
      setOriginalPrice(initialPrice);

      // Set quantity from record or fallback to qtyIncrementStep
      setQuantity(record?.quantity ?? qtyIncrementStep);
    }
  }, [item, record, qtyIncrementStep]);

  const totalWeight = (quantity * weightPerUnit).toFixed(2);
  const weightDisplay = `${totalWeight} ${quantityUnit} (est.)`;
  const pricePerUnitDisplay = `${currencySymbol}${(
    item?.price?.regularPrice?.amount?.value ||
    item?.price_range?.minimum_price?.regular_price?.value ||
    0
  ).toFixed(2)} / ${quantityUnit}`;
  const weightPerUnitDisplay = `About ${weightPerUnit} ${quantityUnit} / ${priceUnit} (est.)`;

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

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return;
    setPriceInput(value);
    setErrorMessage("");
  };

  const validateDiscount = () => {
    const originalPrice =
      item?.price?.regularPrice?.amount?.value ||
      item?.price_range?.minimum_price?.regular_price?.value ||
      0;
    const inputPrice = parseFloat(priceInput);
    const pos_discount_allowed = item?.is_pos_discount_allowed == 1;
    const maxDiscountPercent = item?.pos_discount_percent || 0;

    if (!pos_discount_allowed && inputPrice !== originalPrice) {
      setErrorMessage("Price changes not allowed for this item");
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
        setErrorMessage(
          `Minimum allowed price is ${currencySymbol}${minAllowedPrice}`
        );
        return false;
      }
    }

    return true;
  };

  const handleUpdatePrice = async () => {
    if (!validateDiscount()) {
      return;
    }

    const updatedItem = {
      ...record,
      quantity: quantity,
      product: {
        ...item,
        price: {
          regularPrice: {
            amount: {
              value: parseFloat(priceInput) || 0,
              currency: "USD",
            },
          },
        },
      },
    };

    await updateWholeProduct(item?.uid, record?.addedAt, updatedItem);

    const updatedCart = await getCartItems();
    setCartItems(updatedCart);

    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 1000);
  };

  const isPriceDisabled = () => item?.is_pos_discount_allowed !== 1;

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleUpdatePrice();
    }
  };

  return (
    <div className={`${style.card} ${isHighlighted ? style.highlight : ""}`}>
      <div className={style.top_row}>
        {item?.special_price && (
          <span className={style.discount}>
            {Math.round(
              100 -
                (item.special_price /
                  (item?.price?.regularPrice?.amount?.value ||
                    item?.price_range?.minimum_price?.regular_price?.value)) *
                  100
            )}
            %
          </span>
        )}
        {pathname !== "/sale" && (
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
        )}
      </div>

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
        <div className={style.price_unit_display}>{pricePerUnitDisplay}</div>
        {priceShortDetail && (
          <div className={style.weight_per_unit}>{weightPerUnitDisplay}</div>
        )}
      </div>

      <div className={style.price_info}>
        <div className={style.price}>
          {item?.special_price ? (
            <>
              <del className={style.final_price}>
                {currencySymbol}
                {(
                  (item?.price?.regularPrice?.amount?.value ||
                    item?.price_range?.minimum_price?.regular_price?.value) *
                  quantity
                ).toFixed(2)}
              </del>
              <span className={style.special_price}>
                {currencySymbol}
                {(item.special_price * quantity).toFixed(2)}
              </span>
            </>
          ) : (
            <span className={style.special_price}>
              {currencySymbol}
              {(
                (item?.price?.regularPrice?.amount?.value ||
                  item?.price_range?.minimum_price?.regular_price?.value) *
                quantity
              ).toFixed(2)}
            </span>
          )}
        </div>

        {cards && (
          <div className={style.link}>
            <div className={style.itemControls}>
              <div className={style.quantityControls}>
                <button
                  className={style.quantityButton}
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
          <label className={style.priceLabel}>
            {serverLanguage?.Price ?? "Price"}: {currencySymbol}
          </label>
          <input
            type="text"
            className={`${style.priceInput} ${
              isPriceDisabled() ? style.disabled : ""
            }`}
            value={priceInput}
            onChange={handlePriceChange}
            onKeyDown={handleKeyDown}
            disabled={isPriceDisabled()}
          />
          <button
            className={style.updatePriceBtn}
            onClick={handleUpdatePrice}
            disabled={isPriceDisabled()}
          >
            🔁
          </button>
          {errorMessage && (
            <div className={style.errorMessage}>{errorMessage}</div>
          )}
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
