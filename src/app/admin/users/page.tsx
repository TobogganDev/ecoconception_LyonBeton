"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function UserManagement() {
  const [promotingUser, setPromotingUser] = useState<string | null>(null);

  const { data: users, refetch } = api.admin.getAllUsers.useQuery();
  const promoteUserMutation = api.admin.promoteUser.useMutation({
    onSuccess: () => {
      void refetch();
      setPromotingUser(null);
    },
  });

  const handlePromoteUser = (
    userId: string,
    newRole: "USER" | "ADMIN" | "PREMIUM",
  ) => {
    setPromotingUser(userId);
    promoteUserMutation.mutate({ userId, role: newRole });
  };

  return (
    <div>
      <h1>Gestion des utilisateurs</h1>

      <div>
        <h2>Liste des utilisateurs</h2>
        {users && users.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Email vérifié</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.emailVerified ? "Oui" : "Non"}</td>
                  <td>
                    {promotingUser === user.id ? (
                      <span>Mise à jour...</span>
                    ) : (
                      <div>
                        {user.role !== "USER" && (
                          <button
                            onClick={() => handlePromoteUser(user.id, "USER")}
                          >
                            → USER
                          </button>
                        )}
                        {user.role !== "PREMIUM" && (
                          <button
                            onClick={() =>
                              handlePromoteUser(user.id, "PREMIUM")
                            }
                          >
                            → PREMIUM
                          </button>
                        )}
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => handlePromoteUser(user.id, "ADMIN")}
                          >
                            → ADMIN
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucun utilisateur trouvé</p>
        )}
      </div>

      <div>
        <a href="/admin">← Retour au tableau de bord</a>
      </div>
    </div>
  );
}
