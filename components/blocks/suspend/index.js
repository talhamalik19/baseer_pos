"use client";
import React, { useEffect, useState } from 'react';
import {
  getAllOnHoldCarts,
  deleteSuspendedItem,
  addToCart,
  getCartItems,
  clearCart,
  saveSuspendedOrder,
  addItemsToSuspend
} from '@/lib/indexedDB';

import styles from "../Dashboard/dashboard.module.scss";
import { redirect, useRouter } from 'next/navigation';

export default function Suspend({serverLanguage}) {
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
        await addToCart(item.product, item.selected_options || {}, item.quantity || 1);
      }
      
      // Remove the unsuspended order from suspended orders
      await deleteSuspendedItem(order.id);
      const updated = await getAllOnHoldCarts();
      setSuspendedOrders(updated);
router.push("/sale")
    } catch (error) {
      console.error('Error unsuspending order:', error);
      // You might want to show a user-friendly error message here
    }
  };

  const handleDeleteSuspended = async (orderId) => {
    try {
      await deleteSuspendedItem(orderId);
      const updated = await getAllOnHoldCarts();
      setSuspendedOrders(updated);
    } catch (error) {
      console.error('Error deleting suspended order:', error);
    }
  };

  return (
    <div className="page_detail">
      <h2 className="section_padding">{serverLanguage?.suspended_orders ?? 'Suspended Orders'}</h2>

      {suspendedOrders.length === 0 ? (
        <p>{serverLanguage?.no_suspended_orders_found ?? 'No suspended orders found.'}</p>
      ) : (
        <div className={styles.orders}>
          <div className="table_block">
            <table className="table_view">
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
                    const price = item.product?.price?.regularPrice?.amount?.value || 0;
                    return sum + (quantity * price);
                  }, 0);

                  return (
                    <React.Fragment key={order.id}>
                      {/* Group header row */}
                      <tr>
                        <td colSpan="5">
                          <strong>{order.note}</strong>
                        </td>
                      </tr>

                      {/* List items */}
                      {items.map((item, index) => {
                        const quantity = item.quantity || 1;
                        const price = item.product?.price?.regularPrice?.amount?.value || 0;
                        const total = quantity * price;

                        return (
                          <tr key={`${order.id}-${item.uid || index}`}>
                            <td>
                              {item.product?.name}
                            </td>
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