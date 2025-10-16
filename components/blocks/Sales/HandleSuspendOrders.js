"use client"
import React, { useState } from 'react';
import styles from "./suspend.module.scss";

const OrderControls = ({ cartItems, addItemsToSuspend, clearCart, getCartItems, setCartItems, setAmount }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSuspendOrders = async () => {
    if (!cartItems || cartItems.length === 0) return;
    
    setIsProcessing(true);
    try {
      const success = await addItemsToSuspend(cartItems);
      if (success) {
        await clearCart();
        const updatedCart = await getCartItems();
        setCartItems(updatedCart);
      } else {
        alert("Failed to suspend order.");
      }
    } catch (error) {
      console.error("Error suspending order:", error);
      alert("An error occurred while suspending the order.");
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
    }
  };

  const openConfirmModal = () => {
    if (cartItems && cartItems.length > 0) {
      setShowConfirmModal(true);
    }
    if (setAmount) setAmount("")
  };

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the overlay background
    if (e.target === e.currentTarget) {
      setShowConfirmModal(false);
    }
  };
  return (
    <>
  {(() => {
  const loginDetail = JSON.parse(localStorage.getItem("loginDetail"));
  const acl = loginDetail?.admin_acl;

  const isSuperAdmin = Array.isArray(acl) && acl.length === 0;
  const hasSuspendPermission = acl?.orders_suspend === false;

  return (isSuperAdmin || (!isSuperAdmin && !hasSuspendPermission));
})() && (
  <p 
    className={styles.hold_orders} 
    onClick={openConfirmModal}
    style={{ cursor: cartItems?.length > 0 ? 'pointer' : 'not-allowed' }}
  >
    Hold Order
  </p>
)}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className={styles.modal_overlay} 
          onClick={handleOverlayClick}
        >
          <div className={styles.confirmation_modal} onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Order Suspension</h3>
            <p>Are you sure you want to suspend this order?</p>
            
            <div className={styles.modal_buttons}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className={styles.cancel_button}
              >
                Cancel
              </button>
              <button 
                onClick={handleSuspendOrders}
                className={styles.confirm_button}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderControls;