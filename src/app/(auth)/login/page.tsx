"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import "./login.css";
import bemCondition from "~/app/helpers/bemHelper";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          try {
            const response = await fetch("/api/auth/check-2fa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: data.email,
                password: data.password,
              }),
            });

            if (response.ok) {
              const userData = (await response.json()) as {
                twoFactorRequired?: boolean;
                userId?: string;
              };
              if (userData.twoFactorRequired) {
                router.push(
                  `/auth/verify-2fa?userId=${userData.userId}&callbackUrl=${encodeURIComponent(from ?? "/account")}`,
                );
                return;
              }
            }
          } catch {}
        }

        setError("Email ou mot de passe incorrect");
      } else if (result?.ok) {
        router.push(from ?? "/account");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsLoading(true);
    try {
      await signIn(provider, {
        callbackUrl: from ?? "/account",
      });
    } catch {
      setError("Erreur de connexion");
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-wrapper">
        <div className="login-container">
          <h2>Se connecter</h2>
          {from && <p>Vous devez vous connecter pour accéder à cette page.</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            {error && <p>{error}</p>}

            <div className={bemCondition("login-form__group", "email")}>
              <input
                {...register("email")}
                type="email"
                id="email"
                placeholder="Email"
              />
              {errors.email && <p>{errors.email.message}</p>}
            </div>

            <div className={bemCondition("login-form__group", "password")}>
              <input
                {...register("password")}
                type="password"
                id="password"
                placeholder="Mot de passe"
              />
              {errors.password && <p>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-form__submit"
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="login-oauth">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
              className={bemCondition("login-oauth__button", "google")}
            >
              Utiliser Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignIn("github")}
              disabled={isLoading}
              className={bemCondition("login-oauth__button", "github")}
            >
              Utiliser GitHub
            </button>
          </div>

          <div className="login-links">
            <div>
              <a href="/forgot-password">Mot de passe oublié ?</a>
            </div>

            <div>
              <span>
                Pas encore de compte ? <a href="/register">S inscrire</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
