import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

const generateReceiptPDF = async (
  cart,
  totalAmount,
  amountPaid,
  balance,
  customerDetails,
  orderId,
  order_key,
  pdfResponse,
  warehouseId,
  fbr_invoice_id
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

  // Load and add Company Logo
  if (companyConfig.logo) {
    try {
      const logoDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const maxWidth = 150;
          const maxHeight = 80;
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          // Scale down if needed
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve({ dataUrl: canvas.toDataURL("image/png"), width, height });
        };
        img.onerror = reject;
        img.src = companyConfig.logo;
      });

      const x = (doc.internal.pageSize.width - logoDataUrl.width) / 2;
      doc.addImage(logoDataUrl.dataUrl, "PNG", x, y, logoDataUrl.width, logoDataUrl.height);
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

  // === CALCULATIONS (matching printReceipt.js exactly) ===
  let subtotalWithoutTax = 0;
  let totalTax = 0;

  cart.forEach((item) => {
    const qty = item.quantity || 1;
    const basePrice = item?.product?.special_price || item?.basePrice || 0;
    const itemSubtotal = basePrice * qty;
    const taxAmount = item.taxAmount || 0;

    subtotalWithoutTax += itemSubtotal;
    totalTax += taxAmount;
  });

  const calculatedTotalBeforeDiscount = subtotalWithoutTax + totalTax;
  const cartDiscount = calculatedTotalBeforeDiscount - totalAmount;
  const discountPercent =
    calculatedTotalBeforeDiscount > 0
      ? (cartDiscount / calculatedTotalBeforeDiscount) * 100
      : 0;

  const grandTotal = totalAmount;

  // Dashed line before items
  doc.setLineWidth(0.5);
  doc.setLineDash([2, 2]);
  doc.line(20, y, 190, y);
  doc.setLineDash([]);
  y += 8;

  // Items Table
  const itemsTable = cart.map((item) => {
    const qty = item.quantity || 1;
    const basePrice = item?.product?.special_price || item?.basePrice || 0;
    const taxAmount = item.taxAmount || 0;
    const subtotal = basePrice * qty;
    const total = subtotal + taxAmount;
    const name = item?.product?.name || "Unknown Item";

    return [
      name,
      qty.toString(),
      `$${basePrice.toFixed(2)}`,
      `$${taxAmount.toFixed(2)}`,
      `$${total.toFixed(2)}`,
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
      0: { cellWidth: 80 }, // Name (flex: 1 equivalent)
      1: { cellWidth: 20, halign: "right" }, // Qty (40px)
      2: { cellWidth: 30, halign: "right" }, // Price (60px)
      3: { cellWidth: 30, halign: "right" }, // Tax (60px)
      4: { cellWidth: 30, halign: "right" }, // Total (70px)
    },
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
  doc.text(`$${subtotalWithoutTax.toFixed(2)}`, 190, y, { align: "right" });
  y += 5;

  // Cart Discount (if applicable)
  if (cartDiscount > 0) {
    doc.text(`Cart Discount (${discountPercent.toFixed(1)}%):`, 20, y);
    doc.text(`-$${cartDiscount.toFixed(2)}`, 190, y, { align: "right" });
    y += 5;
  }

  // Tax
  doc.text("Tax:", 20, y);
  doc.text(`$${totalTax.toFixed(2)}`, 190, y, { align: "right" });
  y += 5;

  // Total (Incl. Tax) - Bold
  doc.setFont(undefined, "bold");
  doc.text("Total (Incl. Tax):", 20, y);
  doc.text(`$${grandTotal.toFixed(2)}`, 190, y, { align: "right" });
  doc.setFont(undefined, "normal");
  y += 5;

  // Amount Paid
  doc.text("Amount Paid:", 20, y);
  doc.text(`$${parseFloat(amountPaid || 0).toFixed(2)}`, 190, y, { align: "right" });
  y += 5;

  // Change
  doc.text("Change:", 20, y);
  doc.text(`$${parseFloat(balance || 0).toFixed(2)}`, 190, y, { align: "right" });
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

  // Feedback QR Code
  try {
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}&warehouse=${warehouseId}`;
    const qrCodeDataURL = await QRCode.toDataURL(feedbackUrl, { width: 400, margin: 1 });
    
    const qrSize = 30;
    const qrX = (doc.internal.pageSize.width - qrSize) / 2;
    doc.addImage(qrCodeDataURL, "PNG", qrX, y, qrSize, qrSize);
    y += qrSize + 5;
    
    doc.setFontSize(12);
    const feedbackText = "Scan or click here for feedback";
    doc.textWithLink(feedbackText, 105, y, {
      align: "center",
      url: feedbackUrl,
    });
    y += 10;
  } catch (err) {
    console.error("QR Code error:", err);
  }

  // FBR Section (matching printReceipt.js exactly)
  if (fbr_invoice_id) {
    try {
      // Generate FBR QR code
      const fbrQrCodeDataUrl = await QRCode.toDataURL(fbr_invoice_id, { width: 480, margin: 1 });
      
      // Load FBR logo
      const fbrLogoDataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const targetWidth = 180;
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

      y += 10;

      // Background box with rounded corners
      const boxX = 25;
      const boxY = y;
      const boxWidth = 160;
      const boxHeight = 50;

      // Light gray background (#f8f9fa)
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, "F");

      // Border (#e0e0e0)
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.8);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, "S");

      // FBR logo (centered at top)
      const logoX = boxX + (boxWidth - 60) / 2;
      doc.addImage(fbrLogoDataUrl.dataUrl, "PNG", logoX, boxY + 5, 60, 60 * (fbrLogoDataUrl.height / fbrLogoDataUrl.width));

      // QR code and Invoice ID container
      const contentY = boxY + 22;
      const qrSize = 24;
      const qrX = boxX + 12;
      doc.addImage(fbrQrCodeDataUrl, "PNG", qrX, contentY, qrSize, qrSize);

      // Invoice ID (right of QR) - Bold
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(44, 62, 80); // #2c3e50
      doc.text(fbr_invoice_id, qrX + qrSize + 5, contentY + 12);
      doc.setFont(undefined, "normal");
      doc.setTextColor(0, 0, 0);

      // Verification text (bottom center) - Small font
      doc.setFontSize(10);
      doc.setTextColor(85, 85, 85); // #555
      doc.text(
        "Verify this invoice through FBR Tax Asaan MobileApp",
        boxX + boxWidth / 2,
        boxY + boxHeight - 5,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);

      y += boxHeight + 10;
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