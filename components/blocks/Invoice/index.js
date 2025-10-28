"use client";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";
import InvoiceSwiper from "./InvoiceSwiper";
import { submitFeedbackAction } from "@/lib/Magento/actions";
import SimpleAlertModal from "@/components/global/alertModal";

export default function Invoice({
  style,
  order,
  slug,
  feedbackQuestion,
  warehouseDeatil,
  warehouse,
}) {
  const warehouseInitialDetails = warehouse?.[0];
  const [pdfResponse, setPdfResponse] = useState({});
  const [answers, setAnswers] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [qrCodes, setQrCodes] = useState({ order: "", fbr: "" });
  const [accordionOpen, setAccordionOpen] = useState(null);
  const visibleItems = showAll ? order?.items : order?.items.slice(0, 2);
  const [loading, setLoading] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(false);

  // Calculate tax for individual item
  const calculateItemTax = (item) => {
    const priceInclTax = parseFloat(item.item_price_incl_tax) || 0;
    const priceExclTax = parseFloat(item.item_price) || 0;
    return (priceInclTax - priceExclTax).toFixed(2);
  };

  // Calculate total tax amount for row
  const calculateRowTax = (item) => {
    const rowTotalInclTax = parseFloat(item.item_row_total_incl_tax) || 0;
    const rowTotalExclTax = parseFloat(item.item_row_total) || 0;
    return (rowTotalInclTax - rowTotalExclTax).toFixed(2);
  };

  // Calculate order totals
  const calculateOrderTotals = () => {
    if (!order?.items) return { subtotal: 0, totalTax: 0, grandTotal: 0 };

    const subtotal = order.items.reduce(
      (sum, item) => sum + parseFloat(item.item_row_total || 0),
      0
    );

    const totalTax = order.items.reduce(
      (sum, item) => sum + parseFloat(calculateRowTax(item)),
      0
    );

    const grandTotal = parseFloat(order.order_grandtotal || 0);

    return {
      subtotal: subtotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
  };

  const orderTotals = calculateOrderTotals();

  // Single QR code generation effect
  useEffect(() => {
    async function generateAllQRCodes() {
      if (!order?.increment_id) return;

      try {
        const qrDataURL = await QRCode.toDataURL(order.increment_id);
        const fbrDataUrl = await QRCode.toDataURL(order.fbr_invoice_id);
        setQrCodes({ order: qrDataURL, fbr: fbrDataUrl });
      } catch (err) {
        console.error("QR generation failed:", err);
      }
    }
    generateAllQRCodes();
  }, [order?.increment_id]);

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
    doc.text(companyConfig.companyName || "Store", 105, 30, {
      align: "center",
    });
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

    // 🔹 Items Table with Tax
    autoTable(doc, {
      head: [["Product", "Qty", "Price", "Tax", "Total"]],
      body: order.items.map((item) => [
        item.product_name,
        item.item_qty_ordered,
        `Rs ${item.item_price}`,
        `Rs ${calculateRowTax(item)}`,
        `Rs ${item.item_row_total_incl_tax}`,
      ]),
      startY: y,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal: Rs ${orderTotals.subtotal}`, 150, y);
    y += 6;
    doc.text(`Total Tax: Rs ${orderTotals.totalTax}`, 150, y);
    y += 6;
    doc.text(`Grand Total: Rs ${orderTotals.grandTotal}`, 150, y);

    // 🔹 QR Code for Feedback
    try {
      const feedbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${slug}`;
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

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAccordionOpen = (index) => {
    setAccordionOpen((prevIndex) => (prevIndex === index ? null : index));
  };

  const policyBlocks = warehouseDeatil?.[0]?.policy_blocks;

  const termsAndPolicies = Object.values(policyBlocks || {}).map((block) => ({
    title: block.title,
    answer: block.description
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  }));
  const copyrights = warehouseDeatil?.[0]?.copyrights;

  const copyrightLines = copyrights
    ?.split(/\\r\\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const socialLinks = Object.values(warehouseDeatil?.[0]?.social_links || {});

  const handleSubmitFeedack = async () => {
    const responseObject = {
      data: {
        order_key: slug,
        customer_email: order?.customer_email ?? "",
        customer_phone: order?.customer_phone ?? "",
        channel: "offline",
        responses: answers
          .filter((ans) => ans?.rating)
          .map((ans) => ({
            question_id: ans.question_id,
            question_text: ans.question_text,
            rating: ans.rating,
            comment: ans.comment || "",
          })),
      },
    };
    try {
      setLoading(true);
      const feedbackActionResponse = await submitFeedbackAction(responseObject);
      if (feedbackActionResponse?.[0]?.success) {
        setLoading(false);
        setSubmitFeedback(true);
        setAnswers([]);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`${style.invoice_page}`}>
        <div className={`${style.invoice_container}`}>
          <div className={style.invoice_item_container}>
            <div className={style.invoice_item}>
              <div className={style.company_detail}>
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}/media/.thumbswysiwyg/responsive_logo.png`}
                  alt="logo"
                  width={71}
                  height={60}
                />
                <div className={style.invoice_name}>
                  <h2 className={style.name}>{`${
                    order?.customer_firstname ?? "Customer"
                  } ${order?.customer_lastname ?? ""}`}</h2>
                  <div>
                    <p>
                      <span className={style.label}>NTN: </span>
                      {warehouseInitialDetails?.ntn}
                    </p>
                    <p>
                      <span className={style.label}>STN: </span>
                      {warehouseInitialDetails?.stn}
                    </p>
                  </div>
                </div>
              </div>
              {(warehouseInitialDetails?.opening_hrs ||
                warehouseInitialDetails?.closing_hrs) && (
                <div className={style.working_hours}>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.54272 3.76123V7.26123L9.87606 8.4279"
                      stroke="#007A55"
                      strokeWidth="1.16667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7.54268 13.0946C10.7643 13.0946 13.376 10.4829 13.376 7.26123C13.376 4.03957 10.7643 1.42789 7.54268 1.42789C4.32102 1.42789 1.70935 4.03957 1.70935 7.26123C1.70935 10.4829 4.32102 13.0946 7.54268 13.0946Z"
                      stroke="#007A55"
                      strokeWidth="1.16667"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Open {warehouseInitialDetails?.opening_hrs ?? ""} -{" "}
                  {warehouseInitialDetails?.closing_hrs ?? ""}
                </div>
              )}
              <p className={style.address}>
                {warehouseInitialDetails?.store_address}
              </p>
            </div>
            {/* <p className={style.address}>
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.6261 6.92789C13.6261 10.2566 9.93341 13.7232 8.69341 14.7939C8.57789 14.8808 8.43728 14.9277 8.29275 14.9277C8.14821 14.9277 8.0076 14.8808 7.89208 14.7939C6.65208 13.7232 2.95941 10.2566 2.95941 6.92789C2.95941 5.5134 3.52131 4.15685 4.52151 3.15666C5.5217 2.15646 6.87826 1.59456 8.29275 1.59456C9.70723 1.59456 11.0638 2.15646 12.064 3.15666C13.0642 4.15685 13.6261 5.5134 13.6261 6.92789Z"
                  stroke="#62748E"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.29272 8.9279C9.39729 8.9279 10.2927 8.03247 10.2927 6.9279C10.2927 5.82333 9.39729 4.9279 8.29272 4.9279C7.18816 4.9279 6.29272 5.82333 6.29272 6.9279C6.29272 8.03247 7.18816 8.9279 8.29272 8.9279Z"
                  stroke="#62748E"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {warehouseInitialDetails?.store_address}
            </p> */}
          </div>

          <div className={style.sales_invoice_box}>
            <div>
              <div className={style.sales_title}>
                {/* <svg
                  width="21"
                  height="21"
                  viewBox="0 0 21 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.62604 1.9279V18.5946L5.2927 17.7612L6.95937 18.5946L8.62604 17.7612L10.2927 18.5946L11.9594 17.7612L13.626 18.5946L15.2927 17.7612L16.9594 18.5946V1.9279L15.2927 2.76124L13.626 1.9279L11.9594 2.76124L10.2927 1.9279L8.62604 2.76124L6.95937 1.9279L5.2927 2.76124L3.62604 1.9279Z"
                    stroke="#155DFC"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.6261 6.9279H8.62608C8.18405 6.9279 7.76013 7.1035 7.44757 7.41606C7.13501 7.72862 6.95941 8.15254 6.95941 8.59457C6.95941 9.0366 7.13501 9.46052 7.44757 9.77308C7.76013 10.0856 8.18405 10.2612 8.62608 10.2612H11.9594C12.4014 10.2612 12.8254 10.4368 13.1379 10.7494C13.4505 11.062 13.6261 11.4859 13.6261 11.9279C13.6261 12.3699 13.4505 12.7939 13.1379 13.1064C12.8254 13.419 12.4014 13.5946 11.9594 13.5946H6.95941"
                    stroke="#155DFC"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.2927 14.8446V5.6779"
                    stroke="#155DFC"
                    strokeWidth="1.66667"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg> */}
                <div className={style.sales_title_text}>
                  <p className={style.text}>Sales Invoice</p>
                  {/* <p>Transaction Details</p> */}
                </div>
              </div>
              <div className={style.sales_summary}>
                <span className={style.date}>
                  {order?.created_at?.split(" ")?.[0]}
                </span>
                <span className={style.time}>
                  {order?.created_at?.split(" ")?.[1]}
                </span>
              </div>
            </div>
            <div className={style.invoice_num}>
              {/* <p className={style.title}>Invoice Number</p> */}
              <p>{`Invoice# ${order?.increment_id}`}</p>
            </div>
          </div>

          <div className={style.cashier_customer}>
            <div className={style.cashier}>
              {/* <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.9594 14.2612V12.9279C12.9594 12.2207 12.6784 11.5424 12.1783 11.0423C11.6782 10.5422 10.9999 10.2612 10.2927 10.2612H6.2927C5.58546 10.2612 4.90718 10.5422 4.40709 11.0423C3.90699 11.5424 3.62604 12.2207 3.62604 12.9279V14.2612"
                  stroke="#155DFC"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.2927 7.59456C9.76546 7.59456 10.9594 6.40066 10.9594 4.9279C10.9594 3.45514 9.76546 2.26123 8.2927 2.26123C6.81994 2.26123 5.62604 3.45514 5.62604 4.9279C5.62604 6.40066 6.81994 7.59456 8.2927 7.59456Z"
                  stroke="#155DFC"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg> */}
              <div className={style.cashier_detail}>
                <p className={style.text}>Cashier</p>
                <p className={style.name}>
                  {order?.admin_user
                    ? order.admin_user.charAt(0).toUpperCase() +
                      order.admin_user.slice(1)
                    : ""}
                </p>
              </div>
              <div className={style.cashier_detail}>
                <p className={style.text}>Email</p>
                <p className={style.name}>{order?.customer_email}</p>
              </div>
            </div>
            {/* <div className={style.customer}>
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.51404 11.3066C9.65172 11.3698 9.80684 11.3843 9.95383 11.3475C10.1008 11.3108 10.2309 11.2251 10.3227 11.1046L10.5594 10.7946C10.6836 10.629 10.8446 10.4946 11.0298 10.402C11.2149 10.3094 11.419 10.2612 11.626 10.2612H13.626C13.9797 10.2612 14.3188 10.4017 14.5688 10.6518C14.8189 10.9018 14.9594 11.241 14.9594 11.5946V13.5946C14.9594 13.9482 14.8189 14.2873 14.5688 14.5374C14.3188 14.7874 13.9797 14.9279 13.626 14.9279C10.4434 14.9279 7.39119 13.6636 5.14076 11.4132C2.89032 9.16275 1.62604 6.11051 1.62604 2.92791C1.62604 2.57429 1.76651 2.23515 2.01656 1.9851C2.26661 1.73505 2.60575 1.59457 2.95937 1.59457H4.95937C5.31299 1.59457 5.65213 1.73505 5.90218 1.9851C6.15223 2.23515 6.2927 2.57429 6.2927 2.92791V4.92791C6.2927 5.1349 6.24451 5.33905 6.15194 5.52419C6.05937 5.70933 5.92497 5.87038 5.75937 5.99457L5.44737 6.22857C5.32498 6.32203 5.23872 6.45496 5.20323 6.60481C5.16775 6.75465 5.18523 6.91216 5.2527 7.05057C6.16383 8.90115 7.66232 10.3978 9.51404 11.3066Z"
                  stroke="#009966"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div>
                <p className={style.text}>{order?.customer_email}</p>
                <p className={style.name}>Email</p>
              </div>
            </div> */}
          </div>

          {/* Feedback Rating Section */}
          {feedbackQuestion && (
            <div className={style.feedback_section}>
              {feedbackQuestion?.map((item, index) => (
                <div key={index}>
                  <h2>{item?.text}</h2>

                  <div className={style.stars}>
                    {[...(item?.options || [])]
                      .reverse()
                      .map((star) => Number(star))
                      .map((star) => (
                        <span
                          key={star}
                          className={`${style.star} ${
                            answers[index]?.rating >= star ? style.active : ""
                          }`}
                          onClick={() =>
                            setAnswers((prev) => {
                              const newAnswers = [...prev];
                              newAnswers[index] = {
                                question_id: item?.id || `Q${index + 1}`,
                                question_text: item?.text,
                                rating: star,
                                comment: newAnswers[index]?.comment || "",
                              };
                              return newAnswers;
                            })
                          }
                        >
                          ★
                        </span>
                      ))}
                  </div>

                  {answers[index]?.rating && (
                    <>
                      <p className={style.rating_text}>
                        You rated us {answers[index].rating} star
                        {answers[index].rating > 1 ? "s" : ""}
                      </p>
                      <div className={style.textarea_box}>
                        <label htmlFor={`feedback-${index}`}>
                          Tell us more about your experience (optional)
                        </label>
                        <textarea
                          id={`feedback-${index}`}
                          value={answers[index]?.comment || ""}
                          onChange={(e) =>
                            setAnswers((prev) => {
                              const newAnswers = [...prev];
                              newAnswers[index] = {
                                ...newAnswers[index],
                                comment: e.target.value,
                              };
                              return newAnswers;
                            })
                          }
                          maxLength={500}
                          placeholder="Share your thoughts about our service..."
                        />
                        <div className={style.char_count}>
                          {answers[index]?.comment?.length || 0}/500 characters
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {answers.some((ans) => ans?.rating) && (
                <button
                  className={style.submit_btn}
                  onClick={handleSubmitFeedack}
                >
                  {loading ? "Submitting" : "Submit Feedback"}
                </button>
              )}
            </div>
          )}

          <div className={style.products_section}>
            {/* Header */}
            <div className={style.products_header}>
              <div>
                <p className={style.title}>Products</p>
              </div>
              <p className={style.count}>{order?.items.length} items</p>
            </div>

            {/* Products List */}
            {visibleItems.map((item, i) => (
              <div key={i} className={style.product_row}>
                <div className={style.product_detail}>
                  <p className={style.product_name}>
                    {item.product_name} {item.size ? `- ${item.size}` : ""}
                  </p>
                  <span className={style.product_code}>{item.product_sku}</span>
                  <div className={style.meta}>
                    <span>Qty: {item.item_qty_ordered}</span>
                    <span className={style.discount}>
                      Discount: Rs. {item.discount || "0"}
                    </span>
                    <span className={style.tax}>
                      Tax: Rs. {calculateRowTax(item)}
                    </span>
                    <div className={style.price_box}>
                      Rs. {item.item_row_total_incl_tax}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load more */}
            {order?.items.length > 2 && (
              <div className={style.load_more_btn}>
                <button
                  className={style.load_more}
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? " Show less products"
                    : ` View all products (${order?.items.length} total)`}
                </button>
              </div>
            )}

            <div className={style.summary}>
              <p>Order Summary</p>
              <div className={style.summary_detail}>
                <div className={style.summary_block}>
                  <p>Total Orders</p>
                  <p>{order?.items?.length}</p>
                </div>
                <div className={style.summary_block}>
                  <p>Total Quantity</p>
                  <p>
                    {order?.items.reduce(
                      (sum, item) => sum + parseFloat(item.item_qty_ordered),
                      0
                    )}
                  </p>
                </div>
                <div className={style.summary_block}>
                  <p>Subtotal (excl. tax)</p>
                  <p>Rs. {orderTotals.subtotal}</p>
                </div>
                <div className={style.summary_block}>
                  <p>Total Tax</p>
                  <p>Rs. {orderTotals.totalTax}</p>
                </div>
              </div>

              <div className={style.summary_total}>
                <div className={style.summary_total_block}>
                  <p>Total Payable</p>
                  <p>Rs. {orderTotals.grandTotal}</p>
                </div>
                <div className={style.summary_total_block}>
                  <p>Payment Mode</p>
                  <p>{order?.payment?.payment_method_title || "Cash"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={style.fbr_social}>
            <div className={style.fbr}>
              <img src={"/images/fbr.png"} alt="fbr logo" />
              <p>Verify via FBR Tax Asaan App or SMS 9966</p>
              <div className={style.qr}>
                {qrCodes?.fbr && <img src={qrCodes.fbr} alt="qr code" />}
                <p>{order.fbr_invoice_id}</p>
              </div>
              <div></div>
            </div>
            <div className={style.social}>
              <p>Connect with us</p>
              <div className={style.social_icons}>
                {socialLinks?.map((item, index) => (
                  <Link key={index} href={item?.link}>
                    <img
                      src={item.image}
                      alt="logo"
                      style={{ width: "20px", height: "20px" }}
                    />
                  </Link>
                ))}
              </div>
              {/* <p>Follow for updates</p> */}
            </div>
          </div>

          <div className={style.swiper}>
            <InvoiceSwiper
              slide={warehouseDeatil?.[0]?.banners}
              style={style}
            />
          </div>

          <div className={style.accordion}>
            <div className={style.header}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-shield h-5 w-5 sm:h-4 sm:w-4 text-slate-500"
                aria-hidden="true"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
              </svg>
              <p>Terms & Policies</p>
            </div>

            {termsAndPolicies?.map((item, index) => (
              <div key={index} className={style.accordion_item}>
                <p
                  className={`${style.question} ${
                    accordionOpen === index ? style.question_opened : ""
                  }`}
                  onClick={() => handleAccordionOpen(index)}
                >
                  {item?.title}
                  <span className={style.toggle_icon}>
                    {accordionOpen === index ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-chevron-right h-4 w-4 text-gray-400 transition-transform duration-200 rotate-90"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    ) : (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 17 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.5 12.5781L10.5 8.57813L6.5 4.57812"
                          stroke="#99A1AF"
                          stroke-width="1.33333"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </p>
                <div
                  className={`${style.answer_wrapper} ${
                    accordionOpen === index ? style.open : ""
                  }`}
                >
                  <ul>
                    {item?.answer?.map((ans, i) => (
                      <li className={style.ans} key={i}>
                        {ans}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className={style.bottom}>
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.1512 7.24478C15.4556 8.73898 15.2387 10.2924 14.5364 11.646C13.8342 12.9996 12.6891 14.0715 11.2922 14.683C9.89527 15.2945 8.33093 15.4086 6.86004 15.0064C5.38916 14.6041 4.10064 13.7097 3.20936 12.4724C2.31808 11.2351 1.87793 9.72961 1.96229 8.20704C2.04665 6.68447 2.65043 5.23684 3.67294 4.10557C4.69546 2.97429 6.0749 2.22774 7.58122 1.99042C9.08754 1.7531 10.6297 2.03936 11.9505 2.80145"
                  stroke="#4A5565"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M6.61719 7.91154L8.61719 9.91154L15.2839 3.24487"
                  stroke="#4A5565"
                  stroke-width="1.33333"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Customer satisfaction guaranteed
            </div>
          </div>
          {console.log(copyrightLines)}
          <div className={style.footer}>
  <p>
    Powered by <Link className={style.baseer} href={'https://web.baseer.ca'} target="_blank">{copyrightLines?.[1] || "Baseer"}</Link>
  </p>
  <p>{copyrightLines?.[2]}</p>
  <p>
    <Link target="_blank" href="https://baseer.ca/privacy-policy" className={style.privacyLink}>
      {copyrightLines?.[3] || "Privacy Policy"}
    </Link>
  </p>
  <p>{copyrightLines?.[4]}</p>
</div>

        </div>
      </div>
      <SimpleAlertModal
        isOpen={submitFeedback}
        onClose={() => setSubmitFeedback((prev) => !prev)}
        title={"Feedback"}
        message={"Thank You For Submitting your Feedback.."}
      />
    </>
  );
}
