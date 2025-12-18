import { useLocation } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/products": "Productos",
  "/clients": "Clientes",
  "/suppliers": "Proveedores",
  "/sales": "Ventas",
  "/purchases": "Compras",
  "/cash": "Caja",
  "/reports": "Reportes",
  "/history": "Historial",
};

export function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Página";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="md:hidden" />
      <Separator orientation="vertical" className="h-6 md:hidden" />
      <h1 className="text-lg font-semibold flex-1">{title}</h1>
      <ThemeToggle />
    </header>
  );
}
