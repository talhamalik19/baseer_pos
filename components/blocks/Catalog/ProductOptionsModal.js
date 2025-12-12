import React, { useState, useEffect } from "react";
import styles from "./modal.module.scss";

export default function ProductOptionsModal({ 
  item, 
  isOpen, 
  onClose, 
  onConfirm,
  allProducts
}) {
  const [selectedConfigurable, setSelectedConfigurable] = useState({});
  const [selectedCustomizable, setSelectedCustomizable] = useState({});
  const [childSku, setChildSku] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (item?.__typename === "ConfigurableProduct" && item?.variants) {
      findMatchingVariant();
    }
  }, [selectedConfigurable, item, allProducts]);

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

  const getProductName = () => {
    if (selectedVariant) {
      return `${item.name} - ${selectedVariant.name}`;
    }
    return item.name;
  };

  const getBasePrice = () => {
    if (selectedVariant) {
      return selectedVariant.price?.regularPrice?.amount?.value || 
             selectedVariant.price_range?.minimum_price?.regular_price?.value ||
             item.price?.regularPrice?.amount?.value ||
             item.price_range?.minimum_price?.regular_price?.value;
    }
    
    return item.price?.regularPrice?.amount?.value || 
           item.price_range?.minimum_price?.regular_price?.value;
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

  const handleOptionChange = (selectedUid, attributeCode) => {
    const optionGroup = item.configurable_options.find(
      (opt) => opt.attribute_code === attributeCode
    );
    const selectedValue = optionGroup?.values.find((val) => val.uid === selectedUid);

    if (!selectedValue) return;

    setSelectedConfigurable(prev => ({
      ...prev,
      [optionGroup.attribute_id]: selectedValue.value_index
    }));
  };

  const handleCustomizableChange = (optionId, value, type = "text") => {
    setSelectedCustomizable(prev => {
      const updated = { ...prev };
      
      if (type === "checkbox") {
        updated[optionId] = updated[optionId] || [];
        const valueIndex = updated[optionId].indexOf(value);
        
        if (valueIndex > -1) {
          // Remove if already selected
          updated[optionId].splice(valueIndex, 1);
        } else {
          // Add if not selected
          updated[optionId].push(value);
        }
      } else if (type === "radio") {
        // For radio buttons, set the value
        updated[optionId] = value;
      } else {
        // For text input
        updated[optionId] = value;
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
      return val !== undefined && val !== "";
    });
  };

  const handleConfirm = () => {
    if (!isCustomizableComplete()) return;
    if (item.__typename === "ConfigurableProduct" && !isConfigurableComplete()) return;

    const options = {
      ...selectedConfigurable,
      ...Object.entries(selectedCustomizable).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value.join(',') : value;
        return acc;
      }, {})
    };

    const finalPrice = getCurrentPrice();
    const productToAdd = selectedVariant || item;
    
    const productWithCorrectPrice = {
      ...productToAdd,
      name: getProductName(), // Add combined name
      price: {
        ...productToAdd.price,
        regularPrice: {
          ...productToAdd.price?.regularPrice,
          amount: {
            ...productToAdd.price?.regularPrice?.amount,
            value: finalPrice
          }
        }
      }
    };

    onConfirm({
      product: productWithCorrectPrice,
      childSku: childSku || item.sku,
      options,
      price: finalPrice
    });

    onClose();
    setSelectedConfigurable({});
    setSelectedCustomizable({});
    setChildSku(null);
    setSelectedVariant(null);
  };

  const renderOptionLabelWithPrice = (option) => {
    if (option.price && option.price > 0) {
      return `${option.title} (+$${option.price})`;
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

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalTitle}>Select Options</div>
        
        {/* Display product name */}
        <div className={styles.productName}>
          {productName}
        </div>
        
        <div className={styles.priceBreakdown}>
          <div className={styles.priceRow}>
            <span>Base Price:</span>
            <span>${basePrice}</span>
          </div>
          {optionsPrice > 0 && (
            <div className={styles.priceRow}>
              <span>Options:</span>
              <span>+${optionsPrice}</span>
            </div>
          )}
          <div className={styles.totalPrice}>
            <span>Total:</span>
            <span>${totalPrice}</span>
          </div>
        </div>
        
        {childSku && (
          <div className={styles.selectedVariant}>
            Selected Variant: {childSku}
          </div>
        )}

        {item?.configurable_options?.map((option) => (
          <div key={option.attribute_code} className={styles.option}>
            <div className={styles.optionLabel}>{option.label}</div>
            <select
              className={styles.optionSelect}
              onChange={(e) => handleOptionChange(e.target.value, option.attribute_code)}
              value={getSelectedOptionUid(option.attribute_id)}
            >
              <option value="">Select {option.label}</option>
              {option.values.map((value) => (
                <option key={value.uid} value={value.uid}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {item?.options?.map((opt) => (
          <div key={opt.option_id} className={styles.option}>
            <div className={styles.optionLabel}>
              {opt.title} {opt.required && "*"}
            </div>

            {opt.radio_option?.map((val) => (
              <label key={val.option_type_id} className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`option-${opt.option_id}`}
                  value={val.option_type_id}
                  checked={selectedCustomizable[opt.option_id] === val.option_type_id}
                  onChange={(e) => 
                    handleCustomizableChange(opt.option_id, e.target.value, "radio")
                  }
                />
                {renderOptionLabelWithPrice(val)}
              </label>
            ))}

            {opt.checkbox_option?.map((val) => (
              <label key={val.option_type_id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={val.option_type_id}
                  checked={(selectedCustomizable[opt.option_id] || []).includes(val.option_type_id)}
                  onChange={(e) => 
                    handleCustomizableChange(opt.option_id, val.option_type_id, "checkbox")
                  }
                />
                {renderOptionLabelWithPrice(val)}
              </label>
            ))}

            {!opt.radio_option && !opt.checkbox_option && (
              <input
                type="text"
                className={styles.textInput}
                value={selectedCustomizable[opt.option_id] || ""}
                onChange={(e) => 
                  handleCustomizableChange(opt.option_id, e.target.value, "text")
                }
                placeholder={`Enter ${opt.title}`}
              />
            )}
          </div>
        ))}

        <div className={styles.modal_cta}>
          <button
            onClick={handleConfirm}
            className={styles.confirmButton}
            disabled={isDisabled}
          >
            Add to Cart - ${totalPrice}
          </button>
          <button onClick={onClose} className={styles.closeButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}