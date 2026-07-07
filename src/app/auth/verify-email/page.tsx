export default function VerifyEmailPage() {
  return (
    <div>
      <h2>Vérifiez votre boîte mail</h2>
      <p>
        Nous vous avons envoyé un email de confirmation.
        <br />
        Cliquez sur le lien qu&apos;il contient pour activer votre compte.
      </p>
      <a href="/auth/login">Retour à la connexion</a>
    </div>
  );
}
