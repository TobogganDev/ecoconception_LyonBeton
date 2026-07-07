import { z } from "zod";
import { TRPCError } from "@trpc/server";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { randomBytes } from "crypto";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const verifyCodeSchema = z.object({
  code: z.string().min(6, "Code requis").max(6, "Code invalide"),
});

const verifyCodePublicSchema = z.object({
  code: z.string().min(6, "Code requis").max(8, "Code trop long"),
  userId: z.string().min(1, "User ID requis"),
});

const enableTwoFactorSchema = z.object({
  code: z.string().min(6, "Code requis").max(6, "Code invalide"),
  secret: z.string().min(1, "Secret requis"),
});

const disableTwoFactorSchema = z.object({
  code: z.string().min(6, "Code requis").max(6, "Code invalide"),
});

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

export const twoFactorRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        twoFactorEnabled: true,
        backupCodes: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    return {
      enabled: user.twoFactorEnabled,
      hasBackupCodes: user.backupCodes.length > 0,
      backupCodesCount: user.backupCodes.length,
    };
  }),

  generateSecret: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { name: true, email: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    const secret = speakeasy.generateSecret({
      name: user.email,
      issuer: "Lyon Béton",
      length: 32,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    };
  }),

  enable: protectedProcedure
    .input(enableTwoFactorSchema)
    .mutation(async ({ ctx, input }) => {
      const verified = speakeasy.totp.verify({
        secret: input.secret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code de vérification invalide",
        });
      }

      const backupCodes = generateBackupCodes();

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: input.secret,
          backupCodes: backupCodes,
        },
      });

      return {
        message: "Authentification à deux facteurs activée avec succès",
        backupCodes: backupCodes,
      };
    }),

  disable: protectedProcedure
    .input(disableTwoFactorSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
      });

      if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "L'authentification à deux facteurs n'est pas activée",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code de vérification invalide",
        });
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
        },
      });

      return {
        message: "Authentification à deux facteurs désactivée avec succès",
      };
    }),

  verify: protectedProcedure
    .input(verifyCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
          backupCodes: true,
        },
      });

      if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "L'authentification à deux facteurs n'est pas activée",
        });
      }

      if (user.backupCodes.includes(input.code)) {
        const updatedBackupCodes = user.backupCodes.filter(
          (code) => code !== input.code,
        );

        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { backupCodes: updatedBackupCodes },
        });

        return {
          verified: true,
          message: "Code de secours utilisé avec succès",
          isBackupCode: true,
        };
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code de vérification invalide",
        });
      }

      return {
        verified: true,
        message: "Code vérifié avec succès",
        isBackupCode: false,
      };
    }),

  regenerateBackupCodes: protectedProcedure
    .input(verifyCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });

      if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "L'authentification à deux facteurs n'est pas activée",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code de vérification invalide",
        });
      }

      const newBackupCodes = generateBackupCodes();

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { backupCodes: newBackupCodes },
      });

      return {
        message: "Nouveaux codes de secours générés",
        backupCodes: newBackupCodes,
      };
    }),

  verifyPublic: publicProcedure
    .input(verifyCodePublicSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
          backupCodes: true,
        },
      });

      if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "L'authentification à deux facteurs n'est pas activée",
        });
      }

      if (user.backupCodes.includes(input.code)) {
        const updatedBackupCodes = user.backupCodes.filter(
          (code) => code !== input.code,
        );

        await ctx.db.user.update({
          where: { id: input.userId },
          data: { backupCodes: updatedBackupCodes },
        });

        return {
          verified: true,
          message: "Code de secours utilisé avec succès",
          isBackupCode: true,
        };
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: input.code,
        window: 2,
      });

      if (!verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code de vérification invalide",
        });
      }

      return {
        verified: true,
        message: "Code vérifié avec succès",
        isBackupCode: false,
      };
    }),
});
