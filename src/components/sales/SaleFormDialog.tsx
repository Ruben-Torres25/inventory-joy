import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
      toast.success("Venta registrada correctamente", {
        description: `Total: ${formatCurrency(total)}`,
      });
      resetForm();
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error("Error al registrar la venta", {
        description: error.message,
      });
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

  // Get selected product info and validation
  const selectedProduct = useMemo(() => {
    if (!selectedProductId || selectedProductId === NONE_VALUE) return null;
    return productsData?.items.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId, productsData]);

  // Calculate available stock (considering items already in cart)
  const getAvailableStock = (productId: string) => {
    const product = productsData?.items.find((p) => p.id === productId);
    if (!product) return 0;
    const inCart = items.find((item) => item.productId === productId);
    return product.stock - (inCart?.quantity || 0);
  };

  // Stock validation for selected product
  const stockValidation = useMemo(() => {
    if (!selectedProduct) return null;
    
    const availableStock = getAvailableStock(selectedProduct.id);
    const qty = Number(quantity) || 0;
    const isLowStock = selectedProduct.stock <= selectedProduct.minStock;
    const isOutOfStock = availableStock === 0;
    const exceedsStock = qty > availableStock;
    const wouldBeLowStock = (selectedProduct.stock - (items.find(i => i.productId === selectedProduct.id)?.quantity || 0) - qty) <= selectedProduct.minStock && !exceedsStock;
    
    return {
      availableStock,
      isLowStock,
      isOutOfStock,
      exceedsStock,
      wouldBeLowStock,
      canAdd: !exceedsStock && qty > 0 && availableStock > 0,
    };
  }, [selectedProduct, quantity, items, productsData]);

  const handleAddItem = () => {
    if (!selectedProductId || selectedProductId === NONE_VALUE) return;
    const product = productsData?.items.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = Number(quantity) || 1;
    const availableStock = getAvailableStock(product.id);
    
    if (qty > availableStock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${availableStock} unidades disponibles`,
      });
      return;
    }

    const existingIndex = items.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += qty;
      setItems(newItems);
    } else {
      setItems([...items, { productId: product.id, quantity: qty, product }]);
    }

    // Show warning if stock is low after adding
    const remainingStock = product.stock - (items.find(i => i.productId === product.id)?.quantity || 0) - qty;
    if (remainingStock <= product.minStock && remainingStock > 0) {
      toast.warning("Stock bajo", {
        description: `Quedarán ${remainingStock} unidades de ${product.name}`,
      });
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
      toast.error("Stock insuficiente", {
        description: `Solo hay ${product.stock} unidades disponibles`,
      });
      return;
    }
    const newItems = [...items];
    newItems[index].quantity = newQty;
    setItems(newItems);
  };

  // Get stock status for item in list
  const getItemStockStatus = (item: CreateSaleItemDto & { product: Product }) => {
    const remainingStock = item.product.stock - item.quantity;
    const exceedsStock = item.quantity > item.product.stock;
    const isLow = remainingStock <= item.product.minStock && !exceedsStock;
    return { remainingStock, exceedsStock, isLow };
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = (subtotal * Number(discountPercent)) / 100;
  const total = subtotal - discount;

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    // Check for low stock warnings before submitting
    const lowStockItems = items.filter(item => {
      const remaining = item.product.stock - item.quantity;
      return remaining <= item.product.minStock && remaining > 0;
    });
    
    if (lowStockItems.length > 0) {
      toast.warning("Advertencia de stock bajo", {
        description: `${lowStockItems.length} producto(s) quedarán con stock bajo después de esta venta`,
      });
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="sale-form-description">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>
        <p id="sale-form-description" className="sr-only">Formulario para registrar una nueva venta</p>

        <div className="space-y-4">
          {/* Product selector */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="product-select">Producto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product-select" aria-label="Seleccionar producto">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsData?.items
                      .filter((p) => p.stock > 0)
                      .map((product) => {
                        const available = getAvailableStock(product.id);
                        const isLow = product.stock <= product.minStock;
                        return (
                          <SelectItem key={product.id} value={product.id} disabled={available === 0}>
                            <span className="flex items-center gap-2">
                              <span>{product.sku} - {product.name}</span>
                              <span className="text-muted-foreground">({formatCurrency(product.price)})</span>
                              <span className={isLow ? "text-warning" : "text-success"}>
                                Stock: {available}
                              </span>
                              {isLow && <AlertTriangle className="h-3 w-3 text-warning" />}
                            </span>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label htmlFor="quantity-input">Cantidad</Label>
                <Input
                  id="quantity-input"
                  type="number"
                  min="1"
                  max={stockValidation?.availableStock || undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  aria-label="Cantidad de productos"
                  aria-invalid={stockValidation?.exceedsStock}
                  aria-describedby={stockValidation?.exceedsStock ? "quantity-error" : undefined}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleAddItem} 
                  disabled={!stockValidation?.canAdd}
                  aria-label="Agregar producto a la venta"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Stock info for selected product */}
            {selectedProduct && stockValidation && (
              <div className="space-y-1 text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className={stockValidation.isOutOfStock ? "text-destructive" : stockValidation.isLowStock ? "text-warning" : "text-success"}>
                    Stock disponible: {stockValidation.availableStock} unidades
                  </span>
                  {stockValidation.isLowStock && !stockValidation.isOutOfStock && (
                    <Badge variant="warning" className="text-xs">Stock bajo</Badge>
                  )}
                  {stockValidation.isOutOfStock && (
                    <Badge variant="destructive" className="text-xs">Sin stock</Badge>
                  )}
                </div>
                
                {stockValidation.exceedsStock && (
                  <p id="quantity-error" className="text-destructive flex items-center gap-1" role="alert">
                    <AlertTriangle className="h-3 w-3" />
                    Stock insuficiente. Máximo disponible: {stockValidation.availableStock}
                  </p>
                )}
                
                {stockValidation.wouldBeLowStock && !stockValidation.exceedsStock && (
                  <p className="text-warning flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Quedarán {selectedProduct.stock - (items.find(i => i.productId === selectedProduct.id)?.quantity || 0) - Number(quantity)} unidades (stock bajo)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="border rounded-md" role="table" aria-label="Productos en la venta">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr role="row">
                    <th role="columnheader" className="text-left p-2">Producto</th>
                    <th role="columnheader" className="text-right p-2">Precio</th>
                    <th role="columnheader" className="text-center p-2">Cant.</th>
                    <th role="columnheader" className="text-right p-2">Subtotal</th>
                    <th role="columnheader" className="p-2"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const stockStatus = getItemStockStatus(item);
                    return (
                      <tr key={index} className="border-t" role="row">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span>{item.product.name}</span>
                            {stockStatus.isLow && (
                              <Badge variant="warning" className="text-xs">Bajo</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-right p-2">{formatCurrency(item.product.price)}</td>
                        <td className="text-center p-2">
                          <Input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            className={`w-16 text-center h-8 ${stockStatus.exceedsStock ? 'border-destructive' : ''}`}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                            aria-label={`Cantidad de ${item.product.name}`}
                            aria-invalid={stockStatus.exceedsStock}
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
                            aria-label={`Eliminar ${item.product.name} de la venta`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Customer and payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-select">Cliente (opcional)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer-select" aria-label="Seleccionar cliente">
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
              <Label htmlFor="payment-method">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger id="payment-method" aria-label="Seleccionar método de pago">
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
              <Label htmlFor="discount-input">Descuento (%)</Label>
              <Input
                id="discount-input"
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                aria-label="Porcentaje de descuento"
              />
            </div>
            <div>
              <Label htmlFor="notes-input">Notas</Label>
              <Textarea
                id="notes-input"
                placeholder="Notas adicionales..."
                className="resize-none h-10"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                aria-label="Notas de la venta"
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
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || items.length === 0}
              aria-label="Registrar venta"
            >
              {createMutation.isPending ? "Guardando..." : "Registrar Venta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
