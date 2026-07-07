import { z } from "zod";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  sendEmail,
  generateVerificationEmailTemplate,
  generatePasswordResetEmailTemplate,
} from "~/lib/email";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

const emailVerificationRequestSchema = z.object({
  email: z.string().email("Email invalide"),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email("Email invalide"),
});

const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password, name } = input;

      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Cet email est déjà utilisé",
        });
      }

      const passwordHash = await hash(password, 12);

      await ctx.db.user.create({
        data: {
          email,
          name,
          passwordHash,
        },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await ctx.db.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      try {
        const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        const verificationUrl = `${baseUrl}/api/auth/email/verification/verify?token=${token}`;

        const { text, html } = generateVerificationEmailTemplate(
          verificationUrl,
          name,
        );

        await sendEmail({
          to: email,
          subject: "Vérifiez votre adresse email",
          text,
          html,
        });

        return {
          message:
            "Inscription réussie. Vérifiez votre email pour activer votre compte.",
        };
      } catch (emailError) {
        console.error("Erreur envoi email inscription:", emailError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Inscription réussie, mais l'email de vérification n'a pas pu être envoyé",
        });
      }
    }),

  requestEmailVerification: publicProcedure
    .input(emailVerificationRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aucun utilisateur trouvé avec cet email",
        });
      }

      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cet email est déjà vérifié",
        });
      }

      await ctx.db.verificationToken.deleteMany({
        where: { identifier: email },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await ctx.db.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const verificationUrl = `${baseUrl}/api/auth/email/verification/verify?token=${token}`;

      const { text, html } = generateVerificationEmailTemplate(
        verificationUrl,
        user.name,
      );

      await sendEmail({
        to: email,
        subject: "Vérifiez votre adresse email",
        text,
        html,
      });

      return {
        message: "Email de vérification envoyé",
      };
    }),

  requestPasswordReset: publicProcedure
    .input(passwordResetRequestSchema)
    .mutation(async ({ ctx, input }) => {
      const { email } = input;

      const user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        return {
          message:
            "Si cet email existe dans notre base de données, vous recevrez un email de réinitialisation",
        };
      }

      await ctx.db.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await ctx.db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expires,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      const { text, html } = generatePasswordResetEmailTemplate(
        resetUrl,
        user.name,
      );

      await sendEmail({
        to: email,
        subject: "Réinitialisation de votre mot de passe",
        text,
        html,
      });

      return {
        message:
          "Si cet email existe dans notre base de données, vous recevrez un email de réinitialisation",
      };
    }),

  confirmPasswordReset: publicProcedure
    .input(passwordResetConfirmSchema)
    .mutation(async ({ ctx, input }) => {
      const { token, password } = input;

      const resetToken = await ctx.db.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken || resetToken.expires < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Token invalide ou expiré",
        });
      }

      const passwordHash = await hash(password, 12);

      await ctx.db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await ctx.db.passwordResetToken.delete({
        where: { token },
      });

      return {
        message: "Mot de passe réinitialisé avec succès",
      };
    }),
});
