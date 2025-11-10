"use client";
import React, { useEffect, useState } from "react";
import {
  getAllOnHoldCarts,
  deleteSuspendedItem,
  addToCart,
  getCartItems,
  clearCart,
  saveSuspendedOrder,
  addItemsToSuspend,
} from "@/lib/indexedDB";

import styles from "../Dashboard/dashboard.module.scss";
import { redirect, useRouter } from "next/navigation";

export default function Suspend({ serverLanguage }) {
  const router = useRouter();
  const [suspendedOrders, setSuspendedOrders] = useState([]);
  useEffect(() => {
    const fetchSuspended = async () => {
      const items = await getAllOnHoldCarts();
      setSuspendedOrders(items);
    };

    fetchSuspended();
  }, []);

  const handleUnsuspend = async (order) => {
    try {
      const currentCart = await getCartItems();

      // Suspend current cart if it has items
      if (currentCart.length > 0) {
        await addItemsToSuspend(currentCart);
      }

      // Clear current cart
      await clearCart();

      // Add items from selected suspended order to cart
      const itemsToAdd = Array.isArray(order.items) ? order.items : [];
      for (const item of itemsToAdd) {
        await addToCart(
          item.product,
          item.selected_options || {},
          item.quantity || 1
        );
      }

      // Remove the unsuspended order from suspended orders
      await deleteSuspendedItem(order.id);
      const updated = await getAllOnHoldCarts();
      setSuspendedOrders(updated);
      router.push("/sale");
    } catch (error) {
      console.error("Error unsuspending order:", error);
      // You might want to show a user-friendly error message here
    }
  };

  const handleDeleteSuspended = async (orderId) => {
    try {
      await deleteSuspendedItem(orderId);
      const updated = await getAllOnHoldCarts();
      setSuspendedOrders(updated);
    } catch (error) {
      console.error("Error deleting suspended order:", error);
    }
  };

  return (
    <div className="page_detail">
      <h2 className="section_padding">
        {serverLanguage?.suspended_orders ?? "Suspended Orders"}
      </h2>

      {suspendedOrders.length === 0 ? (
        <p>
          {serverLanguage?.no_suspended_orders_found ??
            "No suspended orders found."}
        </p>
      ) : (
        <div className={styles.orders}>
          <div className={styles.table_block}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suspendedOrders.map((order) => {
                  // Ensure order.items is an array
                  const items = Array.isArray(order.items) ? order.items : [];
                  const itemCount = items.length;
                  const orderTotal = items.reduce((sum, item) => {
                    const quantity = item.quantity || 1;
                    const price =
                      item.product?.price?.regularPrice?.amount?.value || 0;
                    return sum + quantity * price;
                  }, 0);

                  return (
                    <React.Fragment key={order.id}>
                      {/* Group header row */}
                      <tr
                        className={`${styles.order_header} ${styles.no_border}`}
                      >
                        <td colSpan="5">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g clip-path="url(#clip0_804_1105)">
                              <path
                                d="M7 3.5V7L9.33333 8.16667"
                                stroke="#6A7282"
                                stroke-width="1.16667"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M6.99935 12.8333C10.221 12.8333 12.8327 10.2217 12.8327 7.00001C12.8327 3.77834 10.221 1.16667 6.99935 1.16667C3.77769 1.16667 1.16602 3.77834 1.16602 7.00001C1.16602 10.2217 3.77769 12.8333 6.99935 12.8333Z"
                                stroke="#6A7282"
                                stroke-width="1.16667"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_804_1105">
                                <rect width="14" height="14" fill="white" />
                              </clipPath>
                            </defs>
                          </svg>

                          <strong>{order.note}</strong>
                        </td>
                      </tr>

                      {/* List items */}
                      {items.map((item, index) => {
                        const quantity = item.quantity || 1;
                        const price =
                          item.product?.price?.regularPrice?.amount?.value || 0;
                        const total = quantity * price;
                        const isLastItem = index === itemCount - 1;

                        return (
                          <tr
                            key={`${order.id}-${item.uid || index}`}
                            className={
                              !isLastItem ? styles.no_border : styles.shadow
                            }
                          >
                            <td>{item.product?.name}</td>
                            <td>{quantity}</td>
                            <td>{price.toFixed(2)}</td>
                            <td>{total.toFixed(2)}</td>

                            {/* Show action only on the first item row */}
                            {index === 0 ? (
                              <td rowSpan={itemCount}>
                                <button
                                  onClick={() => handleUnsuspend(order)}
                                  className="btn_primary"
                                >
                                  Unsuspend Order
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
