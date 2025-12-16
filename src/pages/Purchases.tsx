import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, FileText, X } from "lucide-react";
import { purchasesApi, suppliersApi } from "@/lib/api";
import { Purchase, PurchaseStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ExportButton } from "@/components/shared/ExportButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PurchaseFormDialog } from "@/components/purchases/PurchaseFormDialog";
import { PurchaseDetailDialog } from "@/components/purchases/PurchaseDetailDialog";
import { toast } from "sonner";
import { formatDateForApi } from "@/lib/format";

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [supplierId, setSupplierId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [cancelingPurchase, setCancelingPurchase] = useState<Purchase | null>(null);

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", { active: true, limit: 100 }],
    queryFn: () => suppliersApi.getAll({ active: true, limit: 100 }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["purchases", { from: dateRange.from, to: dateRange.to, supplierId, page, limit }],
    queryFn: () =>
      purchasesApi.getAll({
        from: dateRange.from ? formatDateForApi(dateRange.from) : undefined,
        to: dateRange.to ? formatDateForApi(dateRange.to) : undefined,
        supplierId: supplierId ? Number(supplierId) : undefined,
        page,
        limit,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: purchasesApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Compra cancelada correctamente");
      setCancelingPurchase(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleExport = () => {
    purchasesApi.export({
      from: dateRange.from ? formatDateForApi(dateRange.from) : undefined,
      to: dateRange.to ? formatDateForApi(dateRange.to) : undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
    });
  };

  const handleExportPdf = (purchaseId: number) => {
    purchasesApi.exportPdf(purchaseId);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={(range) => setDateRange(range || {})}
          />
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los proveedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los proveedores</SelectItem>
              {suppliersData?.items.map((supplier) => (
                <SelectItem key={supplier.id} value={String(supplier.id)}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={handleExport} />
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Compra
          </Button>
        </div>
      </div>

      {data?.items.length === 0 ? (
        <EmptyState
          title="No hay compras"
          description="Registra tu primera compra para comenzar"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Compra
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>{formatDateTime(purchase.createdAt)}</TableCell>
                    <TableCell>{purchase.supplier?.name || "Sin proveedor"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(purchase.total)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="purchase" value={purchase.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingPurchase(purchase)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExportPdf(purchase.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {purchase.status === PurchaseStatus.CONFIRMED && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setCancelingPurchase(purchase)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination
            page={page}
            limit={limit}
            total={data?.total || 0}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </>
      )}

      <PurchaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["purchases"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          setFormOpen(false);
        }}
      />

      <PurchaseDetailDialog
        purchase={viewingPurchase}
        open={!!viewingPurchase}
        onOpenChange={(open) => !open && setViewingPurchase(null)}
      />

      <ConfirmDialog
        open={!!cancelingPurchase}
        onOpenChange={(open) => !open && setCancelingPurchase(null)}
        title="Cancelar compra"
        description="¿Estás seguro de cancelar esta compra? Se revertirá el stock de los productos."
        confirmText="Cancelar compra"
        onConfirm={() => cancelingPurchase && cancelMutation.mutate(cancelingPurchase.id)}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
