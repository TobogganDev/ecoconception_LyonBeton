"use client";

import React from "react";
import {
  SessionProvider as NextAuthSessionProvider,
  useSession,
} from "next-auth/react";
import { useEffect } from "react";
import { api } from "~/trpc/react";

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}

export function CartMergeOnLogin() {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const mergeMutation = api.cart.mergeGuestCart.useMutation({
    onSuccess: async () => {
      await utils.cart.getCurrent.invalidate();
    },
  });

  useEffect(() => {
    if (!session?.user) return;

    if (window !== undefined) {
      const storageCart = window.localStorage.getItem("guest_cart");

      if (storageCart) {
        const guestCart: Record<string, number> = JSON.parse(storageCart);
        const items = Object.entries(guestCart)
          .filter(([, qty]) => qty > 0)
          .map(([identifier, quantity]) => ({ identifier, quantity }));

        if (items.length > 0) {
          mergeMutation.mutate(
            { items },
            {
              onSuccess: () => {
                window.localStorage.removeItem("guest_cart");
              },
            },
          );
        }
      }
    }

    return;
  }, [session?.user]);

  return null;
}
