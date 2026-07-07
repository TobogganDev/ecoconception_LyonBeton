import { z } from "zod";
import { compare, hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z
    .string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
});

export const accountRouter = createTRPCRouter({
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
        },
      });

      return {
        message: "Profil mis à jour avec succès",
        user: updatedUser,
      };
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { passwordHash: true },
      });

      if (!user?.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Impossible de changer le mot de passe pour ce compte",
        });
      }

      const isCurrentPasswordValid = await compare(
        input.currentPassword,
        user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Mot de passe actuel incorrect",
        });
      }

      const newPasswordHash = await hash(input.newPassword, 12);

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { passwordHash: newPasswordHash },
      });

      return {
        message: "Mot de passe changé avec succès",
      };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Utilisateur non trouvé",
      });
    }

    return user;
  }),
});
