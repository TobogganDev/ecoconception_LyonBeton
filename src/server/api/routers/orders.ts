import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const ordersRouter = createTRPCRouter({
  getUserOrders: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z
          .enum([
            "PENDING",
            "PAID",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, startDate, endDate, status } = input;
      const skip = (page - 1) * limit;

      const whereClause = {
        userId: ctx.session.user.id,
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        ...(status && { status }),
      };

      const [orders, totalCount] = await Promise.all([
        ctx.db.order.findMany({
          where: whereClause,
          include: {
            items: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.order.count({ where: whereClause }),
      ]);

      return {
        orders,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    }),

  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input.orderId,
          userId: ctx.session.user.id,
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("Commande introuvable");
      }

      return order;
    }),

  getAllOrders: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z
          .enum([
            "PENDING",
            "PAID",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ])
          .optional(),
        customerEmail: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, startDate, endDate, status, customerEmail } = input;
      const skip = (page - 1) * limit;

      const whereClause = {
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        ...(status && { status }),
        ...(customerEmail && {
          customerEmail: {
            contains: customerEmail,
            mode: "insensitive" as const,
          },
        }),
      };

      const [orders, totalCount] = await Promise.all([
        ctx.db.order.findMany({
          where: whereClause,
          include: {
            items: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.order.count({ where: whereClause }),
      ]);

      return {
        orders,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    }),

  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "PENDING",
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
          "REFUNDED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.update({
        where: { id: input.orderId },
        data: { status: input.status },
        include: {
          items: true,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          action: "UPDATE_ORDER_STATUS",
          entity: "Order",
          entityId: input.orderId,
          adminId: ctx.session.user.id,
          details: {
            newStatus: input.status,
            orderId: input.orderId,
          },
        },
      });

      return order;
    }),

  getOrderStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      recentOrders,
    ] = await Promise.all([
      ctx.db.order.count(),
      ctx.db.order.aggregate({
        where: {
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
        _sum: { total: true },
      }),
      ctx.db.order.count({ where: { status: "PENDING" } }),
      ctx.db.order.count({ where: { status: "DELIVERED" } }),
      ctx.db.order.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          },
        },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      pendingOrders,
      completedOrders,
      recentOrders,
    };
  }),
});
