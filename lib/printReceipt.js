import QRCode from "qrcode";

export const printReceipt = async (
  cart,
  totalAmount,
  amountPaid,
  balance,
  customerDetails,
  pdfResponse,
  orderId,
  order_key,
  warehouseId,
  fbr_invoice_id,
  cartDiscountPercent = 0 // Add cart discount parameter
) => {
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
    footerText: "Please come again",
  };

  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();

  // Generate QR codes
  let qrCodeDataUrl = "";
  try {
    qrCodeDataUrl = await QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}&warehouse=${warehouseId}`
    );
  } catch (error) {
    console.error("Error generating QR code:", error);
  }

  let fbrQrCodeDataUrl = "";
  if (fbr_invoice_id) {
    try {
      fbrQrCodeDataUrl = await QRCode.toDataURL(fbr_invoice_id);
    } catch (error) {
      console.error("Error generating FBR QR code:", error);
    }
  }

  // Address
  const addressParts = [];
  if (companyConfig.address) addressParts.push(companyConfig.address);
  if (companyConfig.city) addressParts.push(companyConfig.city);
  if (companyConfig.state) addressParts.push(companyConfig.state);
  if (companyConfig.zipCode) addressParts.push(companyConfig.zipCode);
  const fullAddress = addressParts.join(", ");

  // === CALCULATIONS ===
  let subtotalWithoutTax = 0;
  let totalTax = 0;
  let totalProductDiscount = 0;
  const hasCartDiscount = cartDiscountPercent > 0;

  // Calculate if any product has individual discount
  const hasProductDiscounts = cart.some(item => {
    const regularPrice = item?.product?.price?.regularPrice?.amount?.value || 
                        item?.product?.price_range?.minimum_price?.regular_price?.value || 0;
    const specialPrice = item?.product?.special_price || 0;
    const discountedPrice = item?.product?.discounted_price;
    const actualPrice = discountedPrice || (specialPrice > 0 ? specialPrice : regularPrice);
    return actualPrice < regularPrice;
  });

  cart.forEach((item) => {
    const qty = item.quantity || 1;
    const regularPrice = item?.product?.price?.regularPrice?.amount?.value || 
                         item?.product?.price_range?.minimum_price?.regular_price?.value || 0;
    const specialPrice = item?.product?.special_price || 0;
    const discountedPrice = item?.product?.discounted_price;
    const actualPrice = discountedPrice || (specialPrice > 0 ? specialPrice : regularPrice);
    
    const itemSubtotal = actualPrice * qty;
    const productDiscount = (regularPrice - actualPrice) * qty;
    const taxAmount = item.taxAmount || 0;

    subtotalWithoutTax += itemSubtotal;
    totalTax += taxAmount;
    totalProductDiscount += productDiscount;
  });

  const subtotalWithTax = subtotalWithoutTax + totalTax;
  const cartDiscountAmount = hasCartDiscount ? (subtotalWithTax * cartDiscountPercent) / 100 : 0;
  const grandTotal = subtotalWithTax - cartDiscountAmount;

  // === START HTML ===
  let receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${companyConfig.title || "Receipt"}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
        .header { text-align: center; margin-bottom: 15px; }
        .logo { max-width: 150px; max-height: 80px; margin: 0 auto 10px; display: block; }
        .company-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
        .company-details { font-size: 11px; margin-bottom: 5px; }
        .receipt-line { margin: 5px 0; font-size: 12px; display: flex; justify-content: space-between; }
        .items { margin: 10px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; }
        .item-header, .item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
        .item-header { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 8px; }
        .totals { margin-top: 10px; }
        .totals-line { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
        .footer { text-align: center; margin-top: 20px; font-size: 11px; }
        .qr-code { text-align: center; margin-top: 20px; }
        .qr-code img { width: 100px; height: 100px; }
        .order-id { text-align: center; font-size: 12px; margin-top: 5px; }
        .fbr-section { background-color: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 10px; padding: 15px; margin: 20px auto; max-width: 320px; text-align: center; }
        .fbr-logo { max-width: 180px; margin: 0 auto 10px; display: block; }
        .fbr-qr-container { display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 10px; }
        .fbr-qr-code { width: 120px; height: 120px; }
        .fbr-invoice-id { font-size: 14px; font-weight: bold; color: #2c3e50; text-align: right; }
        .fbr-text { font-size: 10px; color: #555; margin-top: 8px; line-height: 1.4; }
        .strikethrough { text-decoration: line-through; color: #999; font-size: 10px; }
        @media print { body { margin: 0; padding: 10px; } }
      </style>
    </head>
    <body>
      <div class="header">
        ${companyConfig.logo ? `<img src="${companyConfig.logo}" alt="${companyConfig.companyName}" class="logo" />` : ""}
        <div class="company-name">${companyConfig.companyName || "Store"}</div>
        ${fullAddress ? `<div class="company-details">${fullAddress}</div>` : ""}
        ${companyConfig.phone ? `<div class="company-details">Phone: ${companyConfig.phone}</div>` : ""}
        ${companyConfig.email ? `<div class="company-details">Email: ${companyConfig.email}</div>` : ""}
        <div>${companyConfig.subtitle || "Thank You For Your Purchase"}</div>
      </div>

      <div class="receipt-line"><span>Date:</span><span>${dateString}</span></div>
      <div class="receipt-line"><span>Time:</span><span>${timeString}</span></div>
      <div class="receipt-line"><span>Order ID:</span><span>${orderId}</span></div>

      <div class="items">
        <div class="item-header">
          <span style="flex: 1;">Name</span>
          <span style="width: 40px; text-align: right;">Qty</span>
          ${hasProductDiscounts ? '<span style="width: 100px; text-align: right;">Price</span>' : '<span style="width: 60px; text-align: right;">Price</span>'}
          <span style="width: 60px; text-align: right;">Tax</span>
          <span style="width: 70px; text-align: right;">Total</span>
        </div>
  `;

  // Per product
  cart.forEach((item) => {
    const qty = item.quantity || 1;
    const regularPrice = item?.product?.price?.regularPrice?.amount?.value || 
                         item?.product?.price_range?.minimum_price?.regular_price?.value || 0;
    const specialPrice = item?.product?.special_price || 0;
    const discountedPrice = item?.product?.discounted_price;
    const actualPrice = discountedPrice || (specialPrice > 0 ? specialPrice : regularPrice);
    
    const hasDiscount = actualPrice < regularPrice;
    const taxAmount = item.taxAmount || 0;
    const subtotal = actualPrice * qty;
    const total = subtotal + taxAmount;
    const name = item?.product?.name || "Unknown Item";

    receiptContent += `
      <div class="item">
        <span style="flex: 1;">${name}</span>
        <span style="width: 40px; text-align: right;">${qty}</span>
    `;

    if (hasProductDiscounts) {
      if (hasDiscount) {
        receiptContent += `
          <span style="width: 100px; text-align: right;">
            <span class="strikethrough">$${regularPrice.toFixed(2)}</span><br/>
            $${actualPrice.toFixed(2)}
          </span>
        `;
      } else {
        receiptContent += `
          <span style="width: 100px; text-align: right;">$${actualPrice.toFixed(2)}</span>
        `;
      }
    } else {
      receiptContent += `
        <span style="width: 60px; text-align: right;">$${actualPrice.toFixed(2)}</span>
      `;
    }

    receiptContent += `
        <span style="width: 60px; text-align: right;">$${taxAmount.toFixed(2)}</span>
        <span style="width: 70px; text-align: right;">$${total.toFixed(2)}</span>
      </div>
    `;
  });

  // Totals
  receiptContent += `
      </div>
      <div class="totals">
        <div class="totals-line"><span>Subtotal (Excl. Tax):</span><span>$${subtotalWithoutTax.toFixed(2)}</span></div>
  `;

  // Show product-level discount if applicable
  if (totalProductDiscount > 0 && !hasCartDiscount) {
    receiptContent += `
        <div class="totals-line"><span>Product Discount:</span><span>-$${totalProductDiscount.toFixed(2)}</span></div>
    `;
  }

  receiptContent += `
        <div class="totals-line"><span>Tax:</span><span>$${totalTax.toFixed(2)}</span></div>
        <div class="totals-line"><span>Subtotal (Incl. Tax):</span><span>$${subtotalWithTax.toFixed(2)}</span></div>
  `;

  // Show cart-level discount if applicable
  if (hasCartDiscount && cartDiscountAmount > 0) {
    receiptContent += `
        <div class="totals-line"><span>Cart Discount (${cartDiscountPercent.toFixed(1)}%):</span><span>-$${cartDiscountAmount.toFixed(2)}</span></div>
    `;
  }

  receiptContent += `
        <div class="totals-line"><strong>Total:</strong><strong>$${grandTotal.toFixed(2)}</strong></div>
        <div class="totals-line"><span>Amount Paid:</span><span>$${parseFloat(amountPaid || 0).toFixed(2)}</span></div>
        <div class="totals-line"><span>Change:</span><span>$${parseFloat(balance || 0).toFixed(2)}</span></div>
      </div>
  `;

  // Customer Info
  if (customerDetails && (customerDetails.phone || customerDetails.email || customerDetails.name)) {
    receiptContent += `
      <div class="items" style="border:none; border-top:1px dashed #000;">
        <strong>Customer Information</strong><br/>
        ${customerDetails.name ? `Name: ${customerDetails.name}<br/>` : ""}
        ${customerDetails.phone ? `Phone: ${customerDetails.phone}<br/>` : ""}
        ${customerDetails.email ? `Email: ${customerDetails.email}` : ""}
      </div>
    `;
  }

  // QR and FBR
  if (qrCodeDataUrl) {
    receiptContent += `
      <div class="qr-code">
        <img src="${qrCodeDataUrl}" alt="Order QR Code" />
        <div class="order-id">
          Scan or <a href="${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}&warehouse=${warehouseId}" style="color:#2c3e50;">click here</a> for feedback
        </div>
      </div>
    `;
  }

  if (fbrQrCodeDataUrl && fbr_invoice_id) {
    receiptContent += `
      <div class="fbr-section">
        <img src="/images/fbr.png" alt="FBR Pakistan" class="fbr-logo" />
        <div class="fbr-qr-container">
          <img src="${fbrQrCodeDataUrl}" alt="FBR QR Code" class="fbr-qr-code" />
          <div class="fbr-invoice-id">${fbr_invoice_id}</div>
        </div>
        <div class="fbr-text">Verify this invoice through FBR Tax Asaan MobileApp</div>
      </div>
    `;
  }

  receiptContent += `
      <div class="footer">
        <p><strong>${companyConfig.footer || "Thank you for shopping with us!"}</strong></p>
        <p>${companyConfig.footerText || "Please come again"}</p>
      </div>
    </body></html>
  `;

  // Print logic
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(receiptContent);
    iframeDoc.close();

    iframe.onload = function () {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  } catch (error) {
    console.error("Error printing:", error);
    document.body.removeChild(iframe);
  }
};