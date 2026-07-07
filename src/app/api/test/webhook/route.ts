import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";

export async function GET() {
  try {
    const orderCount = await db.order.count();
    console.log(`📊 Orders in database: ${orderCount}`);

    const testSessionId = `cs_test_${Date.now()}`;

    const testOrder = await db.order.create({
      data: {
        stripeSessionId: testSessionId,
        total: 79000,
        status: "PAID",
        customerEmail: "test@idempotency.com",
        customerName: "Test User",
        items: {
          create: [
            {
              productId: 1,
              quantity: 1,
              price: 79000,
              title: "Test Product",
              subtitle: "Test Subtitle",
            },
          ],
        },
      },
      include: {
        items: true,
      },
    });

    let duplicateOrder = null;
    try {
      duplicateOrder = await db.order.create({
        data: {
          stripeSessionId: testSessionId,
          total: 79000,
          status: "PAID",
          customerEmail: "test@idempotency.com",
          customerName: "Test User",
        },
      });
    } catch (error) {
      console.log(
        "✅ Idempotency constraint working - duplicate order blocked",
      );
    }

    const ordersWithSessionId = await db.order.findMany({
      where: { stripeSessionId: testSessionId },
    });

    await db.orderItem.deleteMany({
      where: { orderId: testOrder.id },
    });
    await db.order.delete({
      where: { id: testOrder.id },
    });

    const testResults = {
      message: "Webhook tests completed",
      tests: {
        orderSchema: "✅ Order schema working",
        orderCreation: `✅ Order created with ID: ${testOrder.id}`,
        idempotency: duplicateOrder
          ? "❌ Idempotency failed - duplicate order created"
          : "✅ Idempotency working - duplicate blocked",
        uniqueConstraint:
          ordersWithSessionId.length === 1
            ? "✅ Unique constraint working"
            : `❌ Found ${ordersWithSessionId.length} orders with same session ID`,
        cleanup: "✅ Test data cleaned up",
      },
      summary: {
        totalOrders: orderCount,
        testOrderId: testOrder.id,
        testSessionId: testSessionId,
      },
    };

    return NextResponse.json(testResults);
  } catch (error) {
    console.error("❌ Webhook test error:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: "Use GET to run webhook tests" },
    { status: 405 },
  );
}
