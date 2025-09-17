"use client";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export default function Invoice({ style, order, slug }) {
  const [pdfResponse, setPdfResponse] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const res = JSON.parse(localStorage.getItem("jsonData"));
      if (res) setPdfResponse(res);
    }
  }, []);

  if (!order) return <p>No order found.</p>;

  const handleDownload = async () => {
    const doc = new jsPDF();

    // 🔹 Company Config
    const companyConfig = pdfResponse || {
      title: "Receipt",
      subtitle: "Thank You For Your Purchase",
      logo: "/images/logo.png",
      companyName: "My Store",
      address: "123 Main Street",
      city: "Islamabad",
      state: "PK",
      zipCode: "44000",
      phone: "+92 300 0000000",
      email: "support@mystore.com",
      footer: "Thank you for shopping with us!",
      footerText: "Please come again",
    };

    // 🔹 Logo
    if (companyConfig.logo) {
      try {
        const img = new Image();
        img.src = companyConfig.logo;
        doc.addImage(img, "PNG", 80, 5, 50, 20);
      } catch (err) {
        console.warn("Logo not added:", err);
      }
    }

    // 🔹 Company Info
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

    doc.text(companyConfig.subtitle, 105, 54, { align: "center" });

    // 🔹 Order Info
    let y = 65;
    doc.setFontSize(10);
    doc.text(`Order #: ${order.increment_id}`, 20, y);
    y += 6;
    doc.text(`Date: ${order.created_at}`, 20, y);
    y += 6;
    doc.text(
      `Customer: ${order.customer_firstname} ${order.customer_lastname}`,
      20,
      y
    );
    y += 6;
    doc.text(`Email: ${order.customer_email}`, 20, y);
    y += 10;

    // 🔹 Items Table
    autoTable(doc, {
      head: [["Product", "Qty", "Price", "Total"]],
      body: order.items.map((item) => [
        item.product_name,
        item.item_qty_ordered,
        `$${item.item_price}`,
        `$${(item.item_price * item.item_qty_ordered).toFixed(2)}`,
      ]),
      startY: y,
      theme: "plain", // ✅ matches reference style
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 40, halign: "right" },
        3: { cellWidth: 40, halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Grand Total: $${order.order_grandtotal}`, 150, y);

    // 🔹 QR Code for Feedback
    try {
      const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/feedback?id=${slug}`;
      const qrCodeDataURL = await QRCode.toDataURL(feedbackUrl);
      doc.addImage(qrCodeDataURL, "PNG", 90, y + 10, 30, 30);
      doc.setFontSize(9);
      doc.text("Scan to give feedback", 105, y + 45, { align: "center" });
    } catch (err) {
      console.error("QR Code error:", err);
    }

    // 🔹 Footer
    doc.setFontSize(10);
    doc.text(companyConfig.footer, 105, 280, { align: "center" });
    doc.text(companyConfig.footerText, 105, 286, { align: "center" });

    doc.save(`order_${order.increment_id}.pdf`);
  };

  return (
    <div className={style.invoice_page}>
      <div className={`${style.invoice_container} ${style?.consent_container}`}>
        <h2>Order Receipt</h2>
        <div className={style.invoice_box}>
          <p>
            <strong>Order #:</strong> {order.increment_id}
          </p>
          <p>
            <strong>Date:</strong> {order.created_at}
          </p>
          <p>
            <strong>Customer:</strong> {order.customer_firstname}{" "}
            {order.customer_lastname}
          </p>
          <p>
            <strong>Email:</strong> {order.customer_email}
          </p>
        </div>

        <h3>Items</h3>
        <ul className={style.item_list}>
          {order.items.map((item) => (
            <li key={item.item_id}>
              <div className={style.item_row}>
                <img src={item.image_url} alt={item.product_name} />
                <div>
                  <p className={style.item_name}>{item.product_name}</p>
                  <p>Qty: {item.item_qty_ordered}</p>
                  <p>Price: ${item.item_price}</p>
                  <p>
                    Total: $
                    {(item.item_price * item.item_qty_ordered).toFixed(2)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <h3>Grand Total: ${order.order_grandtotal}</h3>
        <button onClick={handleDownload}>Download Slip</button>
      </div>
    </div>
  );
}
