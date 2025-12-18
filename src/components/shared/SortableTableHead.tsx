import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/hooks/use-sorting";

interface SortableTableHeadProps {
  field: string;
  label: string;
  currentSortBy: string | null;
  currentSortOrder: SortOrder;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableTableHead({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSortBy === field;

  const Icon = isActive
    ? currentSortOrder === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={cn("p-0", className)}>
      <Button
        variant="ghost"
        onClick={() => onSort(field)}
        className={cn(
          "h-auto w-full justify-start px-4 py-3 font-medium hover:bg-muted/50",
          isActive && "text-primary"
        )}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <Icon className={cn("ml-2 h-4 w-4", isActive ? "opacity-100" : "opacity-50")} />
      </Button>
    </TableHead>
  );
}
