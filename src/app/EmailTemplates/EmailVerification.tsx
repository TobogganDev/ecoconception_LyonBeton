type EmailVerificationProps = {
  userName: string;
  verificationUrl: string;
};

export default function EmailVerification(Props: EmailVerificationProps) {
  const { userName, verificationUrl } = Props;

  const emailContent = {
    text: `Bonjour ${userName}, Merci de vous être inscrit ! Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :${verificationUrl}Ce lien expirera dans 24 heures.Si vous n'avez pas créé de compte, vous pouvez ignorer cet email. Cordialement, L'équipe`,
    html: `<div style="font-family: Arial, Helvetica, sans-serif; background-color: #ebebeb; padding: 24px;">
            <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: #231f20; padding: 32px 20px; text-align: center;">
                    <h1 style="color: #ebebeb; margin: 0; font-size: 22px; letter-spacing: 0.2px;">Vérification de votre email</h1>
                </div>
                <div style="padding: 32px 24px; color: #231f20; line-height: 1.6;">
                    <p style="margin: 0 0 16px 0;">Bonjour <strong>${userName}</strong>,</p>
                    <p style="margin: 0 0 16px 0;">Merci de vous être inscrit ! Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
                    <p style="margin: 24px 0; text-align: center;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 22px; background-color: #231f20; color: #ebebeb; text-decoration: none; font-weight: 700;">Vérifier mon email</a>
                    </p>
                    <p style="margin: 0 0 8px 0;">Ou copiez ce lien dans votre navigateur :</p>
                    <p style="margin: 0 0 16px 0; word-break: break-all; color: #231f20;"><a href="${verificationUrl}" style="color: #231f20; text-decoration: underline;">${verificationUrl}</a></p>
                    <p style="margin: 0 0 8px 0;"><small><strong>Ce lien expirera dans 24 heures.</strong></small></p>
                    <p style="margin: 0 0 16px 0;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
                    <p style="margin: 0;">Cordialement,<br /><strong>L'équipe</strong></p>
                </div>
                <div style="background-color: #ebebeb; padding: 16px; text-align: center; font-size: 12px; color: #231f20;">
                    <p style="margin: 0;">Cet email vous a été envoyé pour vérifier votre adresse</p>
                </div>
            </div>
        </div>`,
  };

  return emailContent;
}
