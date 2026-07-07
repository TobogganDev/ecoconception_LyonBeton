"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";
import bemCondition from "~/app/helpers/bemHelper";
import "./register.css";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = api.auth.register.useMutation({
    onSuccess: () => {
      router.push("/auth/verify-email");
    },
    onError: (error) => {
      setServerError(error.message);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);
    registerMutation.mutate(data);
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setIsLoading(true);
    try {
      await signIn(provider, {
        callbackUrl: "/account",
      });
    } catch {
      setServerError("Erreur de connexion");
      setIsLoading(false);
    }
  };

  return (
    <div className="register">
      <div className="register-wrapper">
        <div className="register-container">
          <h2>Créer un compte</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="register-form">
            {serverError && <p>{serverError}</p>}

            <div className={bemCondition("register-form__group", "name")}>
              <input
                {...register("name")}
                type="text"
                id="name"
                placeholder="Nom"
              />
              {errors.name && <p>{errors.name.message}</p>}
            </div>

            <div className={bemCondition("register-form__group", "email")}>
              <input
                {...register("email")}
                type="email"
                id="email"
                placeholder="Email"
              />
              {errors.email && <p>{errors.email.message}</p>}
            </div>

            <div className={bemCondition("register-form__group", "password")}>
              <input
                {...register("password")}
                type="password"
                id="password"
                placeholder="Mot de passe (8 caractères minimum)"
              />
              {errors.password && <p>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="register-form__submit"
            >
              {isLoading ? "Création en cours..." : "S'inscrire"}
            </button>
          </form>

          <div className="register-oauth">
            <button
              type="button"
              onClick={() => handleOAuthSignIn("google")}
              disabled={isLoading}
              className={bemCondition("register-oauth__button", "google")}
            >
              Utiliser Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignIn("github")}
              disabled={isLoading}
              className={bemCondition("register-oauth__button", "github")}
            >
              Utiliser GitHub
            </button>
          </div>

          <div className="register-links">
            <span>
              Déjà un compte ? <a href="/login">Se connecter</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
