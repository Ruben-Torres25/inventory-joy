import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Currency formatter for ARS
const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

// Date formatters
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatDateForApi(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Payment method labels
export const paymentMethodLabels: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

export function formatPaymentMethod(method: string): string {
  return paymentMethodLabels[method] || method;
}

// Status labels
export const saleStatusLabels: Record<string, string> = {
  CONFIRMED: "Confirmada",
  CANCELED: "Cancelada",
};

export const purchaseStatusLabels: Record<string, string> = {
  CONFIRMED: "Confirmada",
  CANCELED: "Cancelada",
};

export const cashMovementTypeLabels: Record<string, string> = {
  IN: "Ingreso",
  OUT: "Egreso",
};

// Audit labels
export const auditEntityLabels: Record<string, string> = {
  PRODUCT: "Producto",
  CLIENT: "Cliente",
  SUPPLIER: "Proveedor",
  SALE: "Venta",
  PURCHASE: "Compra",
  CASH: "Caja",
};

export const auditActionLabels: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DEACTIVATE: "Desactivación",
  CANCEL: "Cancelación",
  MANUAL: "Manual",
};
