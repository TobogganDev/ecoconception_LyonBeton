type OrderItem = {
  title: string;
  subtitle: string;
  quantity: number;
  price: number;
};

interface OrderDetails {
  id: string;
  total: number;
  items: Array<OrderItem>;
}

interface OrderConfirmationProps {
  orderDetails: OrderDetails;
  customerName: string;
}

export default function OrderConfirmation(props: OrderConfirmationProps) {
  const { orderDetails, customerName } = props;
  const totalInEuros = (orderDetails.total / 100).toFixed(2);

  const text = `
Bonjour ${customerName},

Merci pour votre commande ! Votre paiement a été confirmé.

Détails de votre commande #${orderDetails.id} :

${orderDetails.items.map((item) => `- ${item.title} (${item.subtitle}) x${item.quantity} = ${((item.price * item.quantity) / 100).toFixed(2)}€`).join("\n")}

Total : ${totalInEuros}€

Nous traiterons votre commande dans les plus brefs délais et vous recevrez un email de confirmation d'expédition.

Cordialement,
L'équipe Lyon Béton
	`;

  const html = `
		<div style="font-family: Arial, Helvetica, sans-serif; background-color: #ebebeb; padding: 24px;">
			<div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">
				<div style="background: #231f20; padding: 32px 20px; text-align: center;">
					<h1 style="color: #ebebeb; margin: 0; font-size: 22px; letter-spacing: 0.2px;">Confirmation de commande</h1>
				</div>

				<div style="padding: 32px 24px; color: #231f20; line-height: 1.6;">
					<p style="margin: 0 0 16px 0;">Bonjour <strong>${customerName}</strong>,</p>
					<p style="margin: 0 0 20px 0;">Merci pour votre commande ! Votre paiement a été confirmé avec succès.</p>

					<div style="background-color: #e3e3e3; padding: 20px; margin: 20px 0; border: 1px solid #e3e3e3;">
						<h3 style="margin: 0 0 16px 0; color: #231f20;">Commande <strong>#${orderDetails.id}</strong></h3>

						<table style="width: 100%; border-collapse: collapse;">
							<thead>
								<tr style="border-bottom: 2px solid #e3e3e3;">
									<th style="text-align: left; padding: 10px; color: #231f20;">Produit</th>
									<th style="text-align: right; padding: 10px; color: #231f20;">Quantité</th>
									<th style="text-align: right; padding: 10px; color: #231f20;">Prix</th>
								</tr>
							</thead>
							<tbody>
								${orderDetails.items
                  .map(
                    (item) => `
									<tr style=\"border-bottom: 1px solid #e3e3e3;\">
										<td style=\"padding: 10px;\">
											<strong>${item.title}</strong><br>
											<small style=\"color: #231f20;\">${item.subtitle}</small>
										</td>
										<td style=\"text-align: right; padding: 10px;\">${item.quantity}</td>
										<td style=\"text-align: right; padding: 10px;\">${((item.price * item.quantity) / 100).toFixed(2)}€</td>
									</tr>
								`,
                  )
                  .join("")}
							</tbody>
							<tfoot>
								<tr style="border-top: 2px solid #e3e3e3; font-weight: bold;">
									<td colspan="2" style="padding: 10px; text-align: right;">Total :</td>
									<td style="text-align: right; padding: 10px; font-size: 18px; color: #231f20;"><strong>${totalInEuros}€</strong></td>
								</tr>
							</tfoot>
						</table>
					</div>

					<p style="margin: 0 0 8px 0;">Nous traiterons votre commande dans les plus brefs délais et vous recevrez un email de confirmation d'expédition.</p>
					<p style="margin: 0;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
					<p style="margin: 20px 0 0 0;">Cordialement,<br><strong>L'équipe Lyon Béton</strong></p>
				</div>

				<div style="background-color: #ebebeb; padding: 16px; text-align: center; font-size: 12px; color: #231f20;">
					<p style="margin: 0;">Cet email a été envoyé suite à votre commande sur notre site.</p>
				</div>
			</div>
		</div>
	`;

  return { text, html };
}
