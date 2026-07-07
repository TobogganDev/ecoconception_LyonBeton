import { NextResponse } from "next/server";
import { generateVerificationEmailTemplate, sendEmail } from "~/lib/email";

export async function GET() {
  const { text, html } = generateVerificationEmailTemplate(
    "https://google.com",
    "brv",
  );

  try {
    await sendEmail({
      to: "test@example.com",
      subject: "Test email from Next.js",
      text: text,
      html: html,
    });

    return NextResponse.json(
      { message: "Email de test envoyé avec succès" },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = (error as Error).message;
    return NextResponse.json(
      {
        error: "Erreur lors de l'envoi de l'email de test",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
