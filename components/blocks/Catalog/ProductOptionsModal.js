import React, { useState, useEffect } from "react";
import styles from "./productOptionsModal.module.scss";

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
      return selectedVariant.special_price ||
        selectedVariant.price?.regularPrice?.amount?.value ||
        selectedVariant.price_range?.minimum_price?.regular_price?.value ||
        item.special_price ||
        item.price?.regularPrice?.amount?.value ||
        item.price_range?.minimum_price?.regular_price?.value;
    }

    return item.special_price ||
      item.price?.regularPrice?.amount?.value
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

    setSelectedConfigurable(prev => {
      const currentValue = prev[optionGroup.attribute_id];

      if (currentValue === selectedValue.value_index) {
        const newState = { ...prev };
        delete newState[optionGroup.attribute_id];
        return newState;
      } else {
        return {
          ...prev,
          [optionGroup.attribute_id]: selectedValue.value_index
        };
      }
    });
  };

  const handleCustomizableChange = (optionId, value, type = "text") => {
    setSelectedCustomizable(prev => {
      const updated = { ...prev };

      if (type === "checkbox") {
        const currentArray = updated[optionId] || [];
        const valueIndex = currentArray.indexOf(value);

        if (valueIndex > -1) {
          // Remove the value by creating a new array
          const newArray = currentArray.filter(v => v !== value);
          if (newArray.length === 0) {
            delete updated[optionId];
          } else {
            updated[optionId] = newArray;
          }
        } else {
          // Add the value by creating a new array
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
  const handleConfirm = () => {
    if (!isCustomizableComplete()) return;
    if (item.__typename === "ConfigurableProduct" && !isConfigurableComplete()) return;

    const finalPrice = getCurrentPrice();

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
      qty: 1,
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
      }
    };

    onConfirm({
      product: productWithCorrectPrice,
      childSku: variantSku,
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
            <label style={{ fontSize: '16px', color: '#333' }}>{productName}</label>
          </div>

          <div className={styles.formGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Base Price:</span>
              <span>${basePrice}</span>
            </div>
            {optionsPrice > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Options:</span>
                <span>+${optionsPrice}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <span>Total:</span>
              <span>${totalPrice}</span>
            </div>
          </div>

          {childSku && (
            <div className={styles.formGroup}>
              <label>Selected Variant: {childSku}</label>
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
                  placeholder={`Enter ${opt.title}`}
                />
              )}
            </div>
          ))}

          <div className={styles.formFooter}>
            <button onClick={onClose} className={styles.btnSecondary}>
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={styles.btnPrimary}
              disabled={isDisabled}
            >
              Add to Cart - ${totalPrice}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}