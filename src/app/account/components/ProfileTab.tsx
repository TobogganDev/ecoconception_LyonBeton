"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { api } from "~/trpc/react";
import styles from "./ProfileTab.module.scss";

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileTabProps {
  onMessage: (message: { type: "success" | "error"; text: string }) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ProfileTab({
  onMessage,
  isLoading,
  setIsLoading,
}: ProfileTabProps) {
  const { data: session, update } = useSession();
  const utils = api.useUtils();
  const { data: user } = api.account.getProfile.useQuery();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (user?.name) {
      profileForm.setValue("name", user.name);
    }
  }, [user?.name, profileForm]);

  const updateProfileMutation = api.account.updateProfile.useMutation({
    onSuccess: async (data) => {
      await utils.account.getProfile.invalidate();
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
        },
      });
      onMessage({ type: "success", text: "Profil mis à jour avec succès" });
    },
    onError: (error) => {
      onMessage({ type: "error", text: error.message });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    onMessage({ type: "success", text: "" });
    updateProfileMutation.mutate(data);
  };

  return (
    <div className={styles.profileTab}>
      <h2 className={styles.profileTab__title}>Info Profil</h2>
      <form
        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
        className={styles.profileTab__form}
      >
        <div className={styles.profileTab__field}>
          <label htmlFor="name" className={styles.profileTab__label}>
            Nom
          </label>
          <input
            id="name"
            type="text"
            placeholder="Votre Nom"
            {...profileForm.register("name")}
            className={styles.profileTab__input}
          />
          {profileForm.formState.errors.name && (
            <p className={styles.profileTab__error}>
              {profileForm.formState.errors.name.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={styles.profileTab__button}
        >
          {isLoading ? "Mise à jour..." : "Mettre à jour le profil"}
        </button>
      </form>
    </div>
  );
}
