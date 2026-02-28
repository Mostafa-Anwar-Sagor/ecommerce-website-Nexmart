import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const nexmartBrand = `
  <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#ee4d2d,#ff7038);padding:24px;text-align:center;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">NexMart</h1>
      <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px;">AI-Powered E-Commerce Platform</p>
    </div>
`;

export const sendWelcomeEmail = async (to: string, name: string) => {
  const html = `${nexmartBrand}
    <div style="padding:32px;background:#fff;">
      <h2 style="color:#333;">Welcome to NexMart, ${name}! 🎉</h2>
      <p style="color:#666;line-height:1.6;">We're thrilled to have you join the NexMart community. Discover millions of products with AI-powered personalization.</p>
      <a href="${process.env.CLIENT_URL}" style="display:inline-block;background:#ee4d2d;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Start Shopping</a>
    </div>
  </div>`;

  await sendEmail({ to, subject: `Welcome to NexMart, ${name}!`, html });
};

export const sendOrderConfirmationEmail = async (to: string, orderDetails: { orderId: string; total: number; items: Array<{ name: string; quantity: number; price: number }> }) => {
  const itemsList = orderDetails.items.map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0;">${i.name}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">x${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('');

  const html = `${nexmartBrand}
    <div style="padding:32px;background:#fff;">
      <h2 style="color:#333;">Order Confirmed! ✅</h2>
      <p style="color:#666;">Your order <strong>#${orderDetails.orderId.slice(0, 8).toUpperCase()}</strong> has been confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:#f9f9f9;"><th style="padding:8px;text-align:left;">Item</th><th style="padding:8px;text-align:right;">Qty</th><th style="padding:8px;text-align:right;">Price</th></tr></thead>
        <tbody>${itemsList}</tbody>
        <tfoot><tr><td colspan="2" style="padding:8px;font-weight:700;">Total</td><td style="padding:8px;font-weight:700;text-align:right;color:#ee4d2d;">$${orderDetails.total.toFixed(2)}</td></tr></tfoot>
      </table>
      <a href="${process.env.CLIENT_URL}/orders" style="display:inline-block;background:#ee4d2d;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Track Order</a>
    </div>
  </div>`;

  await sendEmail({ to, subject: 'NexMart Order Confirmed!', html });
};

export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = `${nexmartBrand}
    <div style="padding:32px;background:#fff;">
      <h2 style="color:#333;">Reset Your Password 🔐</h2>
      <p style="color:#666;">Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#ee4d2d;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Reset Password</a>
      <p style="color:#999;font-size:12px;margin-top:16px;">If you didn't request this, ignore this email.</p>
    </div>
  </div>`;

  await sendEmail({ to, subject: 'Reset Your NexMart Password', html });
};

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {
    await transporter.sendMail({
      from: `"NexMart" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent: ${subject} → ${to}`);
  } catch (error) {
    logger.error('Email send failed', { error, to, subject });
    // Don't throw — email failures shouldn't break the main flow
  }
};
