import React from 'react'
import styles from './order.module.scss'

export default function OrderDetail({order}) {
  return (
    <div className='page_detail section_padding'>
    <div className={styles.receiptContainer}>
      <div className={styles.totalHeader}>
        <span className={styles.totalHeaderText}>Total Price: <span className={styles.totalAmount}>$72.35</span></span>
      </div>
      
      <table className={styles.receiptTable}>
        <tbody>
          {/* First row with order info and totals */}
          <tr className={styles.tableRow}>
            <td className={styles.sectionCell}>
              <table className={styles.innerTable}>
                <tbody>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Order Date:</td>
                    <td className={styles.valueCell}>13/03/2025 11:06</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Location:</td>
                    <td className={styles.valueCell}>Canada</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Customer:</td>
                    <td className={styles.valueCell}>Guest</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Staff:</td>
                    <td className={styles.valueCell}>Admin 2</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td colSpan="2" className={styles.buttonRow}>
                      <button className={`${styles.button} ${styles.completeButton}`}>Complete</button>
                      <button className={`${styles.button} ${styles.editButton}`}>Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td className={styles.sectionCell}>
              <table className={styles.innerTable}>
                <tbody>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Subtotal</td>
                    <td className={styles.amountCell}>72.35</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Discount</td>
                    <td className={styles.amountCell}>$0.00</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Shipping</td>
                    <td className={styles.amountCell}>$0.00</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Grand Total</td>
                    <td className={styles.amountCell}>$72.35</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.labelCell}>Total Paid</td>
                    <td className={styles.amountCell}>$72.35</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          {/* Items Ordered row */}
          <tr className={styles.tableRow}>
            <td colSpan="2" className={styles.sectionCell}>
              <div className={styles.sectionTitle}>Items Ordered</div>
              <table className={styles.innerTable}>
                <tbody>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.itemDetailsCell}>
                      <span className={styles.itemName}>Angel Light Running Short</span><br />
                      <span className={styles.itemSku}>[WSH02-2S-Purple]</span><br />
                      <span className={styles.itemDetails}>2S, Purple</span><br />
                      <span className={styles.itemQuantity}>Ordered: 2 · Invoiced: 2 · Shipped: 2</span>
                    </td>
                    <td className={styles.itemPriceCell}>
                      <span className={styles.priceTotal}>$84.00</span><br />
                      <span className={styles.priceDetail}>Origin Price: $42.00</span><br />
                      <span className={styles.priceDetail}>Price: $42.00</span><br />
                      <span className={styles.priceDetail}>Tax: $0.00</span><br />
                      <span className={styles.priceDetail}>Discount: $0.00</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          {/* Payment and Shipping method row */}
          <tr className={styles.tableRow}>
            <td className={styles.sectionCell}>
              <div className={styles.sectionTitle}>Payment Method</div>
              <table className={styles.innerTable}>
                <tbody>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.paymentMethodCell}>Cash (13/03/2025)</td>
                    <td className={styles.paidTag}>Paid</td>
                  </tr>
                  <tr className={styles.innerTableRow}>
                    <td colSpan="2" className={styles.totalCell}>$72.35</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td className={styles.sectionCell}>
              <div className={styles.sectionTitle}>Shipping Method</div>
              <table className={styles.innerTable}>
                <tbody>
                  <tr className={styles.innerTableRow}>
                    <td className={styles.shippingMethodCell}>Pickup at store</td>
                    <td className={styles.amountCell}>$0.00</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          
          {/* Address row */}
          <tr className={styles.tableRow}>
            <td className={styles.sectionCell}>
              <div className={styles.sectionTitle}>Shipping Address</div>
              <div className={styles.addressBox}>
                <div className={styles.addressLine}>Guest POS</div>
                <div className={styles.addressLine}>Street # 1, House # 123</div>
              </div>
            </td>
            <td className={styles.sectionCell}>
              <div className={styles.sectionTitle}>Billing Address</div>
              <div className={styles.addressBox}>
                <div className={styles.addressLine}>Guest POS</div>
                <div className={styles.addressLine}>Street # 1, House # 123</div>
              </div>
            </td>
          </tr>
          
          {/* Button row */}
          <tr className={styles.tableRow}>
            <td colSpan="2" className={styles.actionButtonsRow}>
              <button className={styles.actionButton}>Take Payment</button>
              <button className={styles.actionButton}>Refund</button>
              <button className={styles.actionButton}>Cancel</button>
              <button className={styles.actionButton}>Take Shipment</button>
              <button className={styles.actionButton}>Email</button>
              <button className={styles.actionButton}>Print</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  )
}
