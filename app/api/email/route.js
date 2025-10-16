import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { email, orderId, orderData, pdf, pdfResponse, warehouseId, smtp_config } = await req.json();

    const transporter = nodemailer.createTransport({
      host: smtp_config?.smtp_host,
      port: smtp_config?.smtp_port,
      secure: true,
      auth: {
        user: smtp_config?.smtp_user,
        pass: smtp_config?.smtp_pass,
      },
    });

    const logoPath = path.join(process.cwd(), "public", "images", "zaafodesktop.png");
    let logoBase64 = "";
    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Logo error:", err.message);
      logoBase64 = "";
    }

    const companyConfig = pdfResponse || {
      title: "Receipt",
      subtitle: "Thank You For Your Purchase",
      logo: logoBase64,
      companyName: "Store",
      footer: "Thank you for shopping with us!",
      footerText: "Please come again",
    };

    const qrCodeDataURL = await QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${orderData?.order_key}&warehouse=${warehouseId}`
    );
    const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");

    const itemsHtml = orderData.items
      .map((item) => {
        const qty = Number(item.qty) || 1;
        const price = Number(item.price || item?.product?.price?.regularPrice?.amount?.value) || 0;
        const taxAmount = Number(item.tax_amount) || 0;
        const totalWithTax = price * qty + taxAmount;
        const name = item.product_name || item?.product?.name || "Unknown Item";

        return `
          <tr>
            <td style="padding:10px; border:1px solid #ddd;">${name}</td>
            <td style="padding:10px; border:1px solid #ddd;">${item.product_sku}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:center;">${qty}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:right;">$${price.toFixed(2)}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:right;">$${taxAmount.toFixed(2)}</td>
            <td style="padding:10px; border:1px solid #ddd; text-align:right;">$${totalWithTax.toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    // --- Styled HTML Template ---
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:30px; color:#333; line-height:1.6;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
          
          <div style="background:#FEEEDF; padding:20px; text-align:center;">
            ${
              companyConfig.logo
                ? `<img src="cid:company-logo" alt="Company Logo" style="max-height:60px; max-width:200px; margin-bottom:10px;" />`
                : ""
            }
            <h1 style="color:#2c3e50; margin:0; font-size:22px;">${companyConfig.title}</h1>
            <p style="color:#555; margin:5px 0 0;">${companyConfig.subtitle}</p>
          </div>

          <div style="padding:20px;">
            <h2 style="color:#2c3e50;">Invoice #${orderId}</h2>
            <p><strong>Date:</strong> ${new Date(orderData.order_date).toLocaleDateString()}</p>
            <p><strong>Customer Phone:</strong> ${orderData.customer_phone || "-"}</p>
            <p><strong>Customer Email:</strong> ${orderData.customer_email || "-"}</p>

            <h3 style="margin-top:20px; color:#2c3e50;">Items</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
              <thead style="background:#FEEEDF; color:#2c3e50;">
                <tr>
                  <th style="padding:10px; border:1px solid #ddd; text-align:left;">Item</th>
                  <th style="padding:10px; border:1px solid #ddd; text-align:left;">SKU</th>
                  <th style="padding:10px; border:1px solid #ddd; text-align:center;">Qty</th>
                  <th style="padding:10px; border:1px solid #ddd; text-align:right;">Price</th>
                  <th style="padding:10px; border:1px solid #ddd; text-align:right;">Tax</th>
                  <th style="padding:10px; border:1px solid #ddd; text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <p style="margin-top:20px; text-align:right; font-size:16px; color:#2c3e50;">
              <strong>Subtotal:</strong> $${Number(orderData.order_subtotal || 0).toFixed(2)}<br/>
              <strong>Grand Total:</strong> $${Number(orderData.order_grandtotal || 0).toFixed(2)}
            </p>
          </div>

          <div style="background:#FEEEDF; padding:20px; text-align:center; color:#2c3e50;">
            <p style="margin:0;">${companyConfig.footer}</p>
            <small style="color:#555;">${companyConfig.footerText}</small>
            <div style="margin-top:15px;">
              <img src="cid:qr-code" alt="QR Code" style="width:100px; height:100px; display:block; margin:0 auto;" />
              <p style="margin-top:8px; font-size:12px; color:#2c3e50;">
                Scan the QR or click 
                <a style="text-decoration: underline; color: #2c3e50;" href="${process.env.NEXT_PUBLIC_BASE_URL}/invoice?id=${orderData?.order_key}&warehouse=${warehouseId}">
                  Here
                </a> 
                to give feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // --- Attachments ---
    const attachments = [
      {
        filename: `receipt-${orderId}.pdf`,
        content: pdf,
        encoding: "base64",
      },
      {
        filename: "qrcode.png",
        content: qrCodeBuffer,
        cid: "qr-code",
      },
    ];

    if (logoBase64) {
      attachments.push({
        filename: "logo.png",
        content: Buffer.from(logoBase64.split(",")[1], "base64"),
        cid: "company-logo",
      });
    }

    // --- Send the Email ---
   const result = await transporter.sendMail({
      from: `"POS Receipt" <${smtp_config?.email_from}>`,
      to: email,
      subject: `Your Order Receipt - ${orderId}`,
      text: `Hello, please find attached your receipt for order ${orderId}.`,
      html: htmlTemplate,
      attachments,
    });
    const emailResult = result.json()
    return NextResponse.json({ success: true, emailResult: emailResult });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
