import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Product } from "@/types";

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (product: Product) => void;
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onEdit,
}: ProductDetailDialogProps) {
  if (!product) return null;

  const isLowStock = product.stock <= product.minStock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalles del Producto
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(product);
                }}
                aria-label="Editar producto"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {product.isActive ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Activo
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  Inactivo
                </Badge>
              )}
              {isLowStock && product.isActive && (
                <Badge variant="destructive">Stock bajo</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          {product.description && (
            <div>
              <span className="text-sm text-muted-foreground">Descripción</span>
              <p className="mt-1">{product.description}</p>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Precio de venta</span>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(product.price)}
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Stock actual</span>
              <p className={`text-xl font-bold ${isLowStock ? "text-destructive" : "text-foreground"}`}>
                {product.stock}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / mín: {product.minStock}
                </span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fecha de creación</span>
              <p className="font-medium">{formatDateTime(product.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Última actualización</span>
              <p className="font-medium">{formatDateTime(product.updatedAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
