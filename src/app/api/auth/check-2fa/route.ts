import { type NextRequest } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "~/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email et mot de passe requis" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
        emailVerified: true,
      },
    });

    if (!user?.passwordHash) {
      return Response.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    if (user.emailVerified === null) {
      return Response.json({ error: "Email non vérifié" }, { status: 400 });
    }

    const isPasswordValid = await compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return Response.json(
        { error: "Mot de passe incorrect" },
        { status: 401 },
      );
    }

    return Response.json({
      userId: user.id,
      twoFactorRequired: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("Erreur check-2fa:", error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
