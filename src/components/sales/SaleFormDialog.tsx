import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { salesApi, productsApi, clientsApi } from "@/lib/api";
import { CreateSaleDto, CreateSaleItemDto, PaymentMethod, Product } from "@/types";
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

interface SaleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NONE_VALUE = "__none__";

export function SaleFormDialog({ open, onOpenChange, onSuccess }: SaleFormDialogProps) {
  const [items, setItems] = useState<(CreateSaleItemDto & { product: Product })[]>([]);
  const [customerId, setCustomerId] = useState<string>(NONE_VALUE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discountPercent, setDiscountPercent] = useState<string>("0");
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(NONE_VALUE);
  const [quantity, setQuantity] = useState<string>("1");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setItems([]);
      setCustomerId(NONE_VALUE);
      setPaymentMethod("CASH");
      setDiscountPercent("0");
      setNotes("");
      setSelectedProductId(NONE_VALUE);
      setQuantity("1");
    }
  }, [open]);

  const { data: productsData } = useQuery({
    queryKey: ["products", { active: true, limit: 500 }],
    queryFn: () => productsApi.getAll({ active: true, limit: 500 }),
  });

  const { data: clientsData } = useQuery({
    queryKey: ["clients", { active: true, limit: 100 }],
    queryFn: () => clientsApi.getAll({ active: true, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      toast.success("Venta registrada correctamente");
      resetForm();
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setItems([]);
    setCustomerId(NONE_VALUE);
    setPaymentMethod("CASH");
    setDiscountPercent("0");
    setNotes("");
    setSelectedProductId(NONE_VALUE);
    setQuantity("1");
  };

  const handleAddItem = () => {
    if (!selectedProductId || selectedProductId === NONE_VALUE) return;
    const product = productsData?.items.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = Number(quantity) || 1;
    if (qty > product.stock) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    const existingIndex = items.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      const newQty = newItems[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
        return;
      }
      newItems[existingIndex].quantity = newQty;
      setItems(newItems);
    } else {
      setItems([...items, { productId: product.id, quantity: qty, product }]);
    }

    setSelectedProductId(NONE_VALUE);
    setQuantity("1");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const product = items[index].product;
    if (newQty > product.stock) {
      toast.error(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }
    const newItems = [...items];
    newItems[index].quantity = newQty;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = (subtotal * Number(discountPercent)) / 100;
  const total = subtotal - discount;

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    const saleData: CreateSaleDto = {
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      paymentMethod,
      ...(customerId && customerId !== NONE_VALUE && { customerId }),
      ...(Number(discountPercent) > 0 && { discountPercent: Number(discountPercent) }),
      ...(notes && { notes }),
    };

    createMutation.mutate(saleData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
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
                  {productsData?.items
                    .filter((p) => p.stock > 0)
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.sku} - {product.name} ({formatCurrency(product.price)}) - Stock: {product.stock}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleAddItem} disabled={!selectedProductId || selectedProductId === NONE_VALUE}>
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
                    <th className="text-right p-2">Precio</th>
                    <th className="text-center p-2">Cant.</th>
                    <th className="text-right p-2">Subtotal</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{item.product.name}</td>
                      <td className="text-right p-2">{formatCurrency(item.product.price)}</td>
                      <td className="text-center p-2">
                        <Input
                          type="number"
                          min="1"
                          className="w-16 text-center h-8"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                        />
                      </td>
                      <td className="text-right p-2">
                        {formatCurrency(item.product.price * item.quantity)}
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

          {/* Customer and payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cliente (opcional)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin cliente</SelectItem>
                  {clientsData?.items.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Descuento (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                placeholder="Notas adicionales..."
                className="resize-none h-10"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {Number(discountPercent) > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Descuento ({discountPercent}%):</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
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
              {createMutation.isPending ? "Guardando..." : "Registrar Venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
