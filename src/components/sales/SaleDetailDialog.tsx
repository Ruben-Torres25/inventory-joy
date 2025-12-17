import { Sale } from "@/types";
import { formatCurrency, formatDateTime, formatPaymentMethod } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface SaleDetailDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailDialog({ sale, open, onOpenChange }: SaleDetailDialogProps) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalle de Venta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <p className="font-medium">{formatDateTime(sale.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <p><StatusBadge status={sale.status === "CONFIRMED" ? "confirmed" : "canceled"} /></p>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente:</span>
              <p className="font-medium">{sale.customer?.name || "Sin cliente"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Método de pago:</span>
              <p className="font-medium">{formatPaymentMethod(sale.paymentMethod)}</p>
            </div>
          </div>

          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-right p-2">Precio</th>
                  <th className="text-center p-2">Cant.</th>
                  <th className="text-right p-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{item.product?.name || `Producto #${item.productId}`}</td>
                    <td className="text-right p-2">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-right p-2">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discountPercent > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Descuento ({sale.discountPercent}%):</span>
                <span>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {sale.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notas:</span>
              <p>{sale.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
