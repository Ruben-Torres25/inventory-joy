import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, FileText, X } from "lucide-react";
import { salesApi, clientsApi } from "@/lib/api";
import { Sale } from "@/types";
import { formatCurrency, formatDateTime, formatPaymentMethod } from "@/lib/format";
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
import { SaleFormDialog } from "@/components/sales/SaleFormDialog";
import { SaleDetailDialog } from "@/components/sales/SaleDetailDialog";
import { toast } from "sonner";
import { formatDateForApi } from "@/lib/format";

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [customerId, setCustomerId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [cancelingSale, setCancelingSale] = useState<Sale | null>(null);

  const { data: clientsData } = useQuery({
    queryKey: ["clients", { active: true, limit: 100 }],
    queryFn: () => clientsApi.getAll({ active: true, limit: 100 }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["sales", { from: dateRange.from, to: dateRange.to, customerId, page, limit }],
    queryFn: () =>
      salesApi.getAll({
        from: dateRange.from ? formatDateForApi(dateRange.from) : undefined,
        to: dateRange.to ? formatDateForApi(dateRange.to) : undefined,
        customerId: customerId || undefined,
        page,
        limit,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: salesApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Venta cancelada correctamente");
      setCancelingSale(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleExport = () => {
    salesApi.export({
      from: dateRange.from ? formatDateForApi(dateRange.from) : undefined,
      to: dateRange.to ? formatDateForApi(dateRange.to) : undefined,
      customerId: customerId || undefined,
    });
  };

  const handleExportPdf = (saleId: string) => {
    salesApi.exportPdf(saleId);
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
            onChange={(range) => setDateRange(range || {})}
          />
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los clientes</SelectItem>
              {clientsData?.items.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={handleExport} />
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {data?.items.length === 0 ? (
        <EmptyState
          title="No hay ventas"
          description="Registra tu primera venta para comenzar"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Venta
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
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Método de pago</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                    <TableCell>{sale.customer?.name || "Sin cliente"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status === "CONFIRMED" ? "confirmed" : "canceled"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExportPdf(sale.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {sale.status === "CONFIRMED" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setCancelingSale(sale)}
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

      <SaleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          setFormOpen(false);
        }}
      />

      <SaleDetailDialog
        sale={viewingSale}
        open={!!viewingSale}
        onOpenChange={(open) => !open && setViewingSale(null)}
      />

      <ConfirmDialog
        open={!!cancelingSale}
        onOpenChange={(open) => !open && setCancelingSale(null)}
        title="Cancelar venta"
        description="¿Estás seguro de cancelar esta venta? Se revertirá el stock de los productos."
        confirmLabel="Cancelar venta"
        onConfirm={() => cancelingSale && cancelMutation.mutate(cancelingSale.id)}
        loading={cancelMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
