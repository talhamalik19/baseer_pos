import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

const generateReceiptPDF = async (
  cartItems,
  totalAmount,
  amountPaid,
  balance,
  customerDetails,
  orderId,
  order_key,
  pdfResponse
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

  if (companyConfig.logo) {
    try {
      const img = new Image();
      img.src = companyConfig.logo;
      doc.addImage(img, "PNG", 80, 5, 50, 20);
    } catch (err) {
      console.warn("Logo not added:", err);
    }
  }

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

  doc.setFontSize(11);
  doc.text("Items", 20, y);
  y += 5;

  const itemsTable = cartItems.map((item) => {
    const itemPrice =
      item?.product?.price?.regularPrice?.amount?.value ||
      item?.price ||
      0;
    const quantity = item.quantity || 1;
    const itemTotal = (itemPrice * quantity).toFixed(2);
    const itemName = item?.product?.name || "Unknown Item";
    return [`${itemName} x${quantity}`, `$${itemTotal}`];
  });

  autoTable(doc, {
    head: [["Item", "Total"]],
    body: itemsTable,
    startY: y,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: 0 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: "right" },
    },
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFontSize(10);
  doc.text(`Total: $${(totalAmount || 0).toFixed(2)}`, 130, y);
  y += 6;
  doc.text(`Amount Paid: $${parseFloat(amountPaid || 0).toFixed(2)}`, 130, y);
  y += 6;
  doc.text(
    `Change: $${parseFloat(balance || 0).toFixed(2)}`,
    130,
    y
  );
  y += 10;

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

  try {
    const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${order_key}`;
    const qrCodeDataURL = await QRCode.toDataURL(feedbackUrl);
    doc.addImage(qrCodeDataURL, "PNG", 90, y, 30, 30);
    y += 40;
    doc.setFontSize(9);
doc.textWithLink(
  "Scan the QR or click here to give feedback",
  105,
  y,
  {
    align: "center",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${orderData?.order_key}`
  }
);
    y += 10;
  } catch (err) {
    console.error("QR Code error:", err);
  }

  doc.setFontSize(10);
  doc.text(companyConfig.footer || "Thank you for shopping with us!", 105, y, {
    align: "center",
  });
  y += 5;
  doc.text(companyConfig.footerText || "Please come again", 105, y, {
    align: "center",
  });

  return doc.output("datauristring").split(",")[1];
};

export default generateReceiptPDF;