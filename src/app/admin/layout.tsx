"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login?from=/admin");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return <div>Redirection...</div>;
  }

  return (
    <div>
      <div>
        <h1>Administration</h1>
        <p>
          Connecté en tant que: {session.user.name} ({session.user.role})
        </p>
        <nav>
          <a href="/admin">Dashboard</a>
          <a href="/admin/users">Gestion utilisateurs</a>
          <a href="/admin/products">Gestion produits</a>
          <a href="/">Retour au site</a>
        </nav>
      </div>
      <div>{children}</div>
    </div>
  );
}
