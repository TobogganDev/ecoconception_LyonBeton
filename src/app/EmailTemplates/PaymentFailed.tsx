interface PaymentFailedDetails {
  id?: string;
  total?: number;
  customerEmail: string;
}

interface PaymentFailedProps {
  orderDetails: PaymentFailedDetails;
  customerName: string;
}

export default function PaymentFailed(props: PaymentFailedProps) {
  const { orderDetails, customerName } = props;

  const text = `
Bonjour ${customerName},

Nous vous informons qu'un problème est survenu lors du traitement de votre paiement.

${orderDetails.id ? `Commande concernée : #${orderDetails.id}` : ""}
${orderDetails.total ? `Montant : ${(orderDetails.total / 100).toFixed(2)}€` : ""}

Aucun montant n'a été débité de votre compte.

Vous pouvez réessayer votre commande à tout moment. Si le problème persiste, veuillez vérifier :
- Les informations de votre carte bancaire
- La limite de votre carte
- Contacter votre banque si nécessaire

N'hésitez pas à nous contacter si vous avez besoin d'aide.

Cordialement,
L'équipe Lyon Béton
	`;

  const html = `
		<div style="font-family: Arial, Helvetica, sans-serif; background-color: #ebebeb; padding: 24px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				<div style="background: #231f20; padding: 32px 20px; text-align: center;">
					<h1 style="color: #ebebeb; margin: 0; font-size: 22px; letter-spacing: 0.2px;">Problème de paiement</h1>
				</div>

				<div style="padding: 32px 24px; color: #231f20; line-height: 1.6;">
					<p style="margin: 0 0 16px 0;">Bonjour <strong>${customerName}</strong>,</p>
					<p style="margin: 0 0 16px 0;">Nous vous informons qu'un problème est survenu lors du traitement de votre paiement.</p>

					${
            (orderDetails.id ?? orderDetails.total)
              ? `
					<div style="background-color: #e3e3e3; border: 1px solid #e3e3e3; padding: 16px; margin: 20px 0;">
						${orderDetails.id ? `<p style=\"margin: 0 0 6px 0;\">Commande concernée : <strong>#${orderDetails.id}</strong></p>` : ""}
						${orderDetails.total ? `<p style=\"margin: 0;\">Montant : <strong>${(orderDetails.total / 100).toFixed(2)}€</strong></p>` : ""}
					</div>
					`
              : ""
          }

					<p style="margin: 0 0 16px 0;"><strong>Aucun montant n'a été débité de votre compte.</strong></p>

					<p style="margin: 0 0 8px 0;">Vous pouvez réessayer votre commande à tout moment. Si le problème persiste, veuillez vérifier :</p>
					<ul style="margin: 0 0 16px 18px; color: #231f20;">
						<li>Les informations de votre carte bancaire</li>
						<li>La limite de votre carte</li>
						<li>Contacter votre banque si nécessaire</li>
					</ul>

					<p style="margin: 0 0 16px 0;">N'hésitez pas à nous contacter si vous avez besoin d'aide.</p>

					<p style="margin: 0;">Cordialement,<br><strong>L'équipe Lyon Béton</strong></p>
				</div>

				<div style="background-color: #ebebeb; padding: 16px; text-align: center; font-size: 12px; color: #231f20;">
					<p style="margin: 0;">Cet email a été envoyé suite à un problème de paiement sur notre site.</p>
				</div>
			</div>
		</div>
	`;

  return { text, html };
}
