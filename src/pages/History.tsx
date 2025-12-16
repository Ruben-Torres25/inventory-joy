import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { auditApi } from "@/lib/api";
import { AuditEntityType, AuditAction, AuditLog } from "@/types";
import {
  formatDateTime,
  auditEntityLabels,
  auditActionLabels,
  formatDateForApi,
} from "@/lib/format";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/shared/SearchInput";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

const actionColors: Record<AuditAction, string> = {
  [AuditAction.CREATE]: "bg-success/10 text-success",
  [AuditAction.UPDATE]: "bg-primary/10 text-primary",
  [AuditAction.DEACTIVATE]: "bg-warning/10 text-warning",
  [AuditAction.CANCEL]: "bg-destructive/10 text-destructive",
  [AuditAction.MANUAL]: "bg-muted text-muted-foreground",
};

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewingLog, setViewingLog] = useState<AuditLog | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["audit-logs", { search, entityType, action, dateRange, page, limit }],
    queryFn: () =>
      auditApi.getAll({
        search,
        entityType: entityType as AuditEntityType | undefined,
        action: action as AuditAction | undefined,
        from: dateRange.from ? formatDateForApi(dateRange.from) : undefined,
        to: dateRange.to ? formatDateForApi(dateRange.to) : undefined,
        page,
        limit,
      }),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar en historial..."
        />
        <DateRangePicker
          from={dateRange.from}
          to={dateRange.to}
          onSelect={(range) => setDateRange(range || {})}
        />
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Todas las entidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las entidades</SelectItem>
            {Object.entries(auditEntityLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las acciones</SelectItem>
            {Object.entries(auditActionLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data?.items.length === 0 ? (
        <EmptyState
          title="Sin registros"
          description="No se encontraron registros con los filtros aplicados"
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Resumen</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {auditEntityLabels[log.entityType] || log.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action]}>
                        {auditActionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.summary || "-"}
                    </TableCell>
                    <TableCell>{log.userName || "Sistema"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      {/* Detail Dialog */}
      <Dialog open={!!viewingLog} onOpenChange={(open) => !open && setViewingLog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalle del Registro</DialogTitle>
          </DialogHeader>
          {viewingLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <p className="font-medium">{formatDateTime(viewingLog.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Usuario:</span>
                  <p className="font-medium">{viewingLog.userName || "Sistema"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Entidad:</span>
                  <p>
                    <Badge variant="outline">
                      {auditEntityLabels[viewingLog.entityType] || viewingLog.entityType}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Acción:</span>
                  <p>
                    <Badge className={actionColors[viewingLog.action]}>
                      {auditActionLabels[viewingLog.action] || viewingLog.action}
                    </Badge>
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">ID de entidad:</span>
                  <p className="font-mono">{viewingLog.entityId}</p>
                </div>
              </div>

              {viewingLog.summary && (
                <div>
                  <span className="text-sm text-muted-foreground">Resumen:</span>
                  <p className="mt-1">{viewingLog.summary}</p>
                </div>
              )}

              {viewingLog.payload && (
                <div>
                  <span className="text-sm text-muted-foreground">Datos:</span>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto max-h-[300px]">
                    {JSON.stringify(viewingLog.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
