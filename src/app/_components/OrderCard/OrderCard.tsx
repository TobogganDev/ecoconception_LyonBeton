interface OrderItem {
  id: string;
  title: string;
  subtitle: string;
  quantity: number;
  price: number;
  product?: {
    id: number;
    title: string;
    subtitle: string;
  };
}

interface OrderCardProps {
  order: {
    id: string;
    total: number;
    status:
      | "PENDING"
      | "PAID"
      | "PROCESSING"
      | "SHIPPED"
      | "DELIVERED"
      | "CANCELLED"
      | "REFUNDED";
    customerEmail: string;
    customerName?: string | null;
    stripeSessionId: string;
    stripePaymentId?: string | null;
    createdAt: Date;
    items: OrderItem[];
  };
  showInvoiceLink?: boolean;
}

export default function OrderCard({
  order,
  showInvoiceLink = true,
}: OrderCardProps) {
  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      PENDING: "En attente",
      PAID: "Payée",
      PROCESSING: "En cours de traitement",
      SHIPPED: "Expédiée",
      DELIVERED: "Livrée",
      CANCELLED: "Annulée",
      REFUNDED: "Remboursée",
    };
    return statusMap[status as keyof typeof statusMap] ?? status;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleDownloadInvoice = () => {
    const invoiceUrl = `/api/invoices/${order.id}`;
    window.open(invoiceUrl, "_blank");
  };

  return (
    <div data-testid="order-card">
      <div>
        <h3>Commande #{order.id}</h3>
        <p>Date: {formatDate(order.createdAt)}</p>
        <p>Statut: {getStatusText(order.status)}</p>
        <p>Total: {formatPrice(order.total)}€</p>

        {order.customerName && <p>Client: {order.customerName}</p>}

        <p>Email: {order.customerEmail}</p>
      </div>

      <div>
        <h4>Articles commandés:</h4>
        <ul>
          {order.items.map((item) => (
            <li key={item.id}>
              <div>
                <span>{item.title}</span>
                {item.subtitle && <span> - {item.subtitle}</span>}
                <span> x{item.quantity}</span>
                <span> = {formatPrice(item.price * item.quantity)}€</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {showInvoiceLink &&
          order.status !== "PENDING" &&
          order.status !== "CANCELLED" && (
            <button onClick={handleDownloadInvoice} type="button">
              Télécharger la facture
            </button>
          )}

        <div>
          <span>ID Stripe: {order.stripeSessionId}</span>
          {order.stripePaymentId && (
            <span> | Payment ID: {order.stripePaymentId}</span>
          )}
        </div>
      </div>
    </div>
  );
}
