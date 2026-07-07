import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const cartRouter = createTRPCRouter({
  addToCart: protectedProcedure
    .input(
      z.object({
        identifier: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const product = await ctx.db.product.findUnique({
        where: { identifier: input.identifier },
        select: { id: true },
      });
      if (!product) {
        throw new Error("Produit introuvable");
      }

      const existingCart = await ctx.db.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      const cart =
        existingCart ??
        (await ctx.db.cart.create({
          data: { userId },
        }));

      const compositeKey = {
        cartId_productId: { cartId: cart.id, productId: product.id },
      } as const;
      const existingItem = await ctx.db.cartItem.findUnique({
        where: compositeKey,
      });

      const item = existingItem
        ? await ctx.db.cartItem.update({
            where: compositeKey,
            data: { quantity: existingItem.quantity + input.quantity },
          })
        : await ctx.db.cartItem.create({
            data: {
              cartId: cart.id,
              productId: product.id,
              quantity: input.quantity,
            },
          });

      return { cartId: cart.id, item };
    }),

  updateItem: protectedProcedure
    .input(
      z.object({ identifier: z.string().min(1), quantity: z.number().int() }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const product = await ctx.db.product.findUnique({
        where: { identifier: input.identifier },
        select: { id: true },
      });
      if (!product) throw new Error("Produit introuvable");

      const cart =
        (await ctx.db.cart.findUnique({ where: { userId } })) ??
        (await ctx.db.cart.create({ data: { userId } }));

      const where = {
        cartId_productId: { cartId: cart.id, productId: product.id },
      } as const;
      if (input.quantity <= 0) {
        await ctx.db.cartItem.delete({ where }).catch(() => undefined);
        return { ok: true };
      }

      await ctx.db.cartItem.upsert({
        where,
        update: { quantity: input.quantity },
        create: {
          cartId: cart.id,
          productId: product.id,
          quantity: input.quantity,
        },
      });
      return { ok: true };
    }),

  removeItem: protectedProcedure
    .input(z.object({ identifier: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const product = await ctx.db.product.findUnique({
        where: { identifier: input.identifier },
        select: { id: true },
      });
      if (!product) return { ok: true };

      const cart = await ctx.db.cart.findUnique({ where: { userId } });
      if (!cart) return { ok: true };

      const where = {
        cartId_productId: { cartId: cart.id, productId: product.id },
      } as const;
      await ctx.db.cartItem.delete({ where }).catch(() => undefined);
      return { ok: true };
    }),

  mergeGuestCart: protectedProcedure
    .input(
      z.object({
        items: z
          .array(
            z.object({
              identifier: z.string().min(1),
              quantity: z.number().int().min(1),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const identifiers = input.items.map((i) => i.identifier);
      const products = await ctx.db.product.findMany({
        where: { identifier: { in: identifiers } },
        select: { id: true, identifier: true },
      });
      const identifierToId = new Map(
        products.map((p) => [p.identifier, p.id] as const),
      );

      const existingCart = await ctx.db.cart.findUnique({ where: { userId } });
      const cart =
        existingCart ?? (await ctx.db.cart.create({ data: { userId } }));

      await ctx.db.$transaction(
        input.items
          .filter((i) => identifierToId.has(i.identifier))
          .map((i) => {
            const productId = identifierToId.get(i.identifier)!;
            const where = {
              cartId_productId: { cartId: cart.id, productId },
            } as const;
            return ctx.db.cartItem.upsert({
              where,
              update: { quantity: { increment: i.quantity } },
              create: { cartId: cart.id, productId, quantity: i.quantity },
            });
          }),
      );

      const updated = await ctx.db.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      return updated;
    }),

  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const cart = await ctx.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { prices: true },
            },
          },
        },
      },
    });
    return (
      cart ?? {
        id: 0,
        userId,
        items: [] as Array<{
          id: number;
          cartId: number;
          productId: number;
          quantity: number;
          product: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            title: string;
            subtitle: string;
            description: string;
            identifier: string;
            imgNumber: number;
            ref: string;
            stripeProductId: string | null;
            prices: Array<{
              id: number;
              productId: number;
              stripePriceId: string;
              amount: number;
              currency: string;
              type: string;
              interval: string | null;
              isActive: boolean;
              isDefault: boolean;
              createdAt: Date;
              updatedAt: Date;
            }>;
          };
        }>,
      }
    );
  }),
});
