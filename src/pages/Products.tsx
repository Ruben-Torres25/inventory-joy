import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { productsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusFilter } from "@/components/shared/StatusFilter";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { ExportButton } from "@/components/shared/ExportButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TableLoadingState } from "@/components/shared/LoadingState";
import { SortableTableHead } from "@/components/shared/SortableTableHead";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductDetailDialog } from "@/components/products/ProductDetailDialog";
import { ProductAdvancedFilters, defaultProductFilters } from "@/components/products/ProductAdvancedFilters";
import type { ProductFilters } from "@/components/products/ProductAdvancedFilters";
import type { Product } from "@/types";
import { useSorting } from "@/hooks/use-sorting";
import { toast } from "sonner";

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<ProductFilters>(defaultProductFilters);
  
  const { sortBy, sortOrder, handleSort } = useSorting();

  const activeParam = statusFilter === "all" ? undefined : statusFilter === "active";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", search, statusFilter, page, limit, sortBy, sortOrder, advancedFilters],
    queryFn: () => productsApi.getAll({
      search,
      active: activeParam,
      page,
      limit,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
      priceMin: advancedFilters.priceMin,
      priceMax: advancedFilters.priceMax,
      stockMin: advancedFilters.stockMin,
      stockMax: advancedFilters.stockMax,
      lowStockOnly: advancedFilters.lowStockOnly || undefined,
      zeroStockOnly: advancedFilters.zeroStockOnly || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      toast.success("Producto desactivado");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteProduct(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  const handleExport = () => {
    productsApi.export({ search, active: activeParam });
  };

  if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar productos..." />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          <ProductAdvancedFilters filters={advancedFilters} onChange={setAdvancedFilters} />
        </div>
        <div className="flex gap-2">
          <ExportButton onClick={handleExport} />
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><TableLoadingState columns={6} /></div>
          ) : data?.items.length === 0 ? (
            <EmptyState
              title="Sin productos"
              description="No se encontraron productos con los filtros actuales"
              action={<Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Crear Producto</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="sku" label="SKU" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <SortableTableHead field="name" label="Nombre" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <SortableTableHead field="price" label="Precio" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="text-right" />
                  <SortableTableHead field="stock" label="Stock" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} className="text-right" />
                  <SortableTableHead field="isActive" label="Estado" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="w-[120px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock <= product.minStock ? "text-destructive font-medium" : ""}>
                        {product.stock}
                      </span>
                      <span className="text-muted-foreground"> / {product.minStock}</span>
                    </TableCell>
                    <TableCell>
                      {product.stock <= product.minStock ? (
                        <StatusBadge status="low" />
                      ) : (
                        <StatusBadge status={product.isActive ? "active" : "inactive"} />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingProduct(product)} aria-label="Ver detalles">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteProduct(product)} disabled={!product.isActive} aria-label="Desactivar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {data && data.total > 0 && (
            <DataTablePagination
              page={page}
              limit={limit}
              total={data.total}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          )}
        </CardContent>
      </Card>

      <ProductFormDialog open={formOpen} onOpenChange={handleFormClose} product={editingProduct} />

      <ProductDetailDialog
        product={viewingProduct}
        open={!!viewingProduct}
        onOpenChange={(open) => !open && setViewingProduct(null)}
        onEdit={handleEdit}
      />

      <ConfirmDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
        title="Desactivar Producto"
        description={`¿Desactivar "${deleteProduct?.name}"? El producto no se eliminará, solo se marcará como inactivo.`}
        confirmLabel="Desactivar"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
      />
    </div>
  );
}
