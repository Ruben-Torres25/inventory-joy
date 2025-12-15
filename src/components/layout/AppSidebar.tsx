import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  BarChart3,
  History,
  ChevronLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

const catalogNavItems = [
  { title: "Productos", url: "/products", icon: Package },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Proveedores", url: "/suppliers", icon: Truck },
];

const operationsNavItems = [
  { title: "Ventas", url: "/sales", icon: ShoppingCart },
  { title: "Compras", url: "/purchases", icon: ShoppingBag },
  { title: "Caja", url: "/cash", icon: Wallet },
];

const analyticsNavItems = [
  { title: "Reportes", url: "/reports", icon: BarChart3 },
  { title: "Historial", url: "/history", icon: History },
];

interface NavItemsGroupProps {
  label: string;
  items: typeof mainNavItems;
  collapsed: boolean;
}

function NavItemsGroup({ label, items, collapsed }: NavItemsGroupProps) {
  const location = useLocation();

  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs uppercase tracking-wider">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-primary text-sidebar-primary-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">
                Inventario
              </span>
            </div>
          )}
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md p-1.5">
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin p-2">
        <NavItemsGroup label="Principal" items={mainNavItems} collapsed={collapsed} />
        <NavItemsGroup label="Catálogo" items={catalogNavItems} collapsed={collapsed} />
        <NavItemsGroup label="Operaciones" items={operationsNavItems} collapsed={collapsed} />
        <NavItemsGroup label="Análisis" items={analyticsNavItems} collapsed={collapsed} />
      </SidebarContent>
    </Sidebar>
  );
}
