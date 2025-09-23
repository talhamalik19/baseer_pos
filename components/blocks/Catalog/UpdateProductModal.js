"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/card.module.scss";
import { revalidateProducts, updateProductAction } from "@/lib/Magento/actions";
import { updateProductInDB } from "@/lib/indexedDB";

export default function UpdateProductModal({ item, onClose }) {
  const [originalData, setOriginalData] = useState({
     uid: item?.uid || "", 
    name: item?.name || "",
    sku: item?.sku || "",
    price: item?.price?.regularPrice?.amount?.value || "",
    special_price: item?.special_price || "",
    image: item?.image?.url || item?.image_url || "",
    inventory: item?.quantity || 0
  });

  const [formData, setFormData] = useState(originalData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pos_code, setPosCode] = useState("");

  // Initialize pos_code from localStorage
  useEffect(() => {
    const code = localStorage.getItem("pos_code") || "";
    setPosCode(code);
  }, []);

  // Update both original and form data when item changes
  useEffect(() => {
    const newOriginalData = {
      name: item?.name || "",
      sku: item?.sku || "",
      price: item?.price?.regularPrice?.amount?.value || "",
      special_price: item?.special_price || "",
      image: item?.image?.url || item?.image_url || "",
      inventory: item?.quantity || 0
    };
    setOriginalData(newOriginalData);
    setFormData(newOriginalData);
  }, [item]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

const getChangedFields = () => {
  const changedFields = {
    sku: formData.sku,
    pos_code: pos_code
  };
  
  Object.keys(formData).forEach(key => {
    if (key === 'sku') return;
    
    if (key === 'image') {
  if (formData[key] !== originalData[key]) {
    changedFields.images = [{
      name: "product-image.png",
      base64: formData[key] 
    }];
  }
}
 else if (formData[key] !== originalData[key]) {
      changedFields[key] = formData[key];
    }
  });

  return changedFields;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  const changedData = getChangedFields();
  const res = await updateProductAction(changedData);
  // if (res && res.success) {
    const dbUpdate = {
      name: formData.name,
      sku: formData.sku,
      price: parseFloat(formData.price),
      special_price: formData.special_price 
        ? parseFloat(formData.special_price) 
        : null,
      quantity: parseInt(formData.inventory, 10),
      image: formData.image
    };
    await revalidateProducts()
    await updateProductInDB(originalData.uid, dbUpdate);
    onClose();
    window.location.reload(true);
  // } else {
  //   // Handle API error
  //   console.error("Update failed:", res?.message);
  // }
  
  setIsSubmitting(false);
};

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Update Product</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.required} htmlFor="name">
                Product Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={styles.formControl}
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.required} htmlFor="price">
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  className={styles.formControl}
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="special_price">Special Price</label>
                <input
                  type="number"
                  id="special_price"
                  name="special_price"
                  className={styles.formControl}
                  value={formData.special_price}
                  onChange={handleInputChange}
                  step="0.01"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="inventory">Inventory Quantity</label>
                <input
                  type="number"
                  id="inventory"
                  name="inventory"
                  className={styles.formControl}
                  value={formData.inventory}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="image">Product Image</label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.formControl}
              />
              {formData.image && (
                <div className={styles.imagePreview}>
                  <img
                    src={formData.image}
                    alt="Preview"
                    className={styles.previewImage}
                  />
                </div>
              )}
            </div>

            <div className={styles.formFooter}>
              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.btnPrimary}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
