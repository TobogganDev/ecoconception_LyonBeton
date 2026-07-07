"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UseRequireAuthOptions {
  requireAdmin?: boolean;
  requireEmailVerified?: boolean;
  requiredPermissions?: string[];
}

export function useRequireAuth(
  redirectTo = "/login",
  options: UseRequireAuthOptions = {},
) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      const callbackUrl = currentUrl
        ? `?callbackUrl=${encodeURIComponent(currentUrl)}`
        : "";
      router.push(redirectTo + callbackUrl);
      return;
    }

    if (options.requireAdmin && session.user.role !== "ADMIN") {
      router.push("/unauthorized");
      return;
    }

    if (options.requireEmailVerified && !session.user.emailVerified) {
      router.push("/auth/verify-email");
      return;
    }

    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      if (session.user.role !== "ADMIN") {
        const userPermissions: string[] = []; // TODO: Implement user permissions
        const hasAllPermissions = options.requiredPermissions.every(
          (permission) => userPermissions.includes(permission),
        );

        if (!hasAllPermissions) {
          router.push("/unauthorized");
          return;
        }
      }
    }
  }, [session, status, router, redirectTo, options]);

  return {
    session,
    isLoading: status === "loading",
    authenticated: !!session,
  };
}
