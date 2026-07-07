"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import styles from "./SecurityTab.module.scss";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().min(1, "Confirmez le nouveau mot de passe"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

interface SecurityTabProps {
  onMessage: (message: { type: "success" | "error"; text: string }) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function SecurityTab({
  onMessage,
  isLoading,
  setIsLoading,
}: SecurityTabProps) {
  const { data: session } = useSession();

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = api.account.changePassword.useMutation({
    onSuccess: () => {
      passwordForm.reset();
      onMessage({ type: "success", text: "Mot de passe changé avec succès" });
    },
    onError: (error) => {
      onMessage({ type: "error", text: error.message });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const requestEmailVerificationMutation =
    api.auth.requestEmailVerification.useMutation({
      onSuccess: () => {
        onMessage({ type: "success", text: "Email de vérification envoyé" });
      },
      onError: (error) => {
        onMessage({ type: "error", text: error.message });
      },
      onSettled: () => {
        setIsLoading(false);
      },
    });

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    onMessage({ type: "success", text: "" });
    changePasswordMutation.mutate(data);
  };

  const resendVerificationEmail = async () => {
    setIsLoading(true);
    onMessage({ type: "success", text: "" });

    if (session?.user?.email) {
      requestEmailVerificationMutation.mutate({ email: session.user.email });
    }
  };

  return (
    <div className={styles.securityTab}>
      <h2 className={styles.securityTab__title}>Sécurité</h2>

      <div className={styles.securityTab__section}>
        <h3 className={styles.securityTab__sectionTitle}>
          Vérification de l email
        </h3>
        <div className={styles.securityTab__emailInfo}>
          <p>
            <strong>Email:</strong> {session?.user?.email}
          </p>
          <p>
            <strong>Statut:</strong>
            <span
              className={`${styles.securityTab__status} ${session?.user?.emailVerified ? styles["securityTab__status--verified"] : styles["securityTab__status--unverified"]}`}
            >
              {session?.user?.emailVerified ? "Vérifié" : "Non vérifié"}
            </span>
          </p>
          {!session?.user?.emailVerified && (
            <button
              type="button"
              onClick={resendVerificationEmail}
              disabled={isLoading}
              className={styles.securityTab__verifyButton}
            >
              {isLoading ? "Envoi..." : "Re-envoyer email de vérification"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.securityTab__section}>
        <h3 className={styles.securityTab__sectionTitle}>2FA</h3>
        <a
          href="/account/security/two-factor"
          className={styles.securityTab__link}
        >
          Ajouter 2FA
        </a>
      </div>

      <div className={styles.securityTab__section}>
        <h3 className={styles.securityTab__sectionTitle}>
          Changer le mot de passe
        </h3>
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className={styles.securityTab__form}
        >
          <div className={styles.securityTab__field}>
            <label
              htmlFor="currentPassword"
              className={styles.securityTab__label}
            >
              Mot de passe actuel
            </label>
            <input
              id="currentPassword"
              type="password"
              {...passwordForm.register("currentPassword")}
              className={styles.securityTab__input}
            />
            {passwordForm.formState.errors.currentPassword && (
              <p className={styles.securityTab__error}>
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className={styles.securityTab__field}>
            <label htmlFor="newPassword" className={styles.securityTab__label}>
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              type="password"
              {...passwordForm.register("newPassword")}
              className={styles.securityTab__input}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className={styles.securityTab__error}>
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className={styles.securityTab__field}>
            <label
              htmlFor="confirmPassword"
              className={styles.securityTab__label}
            >
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              {...passwordForm.register("confirmPassword")}
              className={styles.securityTab__input}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className={styles.securityTab__error}>
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.securityTab__passwordButton}
          >
            {isLoading ? "Changement..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
