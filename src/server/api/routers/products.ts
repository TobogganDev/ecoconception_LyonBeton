import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const productsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { isDefault: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return products;
  }),

  getLastProducts: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      include: {
        prices: {
          where: { isActive: true },
          orderBy: { isDefault: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
    return products;
  }),

  productByIdentifier: publicProcedure
    .input(z.object({ identifier: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { identifier: input.identifier },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { isDefault: "desc" },
          },
        },
      });
      return product ?? null;
    }),

  productsByIdentifiers: publicProcedure
    .input(z.object({ identifiers: z.array(z.string().min(1)).min(1) }))
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: { identifier: { in: input.identifiers } },
        include: {
          prices: {
            where: { isActive: true },
            orderBy: { isDefault: "desc" },
          },
        },
      });
      return products;
    }),
});
