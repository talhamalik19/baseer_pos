"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "./cart.module.scss";
import { getCartItems, updateCartItemQuantity, removeFromCart, deleteFromCart, addItemsToSuspend, clearCart } from "@/lib/indexedDB";
import PaymentOverlay from "./PaymentOverlay";

const ShoppingCartSidebar = ({ isOpen, onClose, cartItems, cart, setCart, pdfResponse }) => {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const cartRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1200);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const extractPrice = (item) =>
    parseInt(item?.product?.price?.regularPrice?.amount?.value) || 0;
  
  const extractImage = (item) => 
    item?.product?.image?.url || item?.product?.small_image?.url || "";

  const subtotal = cart.reduce(
    (total, item) => total + extractPrice(item) * (item?.quantity || 1),
    0
  );

  // Calculate tax (3.35% based on your example)
  // const tax = subtotal * 0.0335;
  // const total = subtotal + tax;

  const handleQuantityChange = async (productUid, addedAt, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(productUid);
    } else {
      await updateCartItemQuantity(productUid, addedAt, newQuantity);
    }
    const updatedCart = await getCartItems();
    setCart(updatedCart);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || !cart.length) return;

      if (e.key === "Enter") {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === "input" || activeTag === "textarea") return;
      
        e.preventDefault();
        setPaymentOpen(true);
      }
      else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, cart.length, onClose]);

  const handleDeleteItem = async(id) => {
    await deleteFromCart(id)
    const updatedCart = await getCartItems();
    setCart(updatedCart);
  }

  const handleSuspendOrders = async () => {
    if (!cart || cart.length === 0) return;
  
    const success = await addItemsToSuspend(cart);
    if (success) {
      await clearCart(); // You'll need this utility to clear the existing cart
      const updatedCart = await getCartItems();
      setCart(updatedCart);
    } else {
      alert("Failed to suspend order.");
    }
  };
  return (
    <>
      {/* Backdrop - only for mobile */}
      {isMobile && (
        <div className={`${styles.sidebarBackdrop} ${isOpen ? styles.open : ''}`} onClick={onClose} />
      )}
      
      {/* Sidebar */}
      <div
        ref={cartRef}
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
      >
        {/* Close button - only for mobile */}
        {isMobile && (
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div className={styles.container}>
          <div className={styles.header}>
            <svg
              width="34"
              height="35"
              viewBox="0 0 34 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Your SVG path */}
            </svg>
            <h2>Shopping Cart</h2>
          </div>

          {/* Cart Items */}
          <div className={styles.itemsContainer}>
            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Your cart is empty</p>
            ) : (
              cart.map((item, index) => (
                <div key={index} className={styles.cartItem}>
                  <div className={styles.itemContent}>
                    <div className={styles.itemImage}>
                      <img src={extractImage(item)} alt={item?.product?.name} />
                    </div>
                    <div className={styles.itemDetails}>
                      <h3>{item?.product?.name}</h3>
                      <p className={styles.itemPrice}>
                        ${extractPrice(item).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.quantityControls}>
                      <button
                        className={styles.quantityButton}
                        onClick={() =>
                          handleQuantityChange(
                            item?.product?.uid,
                            item?.addedAt,
                            (item?.quantity || 1) - 1
                          )
                        }
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className={styles.quantityInput}
                        value={item?.quantity || 1}
                        onChange={(e) =>
                          handleQuantityChange(
                            item?.product?.uid,
                            item?.addedAt,
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                      <button
                        className={styles.quantityButton}
                        onClick={() =>
                          handleQuantityChange(
                            item?.product?.uid,
                            item?.addedAt,
                            (item?.quantity || 1) + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteItem(item?.product?.uid)}
                      aria-label="Remove item"
                    >
                      x
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
            <button className={styles.suspend} onClick={handleSuspendOrders}>Suspend</button>
          {/* Summary Section */}
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {/* <div className={styles.summaryRow}>
              <span>Discount</span>
              <span>$0.00</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Sales Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div> */}
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button
              className={styles.checkoutButton}
              onClick={() => setPaymentOpen(true)}
              disabled={cart.length === 0}
            >
              Continue to Payment
            </button>
          </div>
        </div>
        <PaymentOverlay
          isOpen={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          totalAmount={subtotal}
          styles={styles}
          cart={cart}
          setCart={setCart}
          pdfResponse={pdfResponse}
        />
      </div>
    </>
  );
};

export default ShoppingCartSidebar;