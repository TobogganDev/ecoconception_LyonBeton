"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";
import bemCondition from "~/app/helpers/bemHelper";
import "./forgot-password.css";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const passwordResetMutation = api.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
    },
    onError: (error) => {
      setError(error.message);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    passwordResetMutation.mutate(data);
  };

  return (
    <div className="forgot-password">
      <div className="forgot-password-wrapper">
        <div className="forgot-password-container">
          <h2>Mot de passe oublié</h2>

          {message ? (
            <div className="forgot-password-links">
              <p>{message}</p>
              <a href="/login">Retour à la connexion</a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="forgot-password-form"
            >
              <p>
                Entrez votre adresse email pour recevoir un lien de
                réinitialisation.
              </p>

              {error && <p>{error}</p>}

              <div
                className={bemCondition("forgot-password-form__group", "email")}
              >
                <input
                  {...register("email")}
                  type="email"
                  id="email"
                  placeholder="Email"
                />
                {errors.email && <p>{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="forgot-password-form__submit"
              >
                {isLoading
                  ? "Envoi en cours..."
                  : "Réinitialiser le mot de passe"}
              </button>

              <div className="forgot-password-links">
                <a href="/login">Retour à la connexion</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
