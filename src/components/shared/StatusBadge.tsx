import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType = "active" | "inactive" | "confirmed" | "canceled" | "in" | "out" | "warning" | "low";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: {
    label: "Activo",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  inactive: {
    label: "Inactivo",
    className: "bg-muted text-muted-foreground hover:bg-muted/80 border-muted",
  },
  confirmed: {
    label: "Confirmada",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  canceled: {
    label: "Cancelada",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
  },
  in: {
    label: "Ingreso",
    className: "bg-success/10 text-success hover:bg-success/20 border-success/20",
  },
  out: {
    label: "Egreso",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
  },
  warning: {
    label: "Alerta",
    className: "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
  },
  low: {
    label: "Stock bajo",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20",
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("border", config.className)}>
      {label || config.label}
    </Badge>
  );
}
