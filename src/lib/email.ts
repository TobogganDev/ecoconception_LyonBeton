import nodemailer from "nodemailer";
import EmailVerification from "~/app/EmailTemplates/EmailVerification";
import OrderConfirmation from "~/app/EmailTemplates/OrderConfirmation";
import PaymentFailed from "~/app/EmailTemplates/PaymentFailed";
import PasswordReset from "~/app/EmailTemplates/PasswordReset";
import PaymentConfirmation from "~/app/EmailTemplates/PaymentConfirmation";

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    console.log("📧 Configuration email:", {
      host: process.env.EMAIL_SERVER_HOST ?? "localhost",
      port: process.env.EMAIL_SERVER_PORT ?? "1025",
      from: process.env.EMAIL_FROM ?? "noreply@localhost",
      to,
      subject,
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST ?? "localhost",
      port: parseInt(process.env.EMAIL_SERVER_PORT ?? "1025"),
      secure: false,
      ignoreTLS: true,
      auth: process.env.EMAIL_SERVER_USER
        ? {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          }
        : undefined,
    });

    console.log("🔗 Test de connexion SMTP...");
    await transporter.verify();
    console.log("✅ Connexion SMTP réussie");

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@localhost",
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email envoyé avec succès:", {
      messageId: result.messageId,
      response: result.response,
    });
  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    throw new Error("Failed to send email");
  }
}

export function generateVerificationEmailTemplate(
  verificationUrl: string,
  userName: string,
) {
  return EmailVerification({ userName, verificationUrl });
}

export function generateOrderConfirmationEmailTemplate(
  orderDetails: {
    id: string;
    total: number;
    items: Array<{
      title: string;
      subtitle: string;
      quantity: number;
      price: number;
    }>;
  },
  customerName: string,
) {
  return OrderConfirmation({ orderDetails, customerName });
}

export function generatePaymentFailedEmailTemplate(
  orderDetails: {
    id?: string;
    total?: number;
    customerEmail: string;
  },
  customerName: string,
) {
  return PaymentFailed({ orderDetails, customerName });
}

export function generatePasswordResetEmailTemplate(
  resetUrl: string,
  userName: string,
) {
  return PasswordReset({ resetUrl, userName });
}

export function generatePaymentConfirmationEmailTemplate(
  orderId: string,
  total: number,
  customerName: string,
) {
  return PaymentConfirmation({ orderId, total, customerName });
}
