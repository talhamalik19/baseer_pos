import QRCode from "qrcode";

export const printReceipt = async (cart, totalAmount, amountPaid, balance, customerDetails, pdfResponse, orderId, order_key) => {
  // Use configuration or fallbacks
  const companyConfig = pdfResponse || {
    title: "Receipt",
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
    qrCodeDataUrl = await QRCode.toDataURL(`${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}`);
  } catch (error) {
    console.error("Error generating QR code:", error);
    qrCodeDataUrl = ""; // Fallback if QR generation fails
  }
  
  const printWindow = window.open('', '_blank', 'height=600,width=400');
  
  // Create full address with available parts
  const addressParts = [];
  if (companyConfig.address) addressParts.push(companyConfig.address);
  if (companyConfig.city) addressParts.push(companyConfig.city);
  if (companyConfig.state) addressParts.push(companyConfig.state);
  if (companyConfig.zipCode) addressParts.push(companyConfig.zipCode);
  const fullAddress = addressParts.join(', ');
  
  let receiptContent = `
    <html>
    <head>
      <title>${companyConfig.title || "Receipt"}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
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
        .receipt-info {
          margin-bottom: 10px;
          font-size: 12px;
        }
        .receipt-line {
          margin: 5px 0;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
        }
        .items {
          margin: 10px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 10px 0;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .totals {
          margin-top: 10px;
        }
        .totals-line {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
          font-size: 12px;
        }
        .customer-info {
          margin-top: 10px;
          border-top: 1px dashed #000;
          padding-top: 10px;
          font-size: 12px;
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
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 11px;
        }
        @media print {
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
        <div>${companyConfig.subtitle || "Thank You For Your Purchase"}</div>
      </div>
      
      <div class="receipt-info">
        <div class="receipt-line">
          <span>Date:</span>
          <span>${dateString}</span>
        </div>
        <div class="receipt-line">
          <span>Time:</span>
          <span>${timeString}</span>
        </div>
        <div class="receipt-line">
          <span>Order ID:</span>
          <span>${orderId}</span>
        </div>
      </div>
      
      <div class="items">
  `;
  
  // Add items to receipt
  cart.forEach(item => {
    const itemPrice = item?.product?.price?.regularPrice?.amount?.value || 0;
    const quantity = item.quantity || 1;
    const itemTotal = (itemPrice * quantity).toFixed(2);
    const itemName = item?.product?.name || "Unknown Item";
    
    receiptContent += `
      <div class="item">
        <span>${itemName} x${quantity}</span>
        <span>$${itemTotal}</span>
      </div>
    `;
  });
  
  // Add totals section
  receiptContent += `
      </div>
      
      <div class="totals">
        <div class="totals-line">
          <span><strong>Total:</strong></span>
          <span><strong>$${(totalAmount || 0).toFixed(2)}</strong></span>
        </div>
        <div class="totals-line">
          <span>Amount Paid:</span>
          <span>$${parseFloat(amountPaid || 0).toFixed(2)}</span>
        </div>
        <div class="totals-line">
          <span>Change:</span>
          <span>$${parseFloat(balance || 0).toFixed(2)}</span>
        </div>
      </div>
  `;
  
  // Add customer information if provided
  if (customerDetails && (customerDetails.phone || customerDetails.email || customerDetails.name)) {
    receiptContent += `
      <div class="customer-info">
        <div><strong>Customer Information</strong></div>
    `;
    
    if (customerDetails.name) {
      receiptContent += `
        <div class="receipt-line">
          <span>Name:</span>
          <span>${customerDetails.name}</span>
        </div>
      `;
    }
    
    if (customerDetails.phone) {
      receiptContent += `
        <div class="receipt-line">
          <span>Phone:</span>
          <span>${customerDetails.phone}</span>
        </div>
      `;
    }
    
    if (customerDetails.email) {
      receiptContent += `
        <div class="receipt-line">
          <span>Email:</span>
          <span>${customerDetails.email}</span>
        </div>
      `;
    }
    
    receiptContent += `
      </div>
    `;
  }

  // Add QR code section if QR code was successfully generated
  if (qrCodeDataUrl) {
    receiptContent += `
      <div class="qr-code">
        <img src="${qrCodeDataUrl}" alt="Order QR Code" />
        <div class="order-id">Scan the QR or click <a style="text-decoration: underline; color: #2c3e50;" href="${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}">Here</a> to give feedback</div>
      </div>
    `;
  }
  
  // Add footer
  receiptContent += `
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
  
  // Write the receipt content to the new window
  printWindow.document.write(receiptContent);
  printWindow.document.close();
};