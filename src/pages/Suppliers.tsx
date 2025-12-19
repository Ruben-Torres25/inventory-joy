import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { suppliersApi } from "@/lib/api";
import { Supplier, UpdateSupplierDto } from "@/types";
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
import { SupplierFormDialog } from "@/components/suppliers/SupplierFormDialog";
import { SortableTableHead } from "@/components/shared/SortableTableHead";
import { useSorting } from "@/hooks/use-sorting";
import { toast } from "sonner";

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deactivatingSupplier, setDeactivatingSupplier] = useState<Supplier | null>(null);

  const { sortBy, sortOrder, handleSort } = useSorting();

  const activeFilter = statusFilter === "all" ? undefined : statusFilter === "active";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["suppliers", { search, active: activeFilter, page, limit, sortBy, sortOrder }],
    queryFn: () => suppliersApi.getAll({
      search,
      active: activeFilter,
      page,
      limit,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    }),
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Proveedor creado", {
        description: "El proveedor ha sido registrado correctamente",
      });
      setFormOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Error al crear proveedor", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierDto }) =>
      suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Proveedor actualizado", {
        description: "Los datos han sido guardados correctamente",
      });
      setEditingSupplier(null);
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar", { description: error.message });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.update(id, { isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.warning("Proveedor desactivado", {
        description: "El proveedor ha sido marcado como inactivo",
      });
      setDeactivatingSupplier(null);
    },
    onError: (error: Error) => {
      toast.error("Error al desactivar", { description: error.message });
    },
  });

  const handleExport = () => {
    suppliersApi.export({ search, active: activeFilter });
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
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {data?.items.length === 0 ? (
        <EmptyState
          title="No hay proveedores"
          description="Crea tu primer proveedor para comenzar"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proveedor
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
                {data?.items.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.document || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={supplier.isActive ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSupplier(supplier)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {supplier.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeactivatingSupplier(supplier)}
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

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <SupplierFormDialog
        open={!!editingSupplier}
        onOpenChange={(open) => !open && setEditingSupplier(null)}
        supplier={editingSupplier || undefined}
        onSubmit={(data) =>
          editingSupplier && updateMutation.mutate({ id: editingSupplier.id, data })
        }
        isLoading={updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deactivatingSupplier}
        onOpenChange={(open) => !open && setDeactivatingSupplier(null)}
        title="Desactivar proveedor"
        description={`¿Estás seguro de desactivar a "${deactivatingSupplier?.name}"? Esta acción se puede revertir.`}
        onConfirm={() =>
          deactivatingSupplier && deactivateMutation.mutate(deactivatingSupplier.id)
        }
        loading={deactivateMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
