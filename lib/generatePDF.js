import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

const generateReceiptPDF = async (
  currencySymbol,
  cart,
  totalAmount,
  amountPaid,
  balance,
  customerDetails,
  orderId,
  order_key,
  pdfResponse,
  warehouseId,
  fbr_invoice_id,
  cartDiscountPercent = 0 // Add cart discount parameter
) => {
  const doc = new jsPDF();

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

  let y = 10;

  // Load and add Company Logo (SMALLER SIZE - matching print receipt)
// Load and add Company Logo (SMALLER SIZE - matching print receipt)
if (companyConfig.logo) {
  try {
    const logoDataUrl = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        const maxWidth = 60; 
        const maxHeight = 32;

        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;

        // Calculate aspect ratio
        const aspectRatio = originalWidth / originalHeight;

        let width = maxWidth;
        let height = width / aspectRatio;

        // If height exceeds limit, correct it
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        resolve({
          dataUrl: img.src,
          width,
          height,
        });
      };
      img.onerror = reject;
      img.src = companyConfig.logo;
    });

    const x = (doc.internal.pageSize.width - logoDataUrl.width) / 2;
    doc.addImage(
      logoDataUrl.dataUrl,
      "PNG",
      x,
      y,
      logoDataUrl.width,
      logoDataUrl.height
    );

    y += logoDataUrl.height + 5;
  } catch (err) {
    console.warn("Logo not added:", err);
    y += 5;
  }
}


  // Company Name (bold)
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text(companyConfig.companyName || "Store", 105, y, { align: "center" });
  doc.setFont(undefined, "normal");
  y += 6;

  // Company Details
  doc.setFontSize(11);
  const addressParts = [];
  if (companyConfig.address) addressParts.push(companyConfig.address);
  if (companyConfig.city) addressParts.push(companyConfig.city);
  if (companyConfig.state) addressParts.push(companyConfig.state);
  if (companyConfig.zipCode) addressParts.push(companyConfig.zipCode);
  const fullAddress = addressParts.join(", ");

  if (fullAddress) {
    doc.text(fullAddress, 105, y, { align: "center" });
    y += 5;
  }
  
  if (companyConfig.phone) {
    doc.text(`Phone: ${companyConfig.phone}`, 105, y, { align: "center" });
    y += 5;
  }
  
  if (companyConfig.email) {
    doc.text(`Email: ${companyConfig.email}`, 105, y, { align: "center" });
    y += 5;
  }

  // Subtitle
  doc.text(companyConfig.subtitle || "Thank You For Your Purchase", 105, y, {
    align: "center",
  });
  y += 10;

  // Order Info (Date, Time, Order ID)
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();

  doc.setFontSize(12);
  
  // Date line
  doc.text("Date:", 20, y);
  doc.text(dateString, 190, y, { align: "right" });
  y += 6;
  
  // Time line
  doc.text("Time:", 20, y);
  doc.text(timeString, 190, y, { align: "right" });
  y += 6;
  
  // Order ID line
  doc.text("Order ID:", 20, y);
  doc.text(orderId, 190, y, { align: "right" });
  y += 8;

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

  // Calculate subtotal with tax BEFORE cart discount
  const subtotalWithTax = subtotalWithoutTax + totalTax;
  
  // Cart discount is applied on subtotal + tax
  const cartDiscountAmount = hasCartDiscount ? (subtotalWithTax * cartDiscountPercent) / 100 : 0;
  
  // Grand total after cart discount
  const grandTotal = subtotalWithTax - cartDiscountAmount;

  // Dashed line before items
  doc.setLineWidth(0.5);
  doc.setLineDash([2, 2]);
  doc.line(20, y, 190, y);
  doc.setLineDash([]);
  y += 8;

  // Items Table
  const itemsTable = cart.map((item) => {
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

    // Build price column content
    let priceDisplay = `${currencySymbol}${actualPrice.toFixed(2)}`;
    if (hasProductDiscounts && hasDiscount) {
      priceDisplay = `${currencySymbol}${regularPrice.toFixed(2)}\n${currencySymbol}${actualPrice.toFixed(2)}`;
    }

    return [
      name,
      qty.toString(),
      priceDisplay,
      `${currencySymbol}${taxAmount.toFixed(2)}`,
      `${currencySymbol}${total.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    head: [["Name", "Qty", "Price", "Tax", "Total"]],
    body: itemsTable,
    startY: y,
    theme: "plain",
    styles: { 
      fontSize: 12, 
      cellPadding: 2,
    },
    headStyles: { 
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: "bold",
      lineWidth: { bottom: 0.5 },
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: hasProductDiscounts ? 70 : 80 }, // Name
      1: { cellWidth: 20, halign: "right" }, // Qty
      2: { cellWidth: hasProductDiscounts ? 40 : 30, halign: "right" }, // Price (wider if discounts)
      3: { cellWidth: 30, halign: "right" }, // Tax
      4: { cellWidth: 30, halign: "right" }, // Total
    },
    didParseCell: function(data) {
      // Style for strikethrough effect on original price
      if (data.column.index === 2 && data.section === 'body') {
        const cellText = data.cell.text;
        if (cellText.length === 2) { // Two lines means discount
          data.cell.styles.fontSize = 10;
        }
      }
    },
    didDrawCell: function(data) {
      // Draw strikethrough on first line of price if discount exists
      if (data.column.index === 2 && data.section === 'body') {
        const cellText = data.cell.text;
        if (cellText.length === 2) { // Two lines means discount
          const textWidth = doc.getTextWidth(cellText[0]);
          const x = data.cell.x + data.cell.width - data.cell.padding('right') - textWidth;
          const y = data.cell.y + 4;
          
          doc.setDrawColor(153, 153, 153); // Gray color
          doc.setLineWidth(0.3);
          doc.line(x, y, x + textWidth, y);
        }
      }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  // Dashed line after items
  doc.setLineDash([2, 2]);
  doc.line(20, y, 190, y);
  doc.setLineDash([]);
  y += 8;

  // Totals Section
  doc.setFontSize(12);
  
  // Subtotal (Excl. Tax)
  doc.text("Subtotal (Excl. Tax):", 20, y);
  doc.text(`${currencySymbol}${subtotalWithoutTax.toFixed(2)}`, 190, y, { align: "right" });
  y += 5;

  // Show product-level discount if applicable
  if (totalProductDiscount > 0 && !hasCartDiscount) {
    doc.text("Product Discount:", 20, y);
    doc.text(`-${currencySymbol}${totalProductDiscount.toFixed(2)}`, 190, y, { align: "right" });
    y += 5;
  }

  // Tax
  doc.text("Tax:", 20, y);
  doc.text(`${currencySymbol}${totalTax.toFixed(2)}`, 190, y, { align: "right" });
  y += 5;

  // Subtotal (Incl. Tax)
  doc.text("Subtotal (Incl. Tax):", 20, y);
  doc.text(`${currencySymbol}${subtotalWithTax.toFixed(2)}`, 190, y, { align: "right" });
  y += 5;

  // Cart Discount (if applicable)
  if (hasCartDiscount && cartDiscountAmount > 0) {
    doc.text(`Cart Discount (${cartDiscountPercent.toFixed(1)}%):`, 20, y);
    doc.text(`-${currencySymbol}{cartDiscountAmount.toFixed(2)}`, 190, y, { align: "right" });
    y += 5;
  }

  // Total - Bold
  doc.setFont(undefined, "bold");
  doc.text("Total:", 20, y);
  doc.text(`${currencySymbol}${grandTotal.toFixed(2)}`, 190, y, { align: "right" });
  doc.setFont(undefined, "normal");
  y += 5;

  // Amount Paid
  doc.text("Amount Paid:", 20, y);
  doc.text(`${currencySymbol}${parseFloat(amountPaid || 0).toFixed(2)}`, 190, y, { align: "right" });
  y += 5;

  // Change
  doc.text("Change:", 20, y);
  doc.text(`${currencySymbol}${parseFloat(balance || 0).toFixed(2)}`, 190, y, { align: "right" });
  y += 10;

  // Customer Info (if available)
  if (
    customerDetails &&
    (customerDetails.phone || customerDetails.email || customerDetails.name)
  ) {
    // Dashed line separator
    doc.setLineDash([2, 2]);
    doc.line(20, y, 190, y);
    doc.setLineDash([]);
    y += 8;

    doc.setFont(undefined, "bold");
    doc.text("Customer Information", 20, y);
    doc.setFont(undefined, "normal");
    y += 6;

    if (customerDetails.name) {
      doc.text(`Name: ${customerDetails.name}`, 20, y);
      y += 5;
    }
    if (customerDetails.phone) {
      doc.text(`Phone: ${customerDetails.phone}`, 20, y);
      y += 5;
    }
    if (customerDetails.email) {
      doc.text(`Email: ${customerDetails.email}`, 20, y);
      y += 5;
    }
    y += 5;
  }

  // Feedback QR Code (SMALLER SIZE - matching print receipt)
  try {
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}&warehouse=${warehouseId}`;
    const qrCodeDataURL = await QRCode.toDataURL(feedbackUrl, { width: 200, margin: 1 }); // Changed width from 400 to 200
    
    const qrSize = 20; // Changed from 30 to 20
    const qrX = (doc.internal.pageSize.width - qrSize) / 2;
    doc.addImage(qrCodeDataURL, "PNG", qrX, y, qrSize, qrSize);
    y += qrSize + 3; // Changed spacing from 5 to 3
    
    doc.setFontSize(10); // Changed from 12 to 10
    const feedbackText = "Scan or click here for feedback";
    doc.textWithLink(feedbackText, 105, y, {
      align: "center",
      url: feedbackUrl,
    });
    y += 10;
  } catch (err) {
    console.error("QR Code error:", err);
  }

  // FBR Section (SMALLER QR CODE)
  if (fbr_invoice_id != "Not Available") {
    try {
      // Generate FBR QR code (smaller size)
      const fbrQrCodeDataUrl = await QRCode.toDataURL(fbr_invoice_id, { width: 240, margin: 1 }); // Changed from 480 to 240
      
      // Load FBR logo (smaller size)
      const fbrLogoDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const targetWidth = 90; // Changed from 180 to 90
          const aspectRatio = img.naturalHeight / img.naturalWidth;
          const targetHeight = targetWidth * aspectRatio;
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          resolve({ dataUrl: canvas.toDataURL("image/png"), width: targetWidth, height: targetHeight });
        };
        img.onerror = reject;
        img.src = "/images/fbr.png";
      });

      y += 5;

      // Background box with rounded corners (smaller)
      const boxX = 40; // Changed from 25
      const boxY = y;
      const boxWidth = 130; // Changed from 160
      const boxHeight = 40; // Changed from 50

      // Light gray background (#f8f9fa)
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, "F");

      // Border (#e0e0e0)
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.8);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, "S");

      // FBR logo (centered at top, smaller)
      const logoWidth = 45; // Changed from 60
      const logoHeight = logoWidth * (fbrLogoDataUrl.height / fbrLogoDataUrl.width);
      const logoX = boxX + (boxWidth - logoWidth) / 2;
      doc.addImage(fbrLogoDataUrl.dataUrl, "PNG", logoX, boxY + 3, logoWidth, logoHeight);

      // QR code and Invoice ID container
      const contentY = boxY + 18; // Changed from 22
      const qrSize = 18; // Changed from 24
      const qrX = boxX + 8; // Changed from 12
      doc.addImage(fbrQrCodeDataUrl, "PNG", qrX, contentY, qrSize, qrSize);

      // Invoice ID (right of QR) - Bold, smaller font
      doc.setFontSize(11); // Changed from 14
      doc.setFont(undefined, "bold");
      doc.setTextColor(44, 62, 80); // #2c3e50
      doc.text(fbr_invoice_id, qrX + qrSize + 4, contentY + 9); // Adjusted positioning
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);

      // Verification text (bottom center) - Smaller font
      doc.setFontSize(8); // Changed from 10
      doc.setTextColor(85, 85, 85); // #555
      doc.text(
        "Verify this invoice through FBR Tax Asaan MobileApp",
        boxX + boxWidth / 2,
        boxY + boxHeight - 4,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);

      y += boxHeight + 8;
    } catch (error) {
      console.error("Error generating FBR QR section:", error);
    }
  }

  // Footer
  y += 5;
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.text(companyConfig.footer || "Thank you for shopping with us!", 105, y, {
    align: "center",
  });
  doc.setFont(undefined, "normal");
  y += 5;
  doc.setFontSize(11);
  doc.text(companyConfig.footerText || "Please come again", 105, y, {
    align: "center",
  });

  return doc.output("datauristring").split(",")[1];
};

export default generateReceiptPDF;