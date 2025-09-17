import React, { useState, useEffect } from "react";
import styles from "./modal.module.scss";

export default function ProductOptionsModal({ item, isOpen, onClose, onConfirm }) {
  const [selectedConfigurable, setSelectedConfigurable] = useState({});
  const [selectedCustomizable, setSelectedCustomizable] = useState({});
  const [childSku, setChildSku] = useState(null);

  useEffect(() => {
    if (item?.__typename === "ConfigurableProduct" && item?.variants) {
      findMatchingVariant();
    }
  }, [selectedConfigurable, item]);

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
        if (updated[optionId].includes(value)) {
          updated[optionId] = updated[optionId].filter(v => v !== value);
        } else {
          updated[optionId].push(value);
        }
      } else {
        updated[optionId] = value;
      }

      return updated;
    });
  };

  const isConfigurableComplete = () =>
    Object.keys(selectedConfigurable).length === (item.configurable_options?.length || 0);

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

    // Format options as { "attribute_id": value_index } for configurable products
    // and { "option_id": value } for custom options
    const options = {
      ...selectedConfigurable,
      ...Object.entries(selectedCustomizable).reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value.join(',') : value;
        return acc;
      }, {})
    };

    // Pass both the parent item and child SKU to onConfirm
    onConfirm({
      product: item,
      childSku: childSku || item.sku, // Fallback to parent SKU if no child SKU
      options
    });

    onClose();
    setSelectedConfigurable({});
    setSelectedCustomizable({});
    setChildSku(null);
  };

  if (!isOpen) return null;

  const isDisabled = (item.__typename === "ConfigurableProduct" && !isConfigurableComplete()) || 
                    !isCustomizableComplete();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalTitle}>Select Options</div>
        {childSku && (
          <div className={styles.selectedVariant}>
            Selected Variant: {childSku}
          </div>
        )}

        {/* Configurable Options */}
        {item?.configurable_options?.map((option) => (
          <div key={option.attribute_code} className={styles.option}>
            <div className={styles.optionLabel}>{option.label}</div>
            <select
              className={styles.optionSelect}
              onChange={(e) => handleOptionChange(e.target.value, option.attribute_code)}
              value={selectedConfigurable[option.attribute_id]?.uid || ""}
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

        {/* Customizable Options */}
        {item?.options?.map((opt) => (
          <div key={opt.option_id} className={styles.option}>
            <div className={styles.optionLabel}>
              {opt.title} {opt.required && "*"}
            </div>

            {/* Radio Options */}
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
                {val.title}
              </label>
            ))}

            {/* Checkbox Options */}
            {opt.checkbox_option?.map((val) => (
              <label key={val.option_type_id} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={val.option_type_id}
                  checked={(selectedCustomizable[opt.option_id] || []).includes(val.option_type_id)}
                  onChange={() => 
                    handleCustomizableChange(opt.option_id, val.option_type_id, "checkbox")
                  }
                />
                {val.title}
              </label>
            ))}

            {/* Text Input */}
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
            Add to Cart
          </button>
          <button onClick={onClose} className={styles.closeButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}