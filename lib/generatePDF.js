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

  // Company Logo
  if (companyConfig.logo) {
    try {
      const img = new Image();
      img.src = companyConfig.logo;
      doc.addImage(img, "PNG", 80, 5, 50, 20);
    } catch (err) {
      console.warn("Logo not added:", err);
    }
  }

  // Company Info
  doc.setFontSize(14);
  doc.text(companyConfig.companyName || "Store", 105, 30, { align: "center" });
  doc.setFontSize(9);

  const addressParts = [];
  if (companyConfig.address) addressParts.push(companyConfig.address);
  if (companyConfig.city) addressParts.push(companyConfig.city);
  if (companyConfig.state) addressParts.push(companyConfig.state);
  if (companyConfig.zipCode) addressParts.push(companyConfig.zipCode);
  const fullAddress = addressParts.join(", ");

  if (fullAddress) doc.text(fullAddress, 105, 36, { align: "center" });
  if (companyConfig.phone)
    doc.text(`Phone: ${companyConfig.phone}`, 105, 42, { align: "center" });
  if (companyConfig.email)
    doc.text(`Email: ${companyConfig.email}`, 105, 48, { align: "center" });

  doc.text(companyConfig.subtitle || "Thank You For Your Purchase", 105, 54, {
    align: "center",
  });

  // Order Info
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();

  let y = 65;
  doc.setFontSize(10);
  doc.text(`Date: ${dateString}`, 20, y);
  y += 6;
  doc.text(`Time: ${timeString}`, 20, y);
  y += 6;
  doc.text(`Order ID: ${orderId}`, 20, y);
  y += 10;

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

  // Items Table
  doc.setFontSize(11);
  doc.text("Items", 20, y);
  y += 5;

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
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: "right" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  // Totals (matching printReceipt.js structure)
  doc.setFontSize(10);
  doc.text(`Subtotal (Excl. Tax): $${subtotalWithoutTax.toFixed(2)}`, 130, y, {
    align: "right",
  });
  y += 6;

  if (cartDiscount > 0) {
    doc.text(
      `Cart Discount (${discountPercent.toFixed(1)}%): -$${cartDiscount.toFixed(2)}`,
      130,
      y,
      { align: "right" }
    );
    y += 6;
  }

  doc.text(`Tax: $${totalTax.toFixed(2)}`, 130, y, { align: "right" });
  y += 6;

  doc.setFont(undefined, "bold");
  doc.text(`Total (Incl. Tax): $${grandTotal.toFixed(2)}`, 130, y, {
    align: "right",
  });
  doc.setFont(undefined, "normal");
  y += 6;

  doc.text(`Amount Paid: $${parseFloat(amountPaid || 0).toFixed(2)}`, 130, y, {
    align: "right",
  });
  y += 6;

  doc.text(`Change: $${parseFloat(balance || 0).toFixed(2)}`, 130, y, {
    align: "right",
  });
  y += 10;

  // Customer Info
  if (
    customerDetails &&
    (customerDetails.phone || customerDetails.email || customerDetails.name)
  ) {
    doc.setFontSize(11);
    doc.text("Customer Information", 20, y);
    y += 6;
    doc.setFontSize(10);

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

  // Feedback QR Code (with warehouse parameter)
  try {
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}&warehouse=${warehouseId}`;
    const qrCodeDataURL = await QRCode.toDataURL(feedbackUrl);
    doc.addImage(qrCodeDataURL, "PNG", 90, y, 30, 30);
    y += 35;
    doc.setFontSize(9);
    doc.textWithLink("Scan or click here for feedback", 105, y, {
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
      const fbrLogo = new Image();
      fbrLogo.src = "/images/fbr.png";
      const fbrQrCodeDataUrl = await QRCode.toDataURL(fbr_invoice_id);

      y += 10;

      // Compact box
      const boxX = 25;
      const boxY = y;
      const boxWidth = 160;
      const boxHeight = 40;

      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.4);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, "S");

      // FBR logo (centered top)
      doc.addImage(fbrLogo, "PNG", boxX + 55, boxY + 3, 50, 15);

      // QR code (left side)
      doc.addImage(fbrQrCodeDataUrl, "PNG", boxX + 10, boxY + 18, 20, 20);

      // Invoice ID text (right of QR)
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text(fbr_invoice_id, boxX + 45, boxY + 30);
      doc.setFont(undefined, "normal");

      // Verification text (bottom center)
      doc.setFontSize(8.5);
      doc.text(
        "Verify this invoice through FBR Tax Asaan MobileApp",
        boxX + boxWidth / 2,
        boxY + boxHeight - 3,
        { align: "center" }
      );

      y += boxHeight + 10;
    } catch (error) {
      console.error("Error generating FBR QR section:", error);
    }
  }

  // Footer
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text(companyConfig.footer || "Thank you for shopping with us!", 105, y, {
    align: "center",
  });
  doc.setFont(undefined, "normal");
  y += 5;
  doc.text(companyConfig.footerText || "Please come again", 105, y, {
    align: "center",
  });

  return doc.output("datauristring").split(",")[1];
};

export default generateReceiptPDF;