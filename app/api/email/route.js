import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function sendEmailLogic(emailData) {
  const { email, orderId, orderData, pdf, pdfResponse, warehouseId, smtp_config } = emailData;

  // Setup transporter
  const transporter = nodemailer.createTransport({
    host: smtp_config?.smtp_host,
    port: smtp_config?.smtp_port,
    secure: smtp_config?.smtp_port == 465, // secure only for 465
    auth: {
      user: smtp_config?.smtp_user,
      pass: smtp_config?.smtp_pass,
    },
  });

  // Load logo
  const logoPath = path.join(process.cwd(), "public", "images", "zaafodesktop.png");
  let logoBase64 = "";
  try {
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    }
  } catch (err) {
    console.error("Logo error:", err.message);
  }

  const companyConfig = pdfResponse || {
    title: "Receipt",
    subtitle: "Thank You For Your Purchase",
    logo: logoBase64,
    footer: "Thank you for shopping with us!",
    footerText: "Please come again",
  };

  // QR Code
  const qrCodeDataURL = await QRCode.toDataURL(
    `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${orderData?.order_key}&warehouse=${warehouseId}`
  );
  const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");

  // Build items
  const itemsHtml = orderData.items
    .map((item) => {
      const qty = Number(item.qty) || 1;
      const price =
        Number(item.price || item?.product?.price?.regularPrice?.amount?.value) || 0;
      const taxAmount = Number(item.tax_amount) || 0;
      const discounted = Number(item.discounted_price) || null;
      const totalWithTax = ((discounted || price) * qty) + taxAmount;
      const name = item.product_name || item?.product?.name || "Unknown Item";

      return `
        <!-- Desktop row: VISIBLE by default -->
        <tr class="desktop-row" style="display:table-row;">
          <td style="padding:8px; border:1px solid #ddd; vertical-align:top;">${name}</td>
          <td style="padding:8px; border:1px solid #ddd; vertical-align:top;">${item.product_sku}</td>
          <td align="center" style="padding:8px; border:1px solid #ddd; vertical-align:top;">${qty}</td>
          <td align="right" style="padding:8px; border:1px solid #ddd; vertical-align:top;">$${price.toFixed(2)}</td>
          <td align="right" style="padding:8px; border:1px solid #ddd; vertical-align:top;">$${taxAmount.toFixed(2)}</td>
          <td align="right" style="padding:8px; border:1px solid #ddd; vertical-align:top;">$${totalWithTax.toFixed(2)}</td>
        </tr>

        <!-- Mobile stacked row: HIDDEN by default via inline display:none; shown only by media query -->
        <tr class="mobile-row" style="display:none; mso-hide:all;">
          <td colspan="6" style="padding:10px; border:1px solid #ddd; line-height:1.4; display:block;">
            <strong style="font-size:14px; color:#333; display:block;">${name}</strong>
            <span style="font-size:12px; color:#555; display:block; margin-top:4px;">SKU: ${item.product_sku}</span>
            <span style="font-size:12px; color:#555; display:block; margin-top:2px;">Qty: ${qty}</span>
            <span style="font-size:12px; color:#555; display:block; margin-top:2px;">Price: $${price.toFixed(2)}</span>
            ${
              discounted && discounted < price
                ? `<span style="font-size:12px; color:#d9534f; display:block; margin-top:2px;">Discounted: $${discounted.toFixed(2)}</span>`
                : ``
            }
            <span style="font-size:12px; color:#555; display:block; margin-top:2px;">Tax: $${taxAmount.toFixed(2)}</span>
            <strong style="font-size:13px; color:#2c3e50; display:block; margin-top:6px;">Total: $${totalWithTax.toFixed(2)}</strong>
          </td>
        </tr>
      `;
    })
    .join("");

  // HTML email template
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:10px; color:#333;">
      <!-- Inline styles + media query in body. Mobile rows are display:none inline; desktop rows display:table-row inline.
           The media query below sets mobile rows to display:table-row !important and hides desktop rows with !important, which
           overrides the inline display rules in clients that support media queries. -->
      <style>
        /* Default: hide mobile rows (already hidden inline), show desktop rows (already visible inline) */

        /* Use mobile breakpoint to swap layouts */
        @media only screen and (max-width: 600px) {
          /* Show stacked mobile rows */
          .mobile-row { display: table-row !important; }
          .mobile-row td { display: block !important; width: 100% !important; box-sizing: border-box !important; }
          /* Hide desktop table rows */
          .desktop-row { display: none !important; }
          /* Optional: remove table borders look for stacked rows */
          .mobile-row td { border:1px solid #ddd !important; padding:10px !important; }
        }

        /* Outlook-specific fix: keep desktop rows for Outlook desktop (which ignores media queries)
           and ensure mobile-row remains hidden there due to inline style and mso-hide */
        @media only screen and (min-width: 601px) {
          .mobile-row { display: none !important; }
          .desktop-row { display: table-row !important; }
        }

        table { width: 100%; border-collapse: collapse; }
        th, td { padding:8px; border:1px solid #ddd; font-size:13px; vertical-align:top; }
        .header-row th { background:#FEEEDF; color:#2c3e50; }
      </style>

      <center>
        <table width="100%" style="max-width:600px; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" style="background:#FEEEDF; padding:15px;">
              ${companyConfig.logo ? `<img src="cid:company-logo" alt="Logo" style="max-width:180px; height:auto; margin-bottom:10px;" />` : ""}
              <h1 style="margin:0; font-size:20px; color:#2c3e50;">${companyConfig.title}</h1>
              <p style="margin:5px 0; color:#555;">${companyConfig.subtitle}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:15px;">
              <h2 style="margin:0 0 10px; font-size:18px; color:#2c3e50;">Invoice #${orderId}</h2>
              <p style="margin:3px 0;"><strong>Date:</strong> ${new Date(orderData.order_date).toLocaleDateString()}</p>
              <p style="margin:3px 0;"><strong>Customer:</strong> ${orderData.customer_email || "-"}</p>

              <h3 style="margin-top:15px; font-size:16px;">Items</h3>

              <table role="presentation" style="width:100%; border-collapse:collapse;">
                <thead>
                  <tr class="header-row desktop-header" style="display:table-row;">
                    <th style="padding:8px; border:1px solid #ddd;">Item</th>
                    <th style="padding:8px; border:1px solid #ddd;">SKU</th>
                    <th style="padding:8px; border:1px solid #ddd;">Qty</th>
                    <th style="padding:8px; border:1px solid #ddd;">Price</th>
                    <th style="padding:8px; border:1px solid #ddd;">Tax</th>
                    <th style="padding:8px; border:1px solid #ddd;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <p style="margin-top:15px; text-align:right; font-size:15px;">
                <strong>Subtotal:</strong> $${Number(orderData.order_subtotal || 0).toFixed(2)}<br/>
                ${
                  orderData.cart_discount
                    ? `<strong>Cart Discount:</strong> -$${Number(orderData.cart_discount).toFixed(2)}<br/>`
                    : ""
                }
                <strong>Grand Total:</strong> $${Number(orderData.order_grandtotal || 0).toFixed(2)}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:#FEEEDF; padding:15px;">
              <p style="margin:0;">${companyConfig.footer}</p>
              <small>${companyConfig.footerText}</small>
              <div style="margin-top:10px;">
                <img src="cid:qr-code" alt="QR Code" style="width:80px; height:80px;" />
                <p style="font-size:12px;">
                  Scan the QR or click 
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${orderData?.order_key}&warehouse=${warehouseId}" style="color:#2c3e50; text-decoration:underline;">Here</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </center>
    </div>
  `;

  // Attachments
  const attachments = [
    {
      filename: `receipt-${orderId}.pdf`,
      content: pdf,
      encoding: "base64",
    },
    { filename: "qrcode.png", content: qrCodeBuffer, cid: "qr-code" },
  ];

  if (logoBase64) {
    attachments.push({
      filename: "logo.png",
      content: Buffer.from(logoBase64.split(",")[1], "base64"),
      cid: "company-logo",
    });
  }

  const result = await transporter.sendMail({
    from: `"POS Receipt" <${smtp_config?.email_from}>`,
    to: email,
    subject: `Your Order Receipt - ${orderId}`,
    html: htmlTemplate,
    attachments,
  });

  return result;
}

export async function POST(req) {
  try {
    const emailData = await req.json();
    const result = await sendEmailLogic(emailData);
    return NextResponse.json({ success: true, emailResult: result });
  } catch (error) {
    console.error("=== EMAIL API ERROR ===", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
