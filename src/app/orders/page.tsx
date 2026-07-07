"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import OrderCard from "~/app/_components/OrderCard/OrderCard";

export default function OrdersPage() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<string>("");

  const isAdmin = session?.user?.role === "ADMIN";

  const queryParams = {
    page,
    limit: 10,
    ...(startDate && { startDate: new Date(startDate) }),
    ...(endDate && { endDate: new Date(endDate) }),
    ...(status && { status: status as any }),
  };

  const adminQuery = api.orders.getAllOrders.useQuery(queryParams, {
    enabled: isAdmin,
  });
  const userQuery = api.orders.getUserOrders.useQuery(queryParams, {
    enabled: !isAdmin,
  });

  const { data, isLoading, error } = isAdmin ? adminQuery : userQuery;

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (data && page < data.totalPages) {
      setPage(page + 1);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatus("");
    setPage(1);
  };

  if (isLoading) {
    return (
      <div>
        <h1>{isAdmin ? "Toutes les Commandes" : "Mes Commandes"}</h1>
        <p>Chargement des commandes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>{isAdmin ? "Toutes les Commandes" : "Mes Commandes"}</h1>
        <p>Erreur lors du chargement des commandes: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>{isAdmin ? "Toutes les Commandes" : "Mes Commandes"}</h1>

      <div>
        <h2>Filtres</h2>
        <div>
          <div>
            <label htmlFor="startDate">Date de début:</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="endDate">Date de fin:</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="status">Statut:</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="PAID">Payée</option>
              <option value="PROCESSING">En cours de traitement</option>
              <option value="SHIPPED">Expédiée</option>
              <option value="DELIVERED">Livrée</option>
              <option value="CANCELLED">Annulée</option>
              <option value="REFUNDED">Remboursée</option>
            </select>
          </div>

          <button type="button" onClick={clearFilters}>
            Effacer les filtres
          </button>
        </div>
      </div>

      <div>
        {data && data.orders.length > 0 ? (
          <div>
            <p>
              Affichage de {(page - 1) * 10 + 1} à{" "}
              {Math.min(page * 10, data.totalCount)} sur {data.totalCount}{" "}
              commandes
            </p>

            <div>
              {data.orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showInvoiceLink={true}
                />
              ))}
            </div>

            <div>
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page <= 1}
              >
                Page précédente
              </button>

              <span>
                Page {page} sur {data.totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={page >= data.totalPages}
              >
                Page suivante
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>Aucune commande trouvée.</p>
            {(startDate ?? endDate ?? status) && (
              <p>
                Essayez de modifier vos filtres pour voir plus de résultats.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
