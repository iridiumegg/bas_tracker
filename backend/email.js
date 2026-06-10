import nodemailer from "nodemailer";

const FROM = process.env.MAIL_FROM || process.env.SMTP_USER || "BAS Workspace <no-reply@localhost>";

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  console.log(`Email notifications enabled via ${process.env.SMTP_HOST}`);
} else {
  console.log("SMTP not configured — email notifications disabled (set SMTP_HOST to enable)");
}

export const emailEnabled = () => transporter !== null;

export async function sendNotification(recipients, subject, text) {
  if (!transporter || recipients.length === 0) return;
  try {
    await transporter.sendMail({ from: FROM, bcc: recipients, subject, text });
  } catch (e) {
    console.error("Email send failed:", e.message);
  }
}
