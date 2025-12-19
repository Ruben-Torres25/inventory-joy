import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Plus, Trash2, Search, CreditCard, X } from "lucide-react";
import { toast } from "sonner";

import { productsApi, salesApi } from "@/lib/api";
import { formatCurrency, paymentMethodLabels } from "@/lib/format";
import { Product, PaymentMethod, CreateSaleDto } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface TicketItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function QuickSalePage() {
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  // Queries
  const { data: productsData } = useQuery({
    queryKey: ["products", "quick-sale", searchQuery],
    queryFn: () => productsApi.getAll({ search: searchQuery, active: true, limit: 20 }),
    enabled: searchQuery.length > 0,
  });

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: (data: CreateSaleDto) => salesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cash"] });
      toast.success("¡Venta realizada!", {
        description: `Total cobrado: ${formatCurrency(total)}`,
      });
      handleClearTicket();
    },
    onError: (error: Error) => {
      toast.error("Error al procesar la venta", {
        description: error.message,
      });
    },
  });

  // Calculations
  const subtotal = useMemo(() => {
    return ticketItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [ticketItems]);

  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const total = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  // Handlers
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleAddToTicket = () => {
    if (!selectedProduct) return;

    if (quantity <= 0) {
      toast.error("Cantidad inválida", {
        description: "La cantidad debe ser mayor a 0",
      });
      return;
    }

    // Check existing item in ticket
    const existingItem = ticketItems.find(
      (item) => item.productId === selectedProduct.id
    );
    const currentQuantityInTicket = existingItem?.quantity || 0;
    const totalQuantity = currentQuantityInTicket + quantity;

    if (totalQuantity > selectedProduct.stock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${selectedProduct.stock} unidades disponibles${
          currentQuantityInTicket > 0
            ? ` (${currentQuantityInTicket} ya en el ticket)`
            : ""
        }`,
      });
      return;
    }

    if (existingItem) {
      // Update quantity
      setTicketItems((items) =>
        items.map((item) =>
          item.productId === selectedProduct.id
            ? {
                ...item,
                quantity: totalQuantity,
                subtotal: item.unitPrice * totalQuantity,
              }
            : item
        )
      );
      toast.info("Cantidad actualizada", {
        description: `${selectedProduct.name}: ${totalQuantity} unidades`,
      });
    } else {
      // Add new item
      const newItem: TicketItem = {
        productId: selectedProduct.id,
        product: selectedProduct,
        quantity,
        unitPrice: selectedProduct.price,
        subtotal: selectedProduct.price * quantity,
      };
      setTicketItems((items) => [...items, newItem]);
    }

    // Show low stock warning
    const remainingStock = selectedProduct.stock - totalQuantity;
    if (remainingStock <= selectedProduct.minStock && remainingStock > 0) {
      toast.warning("Stock bajo", {
        description: `Quedarán solo ${remainingStock} unidades de ${selectedProduct.name}`,
      });
    }

    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const item = ticketItems.find((i) => i.productId === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast.error("Stock insuficiente", {
        description: `Solo hay ${item.product.stock} unidades disponibles`,
      });
      return;
    }

    setTicketItems((items) =>
      items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: newQuantity, subtotal: i.unitPrice * newQuantity }
          : i
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setTicketItems((items) => items.filter((i) => i.productId !== productId));
  };

  const handleClearTicket = () => {
    setTicketItems([]);
    setSelectedProduct(null);
    setQuantity(1);
    setDiscountPercent(0);
    setPaymentMethod("CASH");
    setSearchQuery("");
  };

  const handleConfirmSale = () => {
    if (ticketItems.length === 0) {
      toast.error("Ticket vacío", {
        description: "Agrega al menos un producto",
      });
      return;
    }

    const saleData: CreateSaleDto = {
      items: ticketItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      paymentMethod,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      customerId: null,
    };

    createSaleMutation.mutate(saleData);
  };

  // Stock status helpers
  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return "out";
    if (product.stock <= product.minStock) return "low";
    return "normal";
  };

  const getStockBadge = (product: Product) => {
    const status = getStockStatus(product);
    if (status === "out") {
      return <Badge variant="destructive">Sin stock</Badge>;
    }
    if (status === "low") {
      return <Badge variant="warning">Stock bajo</Badge>;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Venta Rápida</h1>
            <p className="text-sm text-muted-foreground">
              Punto de venta para consumidor final
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Search & Add Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Agregar Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Search */}
            <div className="flex gap-3">
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por SKU o nombre..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchOpen(e.target.value.length > 0);
                      }}
                      onFocus={() => searchQuery.length > 0 && setSearchOpen(true)}
                      className="pl-9"
                      aria-label="Buscar productos"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No se encontraron productos</CommandEmpty>
                      <CommandGroup>
                        {productsData?.items.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.id}
                            onSelect={() => handleSelectProduct(product)}
                            disabled={product.stock === 0}
                            className="flex items-center justify-between py-3"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">
                                  {product.sku}
                                </span>
                                <span className="font-medium">{product.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-primary">
                                  {formatCurrency(product.price)}
                                </span>
                                <span className="text-muted-foreground">
                                  • Stock: {product.stock}
                                </span>
                                {getStockBadge(product)}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Product */}
            {selectedProduct && (
              <Card className="bg-muted/50 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {selectedProduct.sku}
                        </span>
                        <span className="font-medium">{selectedProduct.name}</span>
                        {getStockBadge(selectedProduct)}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-lg font-semibold text-primary">
                          {formatCurrency(selectedProduct.price)}
                        </span>
                        <span className={`text-sm ${
                          getStockStatus(selectedProduct) === "low" 
                            ? "text-warning" 
                            : "text-muted-foreground"
                        }`}>
                          Stock disponible: {selectedProduct.stock}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Cantidad</label>
                        <Input
                          type="number"
                          min={1}
                          max={selectedProduct.stock}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 text-center"
                          aria-label="Cantidad a agregar"
                        />
                      </div>
                      <Button
                        onClick={handleAddToTicket}
                        disabled={quantity > selectedProduct.stock}
                        className="gap-2"
                        aria-label="Agregar producto al ticket"
                      >
                        <Plus className="h-4 w-4" />
                        Agregar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedProduct(null)}
                        aria-label="Cancelar selección"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {quantity > selectedProduct.stock && (
                    <p className="text-sm text-destructive mt-2">
                      Stock insuficiente. Disponible: {selectedProduct.stock}
                    </p>
                  )}
                  {quantity <= selectedProduct.stock && 
                   selectedProduct.stock - quantity <= selectedProduct.minStock && 
                   selectedProduct.stock - quantity > 0 && (
                    <p className="text-sm text-warning mt-2">
                      ⚠️ Quedarán {selectedProduct.stock - quantity} unidades (stock bajo)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Ticket Items Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="w-[100px] text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ticketItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay productos en el ticket
                      </TableCell>
                    </TableRow>
                  ) : (
                    ticketItems.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-mono text-xs">
                          {item.product.sku}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.product.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.productId,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 text-center mx-auto"
                            aria-label={`Cantidad de ${item.product.name}`}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-destructive hover:text-destructive"
                            aria-label={`Eliminar ${item.product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Checkout */}
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cobrar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Descuento (%)</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) =>
                    setDiscountPercent(
                      Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                    )
                  }
                  className="w-20 text-center"
                  aria-label="Porcentaje de descuento"
                />
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Descuento</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de pago</label>
              <Select
                value={paymentMethod}
                onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
              >
                <SelectTrigger aria-label="Seleccionar método de pago">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{paymentMethodLabels.CASH}</SelectItem>
                  <SelectItem value="CARD">{paymentMethodLabels.CARD}</SelectItem>
                  <SelectItem value="TRANSFER">{paymentMethodLabels.TRANSFER}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleConfirmSale}
                disabled={ticketItems.length === 0 || createSaleMutation.isPending}
                className="w-full h-12 text-lg gap-2"
                aria-label="Confirmar y cobrar venta"
              >
                <ShoppingCart className="h-5 w-5" />
                {createSaleMutation.isPending ? "Procesando..." : "Cobrar"}
              </Button>

              <Button
                variant="outline"
                onClick={handleClearTicket}
                disabled={ticketItems.length === 0 && !selectedProduct}
                className="w-full"
                aria-label="Cancelar venta y limpiar ticket"
              >
                Cancelar Venta
              </Button>
            </div>

            {/* Items count */}
            {ticketItems.length > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                {ticketItems.length} producto{ticketItems.length !== 1 ? "s" : ""} •{" "}
                {ticketItems.reduce((sum, item) => sum + item.quantity, 0)} unidades
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
