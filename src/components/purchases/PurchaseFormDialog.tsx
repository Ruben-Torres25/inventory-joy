import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { purchasesApi, productsApi, suppliersApi } from "@/lib/api";
import { CreatePurchaseDto, CreatePurchaseItemDto, Product } from "@/types";
import { formatCurrency } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PurchaseFormDialog({ open, onOpenChange, onSuccess }: PurchaseFormDialogProps) {
  const [items, setItems] = useState<(CreatePurchaseItemDto & { product: Product })[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unitCost, setUnitCost] = useState<string>("");

  const { data: productsData } = useQuery({
    queryKey: ["products", { active: true, limit: 500 }],
    queryFn: () => productsApi.getAll({ active: true, limit: 500 }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", { active: true, limit: 100 }],
    queryFn: () => suppliersApi.getAll({ active: true, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      toast.success("Compra registrada correctamente");
      resetForm();
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setItems([]);
    setSupplierId("");
    setNotes("");
    setSelectedProductId("");
    setQuantity("1");
    setUnitCost("");
  };

  const handleAddItem = () => {
    if (!selectedProductId || !unitCost) {
      toast.error("Selecciona un producto e ingresa el costo unitario");
      return;
    }
    const product = productsData?.items.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = Number(quantity) || 1;
    const cost = Number(unitCost) || 0;

    if (cost <= 0) {
      toast.error("El costo unitario debe ser mayor a 0");
      return;
    }

    const existingIndex = items.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += qty;
      setItems(newItems);
    } else {
      setItems([...items, { productId: product.id, quantity: qty, unitCost: cost, product }]);
    }

    setSelectedProductId("");
    setQuantity("1");
    setUnitCost("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: "quantity" | "unitCost", value: number) => {
    if (value < 1 && field === "quantity") return;
    if (value < 0 && field === "unitCost") return;
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    const purchaseData: CreatePurchaseDto = {
      items: items.map(({ productId, quantity, unitCost }) => ({ productId, quantity, unitCost })),
      ...(supplierId && { supplierId }),
      ...(notes && { notes }),
    };

    createMutation.mutate(purchaseData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product selector */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Producto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {productsData?.items.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-20">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="w-28">
              <Label>Costo unit.</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="$"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleAddItem} disabled={!selectedProductId || !unitCost}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Producto</th>
                    <th className="text-right p-2">Costo unit.</th>
                    <th className="text-center p-2">Cant.</th>
                    <th className="text-right p-2">Subtotal</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{item.product.name}</td>
                      <td className="text-right p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 text-right h-8"
                          value={item.unitCost}
                          onChange={(e) => handleUpdateItem(index, "unitCost", Number(e.target.value))}
                        />
                      </td>
                      <td className="text-center p-2">
                        <Input
                          type="number"
                          min="1"
                          className="w-16 text-center h-8"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td className="text-right p-2">
                        {formatCurrency(item.unitCost * item.quantity)}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Supplier */}
          <div>
            <Label>Proveedor (opcional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin proveedor</SelectItem>
                {suppliersData?.items.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              placeholder="Notas adicionales..."
              className="resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || items.length === 0}>
              {createMutation.isPending ? "Guardando..." : "Registrar Compra"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
