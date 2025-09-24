import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { email, orderId, orderData, pdf, pdfResponse } = await req.json();

    // Transporter
    let transporter = nodemailer.createTransport({
      host: process.env.NEXT_SMTP_HOST,
      port: process.env.NEXT_SMTP_PORT || 587,
      secure: process.env.NEXT_SMTP_PORT == 465,
      auth: {
        user: process.env.NEXT_SMTP_USER,
        pass: process.env.NEXT_SMTP_PASS,
      },
    });

    // Convert logo to base64
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    let logoBase64 = '';
    try {
      console.log('Logo path:', logoPath);
      console.log('File exists:', fs.existsSync(logoPath));
      
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        console.log('Logo loaded successfully, length:', logoBase64.length);
      } else {
        console.log('Logo file not found');
      }
    } catch (err) {
      console.error('Logo error:', err.message);
      logoBase64 = '';
    }

    // ✅ Fallback config
    const companyConfig = pdfResponse || {
      title: "Receipt",
      subtitle: "Thank You For Your Purchase",
      logo: logoBase64,
      companyName: "Store",
      footer: "Thank you for shopping with us!",
      footerText: "Please come again",
    };

    console.log('Company config logo exists:', !!companyConfig.logo);
    console.log('Logo preview:', companyConfig.logo.substring(0, 50) + '...');

    // ✅ Generate QR code (Buffer for attachment)
    const qrCodeDataURL = await QRCode.toDataURL(
      `${process.env.NEXT_PUBLIC_BASE_URL}/feedback?id=${orderData?.order_key}`
    );

    // ✅ Build items table
    const itemsHtml = orderData.items
      .map(
        (item) => `
        <tr>
          <td style="padding:10px; border:1px solid #ddd;">${item.product_name}</td>
          <td style="padding:10px; border:1px solid #ddd;">${item.product_sku}</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:center;">${item.qty}</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">$${item.price}</td>
          <td style="padding:10px; border:1px solid #ddd; text-align:right;">$${item.row_total}</td>
        </tr>
      `
      )
      .join("");

    // ✅ Styled HTML Template
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:30px; color:#333; line-height:1.6;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo -->
          <div style="background:#FEEEDF; padding:20px; text-align:center;">
            ${companyConfig.logo ? `<img src="cid:company-logo" alt="Company Logo" style="max-height:60px; max-width:200px; margin-bottom:10px; display:block; margin-left:auto; margin-right:auto; border:none;" />` : ''}
            <h1 style="color:#2c3e50; margin:0; font-size:22px;">${companyConfig.title}</h1>
            <p style="color:#555; margin:5px 0 0;">${companyConfig.subtitle}</p>
          </div>

          <!-- Order Info -->
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
                  <th style="padding:10px; border:1px solid #ddd; text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <p style="margin-top:20px; text-align:right; font-size:16px; color:#2c3e50;">
              <strong>Subtotal:</strong> $${orderData.order_subtotal}<br/>
              <strong>Grand Total:</strong> $${orderData.order_grandtotal}
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#FEEEDF; padding:20px; text-align:center; color:#2c3e50;">
            <p style="margin:0;">${companyConfig.footer}</p>
            <small style="color:#555;">${companyConfig.footerText}</small>

            <!-- QR Code -->
            <div style="margin-top:15px;">
              <img src="${qrCodeDataURL}" alt="QR Code" style="width:100px; height:100px; display:block; margin:0 auto;" />
              <p style="margin-top:8px; font-size:12px; color:#2c3e50;">
                Scan the QR or click <a style="text-decoration: underline; color: #2c3e50;" href="${process.env.NEXT_PUBLIC_BASE_URL}/feedback?id=${orderData?.order_key}">Here</a> to give feedback
              </p>
            </div>
          </div>

        </div>
      </div>
    `;

    // ✅ Attachments
    const attachments = [
      {
        filename: `receipt-${orderId}.pdf`,
        content: pdf,
        encoding: "base64",
      }
    ];

    // Add logo as attachment if it exists
    if (logoBase64) {
      const logoBuffer = Buffer.from(logoBase64.split(',')[1], 'base64');
      attachments.push({
        filename: 'logo.png',
        content: logoBuffer,
        cid: 'company-logo'
      });
    }

    await transporter.sendMail({
      from: `"POS Receipt" <${process.env.NEXT_EMAIL_FROM}>`,
      to: email,
      subject: `Your Order Receipt - ${orderId}`,
      text: `Hello, please find attached your receipt for order ${orderId}.`,
      html: htmlTemplate,
      attachments,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}