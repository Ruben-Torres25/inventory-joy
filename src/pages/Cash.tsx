import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { cashApi } from "@/lib/api";
import { CashMovementType, PaymentMethod, CreateCashMovementDto } from "@/types";
import { formatCurrency, formatDateTime, formatPaymentMethod, cashMovementTypeLabels } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ExportButton } from "@/components/shared/ExportButton";
import { CashMovementFormDialog } from "@/components/cash/CashMovementFormDialog";
import { toast } from "sonner";
import { formatDateForApi } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function CashPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);

  const queryParams = {
    from: dateRange.from ? formatDateForApi(dateRange.from) : undefined,
    to: dateRange.to ? formatDateForApi(dateRange.to) : undefined,
    type: (typeFilter || undefined) as CashMovementType | undefined,
    method: (methodFilter || undefined) as PaymentMethod | undefined,
  };

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["cash-summary", queryParams],
    queryFn: () => cashApi.getSummary({ from: queryParams.from, to: queryParams.to }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cash-movements", { ...queryParams, page, limit }],
    queryFn: () => cashApi.getMovements({ ...queryParams, page, limit }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCashMovementDto) => cashApi.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-movements"] });
      queryClient.invalidateQueries({ queryKey: ["cash-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Movimiento registrado correctamente");
      setFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleExport = () => {
    cashApi.export({
      from: queryParams.from,
      to: queryParams.to,
      type: queryParams.type,
      method: queryParams.method,
    });
  };

  if (isLoading || summaryLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(summary?.in.total || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(summary?.out.total || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              (summary?.net || 0) >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(summary?.net || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por método (Ingresos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {summary?.in.byMethod && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Efectivo:</span>
                  <span className="font-medium">{formatCurrency(summary.in.byMethod.CASH)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarjeta:</span>
                  <span className="font-medium">{formatCurrency(summary.in.byMethod.CARD)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transferencia:</span>
                  <span className="font-medium">{formatCurrency(summary.in.byMethod.TRANSFER)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onChange={(range) => setDateRange(range || {})}
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los tipos</SelectItem>
              <SelectItem value="IN">Ingreso</SelectItem>
              <SelectItem value="OUT">Egreso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todos los métodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los métodos</SelectItem>
              <SelectItem value="CASH">Efectivo</SelectItem>
              <SelectItem value="CARD">Tarjeta</SelectItem>
              <SelectItem value="TRANSFER">Transferencia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={handleExport} />
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* Movements table */}
      {data?.items.length === 0 ? (
        <EmptyState
          title="No hay movimientos"
          description="Registra tu primer movimiento de caja"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Movimiento
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1",
                        movement.type === "IN" ? "text-success" : "text-destructive"
                      )}>
                        {movement.type === "IN" ? (
                          <ArrowUpCircle className="h-4 w-4" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4" />
                        )}
                        {cashMovementTypeLabels[movement.type]}
                      </span>
                    </TableCell>
                    <TableCell>{formatPaymentMethod(movement.method)}</TableCell>
                    <TableCell>{movement.description || "-"}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      movement.type === "IN" ? "text-success" : "text-destructive"
                    )}>
                      {movement.type === "IN" ? "+" : "-"}
                      {formatCurrency(movement.amount)}
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

      <CashMovementFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
