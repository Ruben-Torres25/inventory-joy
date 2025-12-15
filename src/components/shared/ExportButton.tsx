import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  onClick: () => void;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportButton({
  onClick,
  label = "Exportar",
  variant = "outline",
  size = "default",
}: ExportButtonProps) {
  return (
    <Button variant={variant} size={size} onClick={onClick}>
      <Download className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
