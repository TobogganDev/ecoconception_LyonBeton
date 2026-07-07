"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";

const verifySchema = z.object({
  code: z.string().min(6, "Code requis").max(8, "Code trop long"),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function Verify2FAPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const codeValue = watch("code");

  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    if (!userIdParam) {
      void router.push("/login");
      return;
    }
    setUserId(userIdParam);
  }, [searchParams, router]);

  const verifyMutation = api.twoFactor.verifyPublic.useMutation({
    onSuccess: async (data) => {
      setIsLoading(true);
      try {
        const result = await signIn("credentials", {
          userId: userId,
          twoFactorVerified: "true",
          redirect: false,
        });

        if (result?.ok) {
          const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
          void router.push(callbackUrl);
        } else {
          setError("Erreur de connexion après vérification 2FA");
        }
      } catch {
        setError("Erreur de connexion");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);
    verifyMutation.mutate({
      code: data.code,
      userId: userId,
    });
  };

  if (!userId) {
    return <div>Redirection...</div>;
  }

  return (
    <div>
      <h1>Vérification 2FA</h1>
      <p>Saisissez le code de votre application d'authentification</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        {error && <div>{error}</div>}

        <div>
          <label htmlFor="code">
            {showBackupCode ? "Code de secours" : "Code à 6 chiffres"}
          </label>
          <input
            {...register("code")}
            type="text"
            id="code"
            placeholder={showBackupCode ? "XXXX-XXXX" : "123456"}
            maxLength={showBackupCode ? 9 : 6}
            autoComplete="one-time-code"
            autoFocus
          />
          {errors.code && <p>{errors.code.message}</p>}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Vérification en cours..." : "Vérifier"}
        </button>
      </form>

      <div>
        <button
          type="button"
          onClick={() => setShowBackupCode(!showBackupCode)}
        >
          {showBackupCode
            ? "Utiliser un code TOTP"
            : "Utiliser un code de secours"}
        </button>
      </div>

      <div>
        <a href="/login">← Retour à la connexion</a>
      </div>
    </div>
  );
}
