import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "~/server/db";
import {
  sendEmail,
  generateOrderConfirmationEmailTemplate,
  generatePaymentFailedEmailTemplate,
  generatePaymentConfirmationEmailTemplate,
} from "~/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      console.error("❌ Webhook signature verification failed:", error);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`🔔 Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "charge.succeeded":
        await handleChargeSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
        console.log(`🤷‍♂️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  try {
    const existingOrder = await db.order.findUnique({
      where: { stripeSessionId: session.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (existingOrder) {
      // Update existing PENDING order to PAID
      if (existingOrder.status === "PENDING") {
        // Get the payment intent ID - it could be a string or object
        let paymentIntentId = null;
        if (typeof session.payment_intent === "string") {
          paymentIntentId = session.payment_intent;
        } else if (
          session.payment_intent &&
          typeof session.payment_intent === "object"
        ) {
          paymentIntentId = session.payment_intent.id;
        }

        const updatedOrder = await db.order.update({
          where: { id: existingOrder.id },
          data: {
            status: "PAID",
            ...(paymentIntentId && { stripePaymentId: paymentIntentId }),
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        try {
          const emailTemplate = generateOrderConfirmationEmailTemplate(
            {
              id: updatedOrder.id,
              total: updatedOrder.total,
              items: updatedOrder.items.map((item) => ({
                title: item.title,
                subtitle: item.subtitle,
                quantity: item.quantity,
                price: item.price,
              })),
            },
            updatedOrder.customerName ?? "Client",
          );

          await sendEmail({
            to: updatedOrder.customerEmail,
            subject: `Confirmation de commande #${updatedOrder.id}`,
            text: emailTemplate.text,
            html: emailTemplate.html,
          });

          // Send payment confirmation email too
          try {
            const paymentTemplate = generatePaymentConfirmationEmailTemplate(
              updatedOrder.id,
              updatedOrder.total,
              updatedOrder.customerName ?? "Client",
            );

            await sendEmail({
              to: updatedOrder.customerEmail,
              subject: `Paiement confirmé #${updatedOrder.id}`,
              text: paymentTemplate.text,
              html: paymentTemplate.html,
            });
          } catch (emailError) {
            console.error(
              "❌ Failed to send payment confirmation email:",
              emailError,
            );
          }
        } catch (emailError) {
          console.error("❌ Failed to send confirmation email:", emailError);
        }

        return;
      } else {
        console.log(
          `⚠️ Order ${existingOrder.id} already processed (status: ${existingOrder.status}), skipping...`,
        );
        return;
      }
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ["data.price.product"],
    });

    if (!lineItems.data.length) {
      console.error("❌ No line items found in checkout session");
      return;
    }

    const total = session.amount_total ?? 0;

    let paymentIntentId = null;
    if (typeof session.payment_intent === "string") {
      paymentIntentId = session.payment_intent;
    } else if (
      session.payment_intent &&
      typeof session.payment_intent === "object"
    ) {
      paymentIntentId = session.payment_intent.id;
    }

    const orderData = {
      stripeSessionId: session.id,
      ...(paymentIntentId && { stripePaymentId: paymentIntentId }),
      total,
      status: "PAID" as const,
      customerEmail:
        session.customer_details?.email ?? session.customer_email ?? "",
      customerName: session.customer_details?.name ?? "Client",
      userId: null,
    };

    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: orderData,
      });

      const orderItems = [];

      for (const lineItem of lineItems.data) {
        if (!lineItem.price?.product) continue;

        const stripeProduct = lineItem.price.product as Stripe.Product;

        let product = null;
        if (stripeProduct.id) {
          product = await tx.product.findFirst({
            where: { stripeProductId: stripeProduct.id },
          });
        }

        if (!product && stripeProduct.metadata?.identifier) {
          product = await tx.product.findFirst({
            where: { identifier: stripeProduct.metadata.identifier },
          });
        }

        if (!product) {
          console.warn(
            `⚠️ Product not found for Stripe product ${stripeProduct.id}, skipping item`,
          );
          continue;
        }

        const itemData = {
          orderId: newOrder.id,
          productId: product.id,
          quantity: lineItem.quantity ?? 1,
          price: lineItem.price?.unit_amount ?? 0,
          title: product.title,
          subtitle: product.subtitle,
        };

        await tx.orderItem.create({
          data: itemData,
        });

        orderItems.push({
          ...itemData,
          title: itemData.title,
          subtitle: itemData.subtitle,
        });
      }

      return { order: newOrder, items: orderItems };
    });

    try {
      const emailTemplate = generateOrderConfirmationEmailTemplate(
        {
          id: order.order.id,
          total: order.order.total,
          items: order.items,
        },
        order.order.customerName ?? "Client",
      );

      await sendEmail({
        to: order.order.customerEmail,
        subject: `Confirmation de commande #${order.order.id}`,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      // Send payment confirmation email too
      try {
        const paymentTemplate = generatePaymentConfirmationEmailTemplate(
          order.order.id,
          order.order.total,
          order.order.customerName ?? "Client",
        );

        await sendEmail({
          to: order.order.customerEmail,
          subject: `Paiement confirmé #${order.order.id}`,
          text: paymentTemplate.text,
          html: paymentTemplate.html,
        });
      } catch (emailError) {
        console.error(
          "❌ Failed to send payment confirmation email:",
          emailError,
        );
      }
    } catch (emailError) {
      console.error("❌ Failed to send confirmation email:", emailError);
    }
  } catch (error) {
    console.error("❌ Error processing checkout session:", error);
    throw error;
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  try {
    if (!charge.payment_intent) {
      console.log(`⚠️ No payment_intent found in charge ${charge.id}`);
      return;
    }

    const paymentIntentId =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent.id;

    const existingOrder = await db.order.findFirst({
      where: {
        OR: [
          { stripePaymentId: paymentIntentId },
          ...(charge.metadata?.session_id
            ? [{ stripeSessionId: charge.metadata.session_id }]
            : []),
        ],
      },
    });

    if (existingOrder && existingOrder.status === "PENDING") {
      const updated = await db.order.update({
        where: { id: existingOrder.id },
        data: {
          status: "PAID",
          stripePaymentId: paymentIntentId,
        },
      });

      console.log(
        `✅ Order ${existingOrder.id} updated to PAID via charge event`,
      );

      try {
        const paymentTemplate = generatePaymentConfirmationEmailTemplate(
          updated.id,
          updated.total,
          updated.customerName ?? "Client",
        );

        await sendEmail({
          to: updated.customerEmail,
          subject: `Paiement confirmé #${updated.id}`,
          text: paymentTemplate.text,
          html: paymentTemplate.html,
        });
      } catch (emailError) {
        console.error(
          "❌ Failed to send payment confirmation email:",
          emailError,
        );
      }
    } else if (existingOrder) {
      console.log(
        `⚠️ Order found via charge but status is ${existingOrder.status}, skipping`,
      );
    } else {
      console.log(
        `⚠️ No order found for charge ${charge.id} with payment_intent ${paymentIntentId}`,
      );
    }
  } catch (error) {
    console.error("❌ Error processing charge succeeded:", error);
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  try {
    console.log(`✅ Processing succeeded payment intent: ${paymentIntent.id}`);

    const existingOrder = await db.order.findFirst({
      where: {
        OR: [
          { stripePaymentId: paymentIntent.id },
          ...(paymentIntent.metadata?.session_id
            ? [{ stripeSessionId: paymentIntent.metadata.session_id }]
            : []),
        ],
      },
    });

    if (existingOrder && existingOrder.status === "PENDING") {
      console.log(
        `🔄 Updating order ${existingOrder.id} with payment ID ${paymentIntent.id}`,
      );

      const updated = await db.order.update({
        where: { id: existingOrder.id },
        data: {
          status: "PAID",
          stripePaymentId: paymentIntent.id,
        },
      });

      console.log(`✅ Order ${existingOrder.id} updated to PAID status`);

      try {
        const paymentTemplate = generatePaymentConfirmationEmailTemplate(
          updated.id,
          updated.total,
          updated.customerName ?? "Client",
        );

        await sendEmail({
          to: updated.customerEmail,
          subject: `Paiement confirmé #${updated.id}`,
          text: paymentTemplate.text,
          html: paymentTemplate.html,
        });
      } catch (emailError) {
        console.error(
          "❌ Failed to send payment confirmation email:",
          emailError,
        );
      }
    } else if (existingOrder) {
      console.log(
        `⚠️ Order found but status is ${existingOrder.status}, skipping payment intent update`,
      );
    } else {
      console.log(`⚠️ No order found for payment intent ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error("❌ Error processing payment intent succeeded:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`❌ Processing failed payment intent: ${paymentIntent.id}`);

    const customerEmail =
      paymentIntent.receipt_email ??
      paymentIntent.shipping?.name ??
      "client@example.com";

    const customerName = paymentIntent.shipping?.name ?? "Client";

    console.error(
      `💳 Payment failed for ${customerEmail}: ${paymentIntent.last_payment_error?.message ?? "Unknown error"}`,
    );

    try {
      const emailTemplate = generatePaymentFailedEmailTemplate(
        {
          id: paymentIntent.id,
          total: paymentIntent.amount,
          customerEmail,
        },
        customerName,
      );

      await sendEmail({
        to: customerEmail,
        subject: "Problème avec votre paiement",
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      console.log(`📧 Payment failed email sent to ${customerEmail}`);
    } catch (emailError) {
      console.error("❌ Failed to send payment failed email:", emailError);
    }
  } catch (error) {
    console.error("❌ Error processing payment intent failed:", error);
  }
}
