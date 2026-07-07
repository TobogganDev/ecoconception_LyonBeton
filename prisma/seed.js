import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@admin.com";
  const adminPassword = "root";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrateur",
        passwordHash: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    console.log(`Admin created : ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin already created");
  }

  const sampleOrderId = "order_seed_example";
  const existingOrder = await prisma.order.findFirst({
    where: { stripeSessionId: `cs_seed_${sampleOrderId}` },
  });

  if (!existingOrder) {
    const admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    const firstProduct = await prisma.product.findFirst();

    if (admin && firstProduct) {
      await prisma.order.create({
        data: {
          stripeSessionId: `cs_seed_${sampleOrderId}`,
          stripePaymentId: `pi_seed_${sampleOrderId}`,
          total: 48500,
          status: "DELIVERED",
          customerEmail: admin.email,
          customerName: admin.name,
          userId: admin.id,
          items: {
            create: [
              {
                productId: firstProduct.id,
                quantity: 2,
                price: firstProduct.price,
                title: firstProduct.title,
                subtitle: firstProduct.subtitle,
              },
            ],
          },
        },
      });

      console.log("Sample order created for admin");
    }
  } else {
    console.log("Sample order already exists");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
