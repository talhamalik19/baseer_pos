import React, { useState, useEffect } from 'react';
import styles from "./modal.module.scss"

export default function OrderActionModal({ 
  isOpen, 
  onClose, 
  order, 
  actionType, // 'refund' or 'cancel'
  onSubmit,
}) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [returnToStock, setReturnToStock] = useState([]);
  const pos_code = localStorage.getItem("pos_code");

  useEffect(() => {
    if (order?.items) {
      const initialItems = order.items.map(item => ({
        item_id: item.item_id,
        qty: 0,
        maxQty: parseFloat(item.item_qty_ordered),
        selected: false
      }));
      setSelectedItems(initialItems);
    }
  }, [order]);

  const refundReasonOptions = [
    "Damaged or Defective Product",
    "Wrong Item Received",
    "Item Not as Described",
    "Missing Parts or Accessories",
    "Product Expired or Near Expiry",
    "Better Price Available Elsewhere"
  ];

  if (!isOpen) return null;

  const handleItemSelection = (itemId, checked) => {
    setSelectedItems(items => items.map(item => 
      item.item_id === itemId ? { 
        ...item, 
        selected: checked,
        qty: checked ? item.maxQty : 0 
      } : item
    ));
  };

  const handleQuantityChange = (itemId, newQty) => {
    setSelectedItems(items => items.map(item => 
      item.item_id === itemId ? { 
        ...item, 
        qty: Math.min(Math.max(newQty, 0), item.maxQty)
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
        qty: item.qty
      }));

    const payload = {
      items: refundItems,
      notify: true,
      arguments: {
        shipping_amount: 0,
        adjustment_positive: 0,
        adjustment_negative: 0,
        extension_attributes: {
          return_to_stock_items: returnToStock
        }
      },
      reason,
      description,
      email: order?.customer_email,
      name: `${order.customer_firstname ? order.customer_firstname : "POS"} ${order?.customer_lastname ? order.customer_lastname : "Customer"}`
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

  const totalSelectedQty = selectedItems.reduce((sum, item) => sum + item.qty, 0);

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
          {/* Customer Info - Two Column Layout */}
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

          {/* Refund Items Section */}
          <div className={styles.itemsSection}>
            <h4>Select Items to Refund</h4>
            {selectedItems.map((item, index) => (
              <div key={item.item_id} className={styles.itemRow}>
                <div className={styles.itemCheckbox}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => handleItemSelection(item.item_id, e.target.checked)}
                  />
                </div>
                
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>
                    {order.items[index].product_name}
                    <span className={styles.itemSku}>(SKU: {order.items[index].product_sku})</span>
                  </div>
                  
                  <div className={styles.quantityControls}>
                    <input
                      type="number"
                      min="0"
                      max={item.maxQty}
                      value={item.qty}
                      onChange={(e) => handleQuantityChange(item.item_id, parseInt(e.target.value))}
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
            ))}
          </div>

          {/* Refund Reason */}
          <div className={styles.formGroup}>
            <label className={styles.required}>Refund Reason</label>
            <select 
              className={styles.formControl} 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Select a reason</option>
              {refundReasonOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea 
              className={styles.formControl} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed description"
              rows={4}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.totalRefund}>
            Total Items to Refund: <strong>{totalSelectedQty}</strong>
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
              disabled={!reason || totalSelectedQty === 0}
            >
              Process Refund
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}