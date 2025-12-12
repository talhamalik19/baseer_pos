import React, { useState, useEffect } from 'react';
import styles from "./modal.module.scss"

export default function OrderActionModal({ 
  isOpen, 
  onClose, 
  order, 
  actionType,
  onSubmit,
  adminId
}) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [returnToStock, setReturnToStock] = useState([]);
  const pos_code = typeof window !== "undefined" ? localStorage.getItem("pos_code") : null;


useEffect(() => {
  if (isOpen && order?.items) {
    const initialItems = order.items.map(item => {
      const qtyOrdered = parseFloat(item.item_qty_ordered) || 0;
      const qtyRefunded = parseFloat(item.qty_refunded) || 0;
      const remainingQty = parseFloat((qtyOrdered - qtyRefunded).toFixed(2));

      return {
        item_id: item.item_id,
        qty: 0,
        maxQty: remainingQty,
        selected: false,
        originalMaxQty: remainingQty,
        qty_increment_step: parseFloat(item.qty_increment_step) || 1 // <-- ADDED
      };
    });

    setSelectedItems(initialItems);
    setReturnToStock([]); 
    setReason('');
    setDescription('');
  }
}, [isOpen, order]);



  const refundReasonOptions = [
    "Damaged or Defective Product",
    "Wrong Item Received",
    "Item Not as Described",
    "Missing Parts or Accessories",
    "Product Expired or Near Expiry",
    "Better Price Available Elsewhere",
    "Other" // NEW OPTION
  ];

  if (!isOpen) return null;

  const handleItemSelection = (itemId, checked) => {
    setSelectedItems(items => items.map(item => 
      item.item_id === itemId ? { 
        ...item, 
        selected: checked,
        qty: checked ? item.originalMaxQty : 0  // Use original max quantity
      } : item
    ));
    
    // Automatically check "Return to Stock" when item is selected
    if (checked) {
      setReturnToStock(prev => [...prev, itemId]);
    } else {
      setReturnToStock(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleQuantityChange = (itemId, newQty) => {
    const parsedQty = parseFloat(newQty);
    const finalQty = isNaN(parsedQty) ? 0 : parsedQty;
    
    setSelectedItems(items => items.map(item => 
      item.item_id === itemId ? { 
        ...item, 
        qty: Math.min(Math.max(finalQty, 0), parseFloat(item.maxQty))
      } : item
    ));
  };

  const handleReturnToStock = (itemId, checked) => {
    setReturnToStock(prev => checked 
      ? [...prev, itemId] 
      : prev.filter(id => id !== itemId)
    );
  };

  const handleSubmit = () => {
    const refundItems = selectedItems
      .filter(item => item.qty > 0)
      .map(item => ({
        order_item_id: item.item_id,
        qty: parseFloat(item.qty)
      }));

    const finalReason = reason === "Other"
      ? description
      : reason;

    const payload = {
      items: refundItems.map(item => ({
        order_item_id: item.order_item_id,
        qty: parseFloat(item.qty)
      })),
      notify: false,
      extension_attributes: {
        comment: finalReason || "Refund processed",
        return_to_stock_items: returnToStock,
        admin_id: adminId
      },
      arguments: {
        shipping_amount: 0,
        adjustment_positive: 0,
        adjustment_negative: 0
      }
    };

    const entity_id = order?.entity_id;
    onSubmit(payload, entity_id, pos_code);
    resetAndClose();
  };

  const resetAndClose = () => {
    setReason('');
    setDescription('');
    setSelectedItems([]);
    setReturnToStock([]);
    onClose();
  };

  const totalSelectedQty = selectedItems.reduce((sum, item) => sum + parseFloat(item.qty || 0), 0);

  const isSubmitDisabled = 
    !reason || 
    totalSelectedQty === 0 ||
    (reason === "Other" && description.trim() === "");

  return (
    <div className={styles.modalOverlay} onClick={resetAndClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Process Refund</h2>
          <button className={styles.closeBtn} onClick={resetAndClose}>
            &times;
          </button>
        </div>
        
        <div className={styles.modalBody}>

          {/* Customer Info */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Customer:</label>
              <div className={styles.staticField}>
                {`${order.shipping_address?.firstname || ""} ${order.shipping_address?.lastname || ""}`}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email:</label>
              <div className={styles.staticField}>{order?.customer_email}</div>
            </div>
          </div>

          {/* Refund Items */}
          <div className={styles.itemsSection}>
            <h4>Select Items to Refund</h4>
            {selectedItems.map((item, index) => {
              const orderItem = order.items[index];
              const qtyOrdered = parseFloat(orderItem.item_qty_ordered) || 0;
              const qtyRefunded = parseFloat(orderItem.qty_refunded) || 0;
              
              return (
                <div key={item.item_id} className={styles.itemRow}>
                  <div className={styles.itemCheckbox}>
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => handleItemSelection(item.item_id, e.target.checked)}
                      disabled={item.maxQty <= 0}
                    />
                  </div>
                  
                  <div className={styles.itemDetails}>
                    <div className={styles.itemName}>
                      {orderItem.product_name}
                      <span className={styles.itemSku}>(SKU: {orderItem.product_sku})</span>
                      {qtyRefunded > 0 && (
                        <span className={styles.refundedInfo}>
                          {` - Ordered: ${qtyOrdered}, Refunded: ${qtyRefunded}`}
                        </span>
                      )}
                    </div>
                    
                    <div className={styles.quantityControls}>
                      <input
  type="number"
  min="0"
  max={parseFloat(item.maxQty)}
  step={item.qty_increment_step}   // <-- UPDATED
  value={item.qty}
  onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
  disabled={!item.selected}
  className={styles.quantityInput}
/>
                      <span className={styles.maxQuantity}>/ {item.maxQty}</span>
                    </div>
                    
                    <div className={styles.returnToStock}>
                      <input
                        type="checkbox"
                        checked={returnToStock.includes(item.item_id)}
                        onChange={(e) => handleReturnToStock(item.item_id, e.target.checked)}
                        disabled={!item.selected || item.qty === 0}
                      />
                      <label>Return to Stock</label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Refund Reason */}
          <div className={styles.formGroup}>
            <label className={styles.required}>Refund Reason</label>
            <select 
              className={styles.formControl} 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select a reason</option>
              {refundReasonOptions.map((option, i) => (
                <option key={i} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {/* Description (Required only when "Other" is selected) */}
        {reason === "Other" && <div className={styles.formGroup}>
            <label className={reason === "Other" ? styles.required : ""}>
              Description {reason === "Other" && "(Required)"}
            </label>
            <textarea 
              className={styles.formControl} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed description"
              rows={4}
            />
          </div> }
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.totalRefund}>
            Total Items to Refund: <strong>{totalSelectedQty.toFixed(2)}</strong>
          </div>
          <div className={styles.buttonGroup}>
            <button 
              className={styles.btnSecondary} 
              onClick={resetAndClose}
            >
              Close
            </button>
            <button 
              className={styles.btnPrimary} 
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
            >
              Process Refund
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}