import { NextResponse } from "next/server";
import { prisma } from "~/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 400 },
      );
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      });

      return NextResponse.json({ error: "Token expiré" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: { token },
    });

    return NextResponse.redirect(new URL("/auth/email-verified", request.url));
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
