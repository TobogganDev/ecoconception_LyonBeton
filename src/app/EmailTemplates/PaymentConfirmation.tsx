interface PaymentConfirmationProps {
  orderId: string;
  total: number;
  customerName: string;
}

export default function PaymentConfirmation(props: PaymentConfirmationProps) {
  const { orderId, total, customerName } = props;
  const totalInEuros = (total / 100).toFixed(2);

  const text = `
Bonjour ${customerName},

Nous confirmons la réception de votre paiement pour la commande #${orderId}.

Montant réglé : ${totalInEuros}€

Merci pour votre confiance.

Cordialement,
L'équipe Lyon Béton
	`;

  const html = `
		<div style="font-family: Arial, Helvetica, sans-serif; background-color: #ebebeb; padding: 24px;">
			<div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">
				<div style="background: #231f20; padding: 32px 20px; text-align: center;">
					<h1 style="color: #ebebeb; margin: 0; font-size: 22px; letter-spacing: 0.2px;">Confirmation de paiement</h1>
				</div>

				<div style="padding: 32px 24px; color: #231f20; line-height: 1.6;">
					<p style="margin: 0 0 12px 0;">Bonjour <strong>${customerName}</strong>,</p>
					<p style="margin: 0 0 16px 0;">Nous confirmons la bonne réception de votre paiement.</p>

					<div style="background-color: #e3e3e3; padding: 16px; margin: 20px 0; border: 1px solid #e3e3e3;">
						<p style="margin: 0 0 8px 0;">Commande : <strong>#${orderId}</strong></p>
						<p style="margin: 0;">Montant réglé : <strong>${totalInEuros}€</strong></p>
					</div>

					<p style="margin: 0 0 8px 0;">Vous recevrez un email dès que votre commande sera expédiée.</p>
					<p style="margin: 0;">Merci pour votre confiance.</p>

					<p style="margin: 20px 0 0 0;">Cordialement,<br><strong>L'équipe Lyon Béton</strong></p>
				</div>

				<div style="background-color: #ebebeb; padding: 16px; text-align: center; font-size: 12px; color: #231f20;">
					<p style="margin: 0;">Cet email confirme la réception de votre paiement.</p>
				</div>
			</div>
		</div>
	`;

  return { text, html };
}
