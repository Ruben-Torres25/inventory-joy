import { Purchase } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface PurchaseDetailDialogProps {
  purchase: Purchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseDetailDialog({ purchase, open, onOpenChange }: PurchaseDetailDialogProps) {
  if (!purchase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalle de Compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <p className="font-medium">{formatDateTime(purchase.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <p><StatusBadge status={purchase.status === "CONFIRMED" ? "confirmed" : "canceled"} /></p>
            </div>
            <div>
              <span className="text-muted-foreground">Proveedor:</span>
              <p className="font-medium">{purchase.supplier?.name || "Sin proveedor"}</p>
            </div>
          </div>

          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-right p-2">Costo unit.</th>
                  <th className="text-center p-2">Cant.</th>
                  <th className="text-right p-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{item.product?.name || `Producto #${item.productId}`}</td>
                    <td className="text-right p-2">{formatCurrency(item.unitCost)}</td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-right p-2">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(purchase.total)}</span>
          </div>

          {purchase.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notas:</span>
              <p>{purchase.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
