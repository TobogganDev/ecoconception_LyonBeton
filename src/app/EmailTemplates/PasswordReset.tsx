interface PasswordResetProps {
  resetUrl: string;
  userName: string;
}

export default function PasswordReset(props: PasswordResetProps) {
  const { resetUrl, userName } = props;

  const text = `
Bonjour ${userName},

Vous avez demandé à réinitialiser votre mot de passe. Pour créer un nouveau mot de passe, cliquez sur le lien ci-dessous :

${resetUrl}

Ce lien expirera dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe actuel restera inchangé.

Cordialement,
L'équipe
	`;

  const html = `
		<div style="font-family: Arial, Helvetica, sans-serif; background-color: #ebebeb; padding: 24px;">
			<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
				<div style="background: #231f20; padding: 32px 20px; text-align: center;">
					<h1 style="color: #ebebeb; margin: 0; font-size: 22px; letter-spacing: 0.2px;">Réinitialisation du mot de passe</h1>
				</div>

				<div style="padding: 32px 24px; color: #231f20; line-height: 1.6;">
					<p style="margin: 0 0 16px 0;">Bonjour <strong>${userName}</strong>,</p>

					<p style="margin: 0 0 16px 0;">Vous avez demandé à réinitialiser votre mot de passe. Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>

					<p style="margin: 24px 0; text-align: center;">
						<a href="${resetUrl}" style="display: inline-block; padding: 12px 22px; background-color: #231f20; color: #ebebeb; text-decoration: none; font-weight: 700;">Réinitialiser mon mot de passe</a>
					</p>

					<p style="margin: 0 0 8px 0;">Ou copiez ce lien dans votre navigateur :</p>
					<p style="margin: 0 0 16px 0; word-break: break-all; color: #231f20;"><a href="${resetUrl}" style="color: #231f20; text-decoration: underline;">${resetUrl}</a></p>

					<p style="margin: 0 0 8px 0;"><small><strong>Ce lien expirera dans 1 heure.</strong></small></p>

					<p style="margin: 0 0 16px 0;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe actuel restera inchangé.</p>

					<p style="margin: 0;">Cordialement,<br>L'équipe</p>
				</div>

				<div style="background-color: #ebebeb; padding: 16px; text-align: center; font-size: 12px; color: #231f20;">
					<p style="margin: 0;">Cet email vous a été envoyé suite à une demande de réinitialisation.</p>
				</div>
			</div>
		</div>
	`;

  return { text, html };
}
