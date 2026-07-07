"use client";

import { api } from "~/trpc/react";

export default function AdminDashboard() {
  const { data: users } = api.admin.getAllUsers.useQuery();
  const { data: products } = api.admin.getAllProducts.useQuery();
  const { data: auditLogs } = api.admin.getAuditLogs.useQuery({
    limit: 10,
    offset: 0,
  });

  return (
    <div>
      <h1>Tableau de bord administrateur</h1>

      <div>
        <h2>Statistiques</h2>
        <p>Utilisateurs: {users?.length ?? 0}</p>
        <p>Produits: {products?.length ?? 0}</p>
      </div>

      <div>
        <h2>Actions récentes</h2>
        {auditLogs && auditLogs.length > 0 ? (
          <ul>
            {auditLogs.map((log) => (
              <li key={log.id}>
                <strong>{log.admin.name}</strong> - {log.action} sur{" "}
                {log.entity}
                (ID: {log.entityId}) -{" "}
                {new Date(log.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune action récente</p>
        )}
      </div>

      <div>
        <h2>Navigation</h2>
        <ul>
          <li>
            <a href="/admin/users">Gestion des utilisateurs</a>
          </li>
          <li>
            <a href="/admin/products">Gestion des produits</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
