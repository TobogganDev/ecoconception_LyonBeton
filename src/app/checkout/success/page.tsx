"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import styles from "./Success.module.scss";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("guest_cart");
    }
  }, []);

  return (
    <div className={styles.successPage}>
      <div className={styles.successPage__container}>
        <h1 className={styles.successPage__title}>Paiement réussi !</h1>

        {sessionId && (
          <p className={styles.successPage__sessionId}>
            Numéro de session/payment : {sessionId}
          </p>
        )}

        <div className={styles.successPage__actions}>
          <Link href="/" className={styles.successPage__button}>
            Retour accueil
          </Link>

          <Link href="/products" className={styles.successPage__button}>
            Continuer mes achats
          </Link>
        </div>

        <p className={styles.successPage__emailInfo}>
          Mail de confirmation envoyé.
        </p>
      </div>
    </div>
  );
}
