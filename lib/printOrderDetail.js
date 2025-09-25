import QRCode from "qrcode";

export const printOrderDetail = async (order, pdfResponse) => {
  // Use configuration or fallbacks
  const companyConfig = pdfResponse || {
    title: "Order Details",
    subtitle: "Thank You For Your Purchase",
    logo: "/images/logo.png",
    companyName: "Store",
    address: "Address",
    city: "City",
    state: "State",
    zipCode: "Zip",
    phone: "Phone",
    email: "Email",
    footer: "Thank you for shopping with us!",
    footerText: "Please come again"
  };
  
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();
  
  // Generate QR code as data URL
  let qrCodeDataUrl;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order?.order_key}`);
  } catch (error) {
    console.error("Error generating QR code:", error);
    qrCodeDataUrl = ""; // Fallback if QR generation fails
  }
  
  const printWindow = window.open('', '_blank', 'height=600,width=800');
  
  // Create full address with available parts
  const addressParts = [];
  if (companyConfig.address) addressParts.push(companyConfig.address);
  if (companyConfig.city) addressParts.push(companyConfig.city);
  if (companyConfig.state) addressParts.push(companyConfig.state);
  if (companyConfig.zipCode) addressParts.push(companyConfig.zipCode);
  const fullAddress = addressParts.join(', ');
  
  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Create shipping address string
  const shippingAddress = order.shipping_address ? `
    ${order.shipping_address.firstname || ""} ${order.shipping_address.lastname || ""}<br>
    ${order.shipping_address.street || ""}<br>
    ${[
      order.shipping_address.city,
      order.shipping_address.region,
      order.shipping_address.postcode
    ].filter(Boolean).join(", ")}<br>
    ${order.shipping_address.country_id || ""}
  ` : "N/A";

  let orderContent = `
    <html>
    <head>
      <title>${companyConfig.title || "Order Details"}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }
        .logo {
          max-width: 150px;
          max-height: 80px;
          margin: 0 auto 10px;
          display: block;
        }
        .company-name {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 5px;
        }
        .company-details {
          font-size: 11px;
          margin-bottom: 5px;
        }
        .print-title {
          font-size: 22px;
          font-weight: bold;
        }
        .order-id {
          font-size: 16px;
          color: #666;
          margin-top: 5px;
        }
        .total-header {
          text-align: right;
          font-size: 18px;
          margin-bottom: 20px;
        }
        .total-amount {
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0 5px 0;
        }
        .item-row td {
          padding: 12px 8px;
        }
        .item-name {
          font-weight: bold;
        }
        .item-sku {
          color: #666;
          font-size: 12px;
        }
        .address-box {
          padding: 10px;
          border: 1px solid #ddd;
          margin-bottom: 15px;
          line-height: 1.5;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        .qr-code {
          text-align: center;
          margin-top: 20px;
        }
        .qr-code img {
          width: 100px;
          height: 100px;
        }
        .order-id {
          text-align: center;
          font-size: 12px;
          margin-top: 5px;
        }
        @media print {
          @page { margin: 0.5cm; }
          body { margin: 0; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${companyConfig.logo ? `<img src="${companyConfig.logo}" alt="${companyConfig.companyName || 'Company Logo'}" class="logo" />` : ''}
        <div class="company-name">${companyConfig.companyName || "Store"}</div>
        ${fullAddress ? `<div class="company-details">${fullAddress}</div>` : ''}
        ${companyConfig.phone ? `<div class="company-details">Phone: ${companyConfig.phone}</div>` : ''}
        ${companyConfig.email ? `<div class="company-details">Email: ${companyConfig.email}</div>` : ''}
        <div class="print-title">ORDER DETAILS</div>
        <div class="order-id">Order #${order.increment_id || order.id}</div>
      </div>
      
      <div class="total-header">
        Total Price: <span class="total-amount">$${order.order_grandtotal}</span>
      </div>
      
      <div class="section-title">Order Information</div>
      <table>
        <tr>
          <th>Order Date</th>
          <td>${formatDate(order.created_at)}</td>
          <th>Customer</th>
          <td>${order.shipping_address?.firstname || ""} ${order.shipping_address?.lastname || ""}</td>
        </tr>
        <tr>
          <th>Email</th>
          <td>${order?.customer_email}</td>
          <th>Location</th>
          <td>${order.shipping_address?.country_id || "N/A"}</td>
        </tr>
      </table>
      
      <div class="section-title">Payment & Totals</div>
      <table>
        <tr>
          <th>Payment Method</th>
          <td>${order.payment?.method || "Cash"}</td>
          <th>Subtotal</th>
          <td>$${order.subtotal || order.order_grandtotal}</td>
        </tr>
        <tr>
          <th>Shipping Method</th>
          <td>${order.shipping_description || "Pickup at store"}</td>
          <th>Shipping</th>
          <td>$${order.shipping_amount || "0.00"}</td>
        </tr>
        <tr>
          <th>Payment Date</th>
          <td>${formatDate(order.created_at)}</td>
          <th>Discount</th>
          <td>$${order.discount_amount || "0.00"}</td>
        </tr>
        <tr>
          <th>Payment Status</th>
          <td>${order.status || "Completed"}</td>
          <th>Grand Total</th>
          <td>$${order.order_grandtotal}</td>
        </tr>
      </table>
      
      <div class="section-title">Items Ordered</div>
      <table>
        <tr>
          <th>Product</th>
          <th>SKU</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
        ${(order.items || []).map(item => `
          <tr class="item-row">
            <td class="item-name">${item.product_name}</td>
            <td class="item-sku">${item.product_sku}</td>
            <td>${item.item_qty_ordered || item.qty}</td>
            <td>$${item.item_price || item.base_price}</td>
            <td>$${(item.item_price * (item.item_qty_ordered || item.qty)).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      
      <div class="section-title">Shipping Address</div>
      <div class="address-box">
        ${shippingAddress}
      </div>
  `;

  // Add QR code section if QR code was successfully generated
  if (qrCodeDataUrl) {
    orderContent += `
      <div class="qr-code">
        <img src="${qrCodeDataUrl}" alt="Order QR Code" />
        <div class="order-id">Scan the QR or click <a style="text-decoration: underline; color: #2c3e50;" href="${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order?.order_key}">Here</a> to give feedback</div>
      </div>
    `;
  }
  
  // Add footer
  orderContent += `
      <div class="footer">
        <p><strong>${companyConfig.footer || "Thank you for shopping with us!"}</strong></p>
        <p>${companyConfig.footerText || "Please come again"}</p>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        }
      </script>
    </body>
    </html>
  `;
  
  // Write the order content to the new window
  printWindow.document.write(orderContent);
  printWindow.document.close();
};