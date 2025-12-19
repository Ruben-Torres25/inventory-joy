import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, AlertTriangle, Info } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const NONE_VALUE = "__none__";

export function PurchaseFormDialog({ open, onOpenChange, onSuccess }: PurchaseFormDialogProps) {
  const [items, setItems] = useState<(CreatePurchaseItemDto & { product: Product })[]>([]);
  const [supplierId, setSupplierId] = useState<string>(NONE_VALUE);
  const [notes, setNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(NONE_VALUE);
  const [quantity, setQuantity] = useState<string>("1");
  const [unitCost, setUnitCost] = useState<string>("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setItems([]);
      setSupplierId(NONE_VALUE);
      setNotes("");
      setSelectedProductId(NONE_VALUE);
      setQuantity("1");
      setUnitCost("");
    }
  }, [open]);

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
      toast.success("Compra registrada correctamente", {
        description: `Total: ${formatCurrency(total)}`,
      });
      resetForm();
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error("Error al registrar la compra", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setItems([]);
    setSupplierId(NONE_VALUE);
    setNotes("");
    setSelectedProductId(NONE_VALUE);
    setQuantity("1");
    setUnitCost("");
  };

  // Get selected product info
  const selectedProduct = useMemo(() => {
    if (!selectedProductId || selectedProductId === NONE_VALUE) return null;
    return productsData?.items.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId, productsData]);

  // Cost validation
  const costValidation = useMemo(() => {
    if (!selectedProduct || !unitCost) return null;
    
    const cost = Number(unitCost) || 0;
    const isZeroOrNegative = cost <= 0;
    const isLowMargin = cost > 0 && selectedProduct.price > 0 && cost >= selectedProduct.price * 0.8;
    const isAboveSalePrice = cost >= selectedProduct.price;
    
    return {
      cost,
      isZeroOrNegative,
      isLowMargin,
      isAboveSalePrice,
      canAdd: !isZeroOrNegative && Number(quantity) > 0,
    };
  }, [selectedProduct, unitCost, quantity]);

  const handleAddItem = () => {
    if (!selectedProductId || selectedProductId === NONE_VALUE || !unitCost) {
      toast.error("Datos incompletos", {
        description: "Selecciona un producto e ingresa el costo unitario",
      });
      return;
    }
    const product = productsData?.items.find((p) => p.id === selectedProductId);
    if (!product) return;

    const qty = Number(quantity) || 1;
    const cost = Number(unitCost) || 0;

    if (cost <= 0) {
      toast.error("Costo inválido", {
        description: "El costo unitario debe ser mayor a 0",
      });
      return;
    }

    // Warn if cost is above sale price
    if (cost >= product.price) {
      toast.warning("Margen bajo", {
        description: `El costo (${formatCurrency(cost)}) es igual o mayor al precio de venta (${formatCurrency(product.price)})`,
      });
    }

    const existingIndex = items.findIndex((item) => item.productId === product.id);
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += qty;
      setItems(newItems);
      toast.info("Producto actualizado", {
        description: `Cantidad de ${product.name} actualizada`,
      });
    } else {
      setItems([...items, { productId: product.id, quantity: qty, unitCost: cost, product }]);
    }

    setSelectedProductId(NONE_VALUE);
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
    
    // Validate cost against price
    if (field === "unitCost" && value >= newItems[index].product.price) {
      toast.warning("Margen bajo", {
        description: `El costo es igual o mayor al precio de venta`,
      });
    }
    
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("Sin productos", {
        description: "Agrega al menos un producto a la compra",
      });
      return;
    }

    // Inform about items being added
    toast.info("Procesando compra...", {
      description: "Actualizando inventario",
    });

    const purchaseData: CreatePurchaseDto = {
      items: items.map(({ productId, quantity, unitCost }) => ({ productId, quantity, unitCost })),
      ...(supplierId && supplierId !== NONE_VALUE && { supplierId }),
      ...(notes && { notes }),
    };

    createMutation.mutate(purchaseData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto" aria-describedby="purchase-form-description">
        <DialogHeader>
          <DialogTitle>Nueva Compra</DialogTitle>
        </DialogHeader>
        <p id="purchase-form-description" className="sr-only">Formulario para registrar una nueva compra de inventario</p>

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
                    {productsData?.items.map((product) => {
                      const isLowStock = product.stock <= product.minStock;
                      return (
                        <SelectItem key={product.id} value={product.id}>
                          <span className="flex items-center gap-2">
                            <span>{product.sku} - {product.name}</span>
                            <span className={isLowStock ? "text-warning" : "text-muted-foreground"}>
                              (Stock: {product.stock})
                            </span>
                            {isLowStock && <AlertTriangle className="h-3 w-3 text-warning" />}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label htmlFor="quantity-input">Cantidad</Label>
                <Input
                  id="quantity-input"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  aria-label="Cantidad de productos a comprar"
                />
              </div>
              <div className="w-28">
                <Label htmlFor="cost-input">Costo unit.</Label>
                <Input
                  id="cost-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="$"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  aria-label="Costo unitario del producto"
                  aria-invalid={costValidation?.isZeroOrNegative}
                  aria-describedby={costValidation?.isZeroOrNegative ? "cost-error" : undefined}
                  className={costValidation?.isZeroOrNegative ? "border-destructive" : ""}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleAddItem} 
                  disabled={!selectedProductId || selectedProductId === NONE_VALUE || !costValidation?.canAdd}
                  aria-label="Agregar producto a la compra"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product info and validations */}
            {selectedProduct && (
              <div className="space-y-1 text-sm animate-fade-in">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-3 w-3" />
                  <span>Stock actual: {selectedProduct.stock} | Precio venta: {formatCurrency(selectedProduct.price)}</span>
                  {selectedProduct.stock <= selectedProduct.minStock && (
                    <Badge variant="warning" className="text-xs">Reponer stock</Badge>
                  )}
                </div>
                
                {costValidation?.isZeroOrNegative && unitCost !== "" && (
                  <p id="cost-error" className="text-destructive flex items-center gap-1" role="alert">
                    <AlertTriangle className="h-3 w-3" />
                    El costo unitario debe ser mayor a 0
                  </p>
                )}
                
                {costValidation?.isAboveSalePrice && (
                  <p className="text-warning flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    El costo ({formatCurrency(costValidation.cost)}) es mayor al precio de venta ({formatCurrency(selectedProduct.price)})
                  </p>
                )}
                
                {costValidation?.isLowMargin && !costValidation?.isAboveSalePrice && (
                  <p className="text-warning flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Margen bajo: el costo representa más del 80% del precio de venta
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="border rounded-md" role="table" aria-label="Productos en la compra">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr role="row">
                    <th role="columnheader" className="text-left p-2">Producto</th>
                    <th role="columnheader" className="text-right p-2">Costo unit.</th>
                    <th role="columnheader" className="text-center p-2">Cant.</th>
                    <th role="columnheader" className="text-right p-2">Subtotal</th>
                    <th role="columnheader" className="p-2"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lowMargin = item.unitCost >= item.product.price;
                    return (
                      <tr key={index} className="border-t" role="row">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span>{item.product.name}</span>
                            {lowMargin && (
                              <Badge variant="warning" className="text-xs">Margen bajo</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-right p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className={`w-24 text-right h-8 ${lowMargin ? 'border-warning' : ''}`}
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItem(index, "unitCost", Number(e.target.value))}
                            aria-label={`Costo unitario de ${item.product.name}`}
                          />
                        </td>
                        <td className="text-center p-2">
                          <Input
                            type="number"
                            min="1"
                            className="w-16 text-center h-8"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, "quantity", Number(e.target.value))}
                            aria-label={`Cantidad de ${item.product.name}`}
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
                            aria-label={`Eliminar ${item.product.name} de la compra`}
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

          {/* Supplier */}
          <div>
            <Label htmlFor="supplier-select">Proveedor (opcional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="supplier-select" aria-label="Seleccionar proveedor">
                <SelectValue placeholder="Sin proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sin proveedor</SelectItem>
                {suppliersData?.items.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes-input">Notas</Label>
            <Textarea
              id="notes-input"
              placeholder="Notas adicionales..."
              className="resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Notas de la compra"
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
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || items.length === 0}
              aria-label="Registrar compra"
            >
              {createMutation.isPending ? "Guardando..." : "Registrar Compra"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
