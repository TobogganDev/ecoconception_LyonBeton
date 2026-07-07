import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, adminProcedure, createTRPCContext } from "../trpc";

const promoteUserSchema = z.object({
  userId: z.string().min(1, "User ID requis"),
  role: z.enum(["USER", "ADMIN", "PREMIUM"]),
});

const createProductSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  subtitle: z.string().min(1, "Sous-titre requis"),
  description: z.string().min(1, "Description requise"),
  price: z.number().positive("Prix doit être positif"),
  ref: z.string().min(1, "Référence requise"),
  identifier: z.string().min(1, "Identifiant requis"),
  imgNumber: z.number().positive("Nombre d'images requis"),
});

const updateProductSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Titre requis"),
  subtitle: z.string().min(1, "Sous-titre requis"),
  description: z.string().min(1, "Description requise"),
  price: z.number().positive("Prix doit être positif"),
  ref: z.string().min(1, "Référence requise"),
  identifier: z.string().min(1, "Identifiant requis"),
  imgNumber: z.number().positive("Nombre d'images requis"),
});

async function logAuditAction(
  ctx: Awaited<ReturnType<typeof createTRPCContext>>,
  action: string,
  entity: string,
  entityId: string,
  details?: Record<string, unknown>,
) {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session utilisateur requise pour l'audit",
    });
  }

  await ctx.db.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      adminId: ctx.session.user.id,
      details: details ? (JSON.parse(JSON.stringify(details)) as object) : {},
    },
  });
}

export const adminRouter = createTRPCRouter({
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
      orderBy: { email: "asc" },
    });
  }),

  promoteUser: adminProcedure
    .input(promoteUserSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Utilisateur non trouvé",
        });
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      await logAuditAction(ctx, "ROLE_CHANGE", "USER", input.userId, {
        previousRole: user.role,
        newRole: input.role,
        userEmail: user.email,
      });

      return {
        message: `Rôle mis à jour pour ${user.email}`,
        user: updatedUser,
      };
    }),

  getAllProducts: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  createProduct: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const existingProduct = await ctx.db.product.findFirst({
        where: {
          OR: [{ ref: input.ref }, { identifier: input.identifier }],
        },
      });

      if (existingProduct) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Un produit avec cette référence ou cet identifiant existe déjà",
        });
      }

      const product = await ctx.db.product.create({
        data: input,
      });

      await logAuditAction(ctx, "CREATE", "PRODUCT", product.id.toString(), {
        productTitle: product.title,
        productRef: product.ref,
      });

      return {
        message: "Produit créé avec succès",
        product,
      };
    }),

  updateProduct: adminProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const existingProduct = await ctx.db.product.findUnique({
        where: { id: input.id },
      });

      if (!existingProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produit non trouvé",
        });
      }

      const product = await ctx.db.product.update({
        where: { id: input.id },
        data: {
          title: input.title,
          subtitle: input.subtitle,
          description: input.description,
          price: input.price,
          ref: input.ref,
          identifier: input.identifier,
          imgNumber: input.imgNumber,
        },
      });

      await logAuditAction(ctx, "UPDATE", "PRODUCT", product.id.toString(), {
        productTitle: product.title,
        productRef: product.ref,
        changes: input,
      });

      return {
        message: "Produit mis à jour avec succès",
        product,
      };
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produit non trouvé",
        });
      }

      // 1) Remove the product from all carts and orders
      await ctx.db.$transaction([
        ctx.db.cartItem.deleteMany({ where: { productId: product.id } }),
        ctx.db.orderItem.deleteMany({ where: { productId: product.id } }),
        ctx.db.price.deleteMany({ where: { productId: product.id } }),
      ]);

      // 2) Remove product images from Cloudinary (products/{identifier}_{index})
      try {
        const publicIds = Array.from(
          { length: product.imgNumber },
          (_, i) => `products/${product.identifier}_${i}`,
        );
        const { v2: cld } = await import("cloudinary");
        await cld.api.delete_resources(publicIds, { resource_type: "image" });
      } catch (_e) {
        // Continue even if Cloudinary deletion fails
      }

      // 3) Finally delete the product
      await ctx.db.product.delete({ where: { id: product.id } });

      await logAuditAction(ctx, "DELETE", "PRODUCT", product.id.toString(), {
        productTitle: product.title,
        productRef: product.ref,
      });

      return {
        message: "Produit supprimé avec succès",
      };
    }),

  getAuditLogs: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.auditLog.findMany({
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });
    }),
});
