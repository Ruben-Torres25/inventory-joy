import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { clientsApi } from "@/lib/api";
import { Client, UpdateClientDto } from "@/types";
import { Button } from "@/components/ui/button";
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
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ExportButton } from "@/components/shared/ExportButton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { SortableTableHead } from "@/components/shared/SortableTableHead";
import { useSorting } from "@/hooks/use-sorting";
import { toast } from "sonner";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deactivatingClient, setDeactivatingClient] = useState<Client | null>(null);

  const { sortBy, sortOrder, handleSort } = useSorting();

  const activeFilter = statusFilter === "all" ? undefined : statusFilter === "active";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clients", { search, active: activeFilter, page, limit, sortBy, sortOrder }],
    queryFn: () => clientsApi.getAll({
      search,
      active: activeFilter,
      page,
      limit,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente creado correctamente");
      setFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente actualizado correctamente");
      setEditingClient(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => clientsApi.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente desactivado correctamente");
      setDeactivatingClient(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleExport = () => {
    clientsApi.export({ search, active: activeFilter });
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, documento..."
          />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={handleExport} />
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {data?.items.length === 0 ? (
        <EmptyState
          title="No hay clientes"
          description="Crea tu primer cliente para comenzar"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          }
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead field="name" label="Nombre" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <SortableTableHead field="document" label="Documento" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <SortableTableHead field="phone" label="Teléfono" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <SortableTableHead field="email" label="Email" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <SortableTableHead field="isActive" label="Estado" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.document || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={client.isActive ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingClient(client)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {client.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeactivatingClient(client)}
                          aria-label="Desactivar"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <ClientFormDialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
        client={editingClient || undefined}
        onSubmit={(data) =>
          editingClient && updateMutation.mutate({ id: editingClient.id, data })
        }
        isLoading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deactivatingClient}
        onOpenChange={(open) => !open && setDeactivatingClient(null)}
        title="Desactivar cliente"
        description={`¿Estás seguro de desactivar a "${deactivatingClient?.name}"? Esta acción se puede revertir.`}
        onConfirm={() =>
          deactivatingClient && deactivateMutation.mutate(deactivatingClient.id)
        }
        loading={deactivateMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
