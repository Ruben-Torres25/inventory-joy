import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportsApi, cashApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CardLoadingState } from "@/components/shared/LoadingState";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: salesSummary, isLoading: loadingSales } = useQuery({
    queryKey: ["sales-summary", weekAgo.toISOString(), today.toISOString()],
    queryFn: () =>
      reportsApi.getSalesSummary({
        from: weekAgo.toISOString().split("T")[0],
        to: today.toISOString().split("T")[0],
      }),
  });

  const { data: lowStock, isLoading: loadingLowStock } = useQuery({
    queryKey: ["low-stock"],
    queryFn: () => reportsApi.getLowStock(),
  });

  const { data: cashSummary, isLoading: loadingCash } = useQuery({
    queryKey: ["cash-summary"],
    queryFn: () => cashApi.getSummary(),
  });

  const chartData = salesSummary?.days?.map((day) => ({
    date: formatDate(day.date),
    total: day.total,
    count: day.count,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingSales ? (
          <CardLoadingState />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ventas (7 días)
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(salesSummary?.totals?.total || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {salesSummary?.totals?.count || 0} transacciones
              </p>
            </CardContent>
          </Card>
        )}

        {loadingLowStock ? (
          <CardLoadingState />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stock Bajo
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStock?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                productos bajo mínimo
              </p>
            </CardContent>
          </Card>
        )}

        {loadingCash ? (
          <CardLoadingState />
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingresos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(cashSummary?.in?.total || 0)}
                </div>
                <p className="text-xs text-muted-foreground">caja del día</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Balance Neto
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(cashSummary?.net || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  ingresos - egresos
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas últimos 7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Total"]}
                  />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos con Stock Bajo</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/products">
                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingLowStock ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </div>
            ) : lowStock?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay productos con stock bajo
              </p>
            ) : (
              <div className="space-y-3">
                {lowStock?.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status="low" />
                      <p className="mt-1 text-sm">
                        {product.stock} / {product.minStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/sales">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nueva Venta
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products">
                <Package className="mr-2 h-4 w-4" />
                Ver Productos
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/reports">
                <TrendingUp className="mr-2 h-4 w-4" />
                Ver Reportes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
