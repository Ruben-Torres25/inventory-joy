import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Package, AlertTriangle } from "lucide-react";
import { reportsApi } from "@/lib/api";
import { formatCurrency, formatDate, formatPaymentMethod, formatDateForApi } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { ExportButton } from "@/components/shared/ExportButton";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [topLimit, setTopLimit] = useState(10);

  const queryParams = {
    from: dateRange.from ? formatDateForApi(dateRange.from) : undefined,
    to: dateRange.to ? formatDateForApi(dateRange.to) : undefined,
  };

  const { data: salesSummary, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ["reports-sales-summary", queryParams],
    queryFn: () => reportsApi.getSalesSummary(queryParams),
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ["reports-top-products", { ...queryParams, limit: topLimit }],
    queryFn: () => reportsApi.getTopProducts({ ...queryParams, limit: topLimit }),
  });

  const { data: lowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ["reports-low-stock"],
    queryFn: () => reportsApi.getLowStock(),
  });

  const handleExportSales = () => {
    reportsApi.exportSalesSummary(queryParams);
  };

  const handleExportTopProducts = () => {
    reportsApi.exportTopProducts({ ...queryParams, limit: String(topLimit) });
  };

  const handleExportLowStock = () => {
    reportsApi.exportLowStock();
  };

  if (salesLoading || topLoading || lowStockLoading) return <LoadingState />;
  if (salesError) return <ErrorState message={salesError.message} />;

  // Calculate totals from the days array
  const totalSales = salesSummary?.totals.total || 0;
  const salesCount = salesSummary?.totals.count || 0;
  const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Top Productos
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stock Bajo
          </TabsTrigger>
        </TabsList>

        {/* Sales Summary Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="flex items-center justify-between">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onChange={(range) => setDateRange(range || {})}
            />
            <ExportButton onClick={handleExportSales} />
          </div>

          {salesSummary && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                    <p className="text-sm text-muted-foreground">
                      {salesCount} ventas en el período
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Por Método</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {salesSummary.totals.byMethod && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Efectivo:</span>
                          <span className="font-medium">{formatCurrency(salesSummary.totals.byMethod.CASH)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tarjeta:</span>
                          <span className="font-medium">{formatCurrency(salesSummary.totals.byMethod.CARD)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Transferencia:</span>
                          <span className="font-medium">{formatCurrency(salesSummary.totals.byMethod.TRANSFER)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sales chart */}
              {salesSummary.days.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Ventas por día</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesSummary.days}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => formatDate(value).slice(0, 5)}
                          />
                          <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => formatDate(label)}
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: "hsl(var(--primary))" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState title="Sin datos" description="No hay ventas en el período seleccionado" />
              )}
            </>
          )}
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onChange={(range) => setDateRange(range || {})}
              />
              <div className="flex items-center gap-2">
                <Label>Top</Label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  className="w-20"
                  value={topLimit}
                  onChange={(e) => setTopLimit(Number(e.target.value))}
                />
              </div>
            </div>
            <ExportButton onClick={handleExportTopProducts} />
          </div>

          {topProducts && topProducts.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Productos más vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="product.name"
                          type="category"
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            name === "totalQuantity" ? `${value} unidades` : formatCurrency(value),
                            name === "totalQuantity" ? "Cantidad" : "Total",
                          ]}
                        />
                        <Bar dataKey="totalQuantity" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((item, index) => (
                      <TableRow key={item.productId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell className="text-right">{item.totalQuantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <EmptyState title="Sin datos" description="No hay ventas en el período seleccionado" />
          )}
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex justify-end">
            <ExportButton onClick={handleExportLowStock} />
          </div>

          {lowStock && lowStock.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Stock actual</TableHead>
                    <TableHead className="text-right">Stock mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell className="text-right">{product.minStock}</TableCell>
                      <TableCell>
                        {product.stock === 0 ? (
                          <Badge variant="destructive">Sin stock</Badge>
                        ) : (
                          <Badge variant="outline" className="border-warning text-warning">
                            Stock bajo
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="Todo en orden"
              description="No hay productos con stock bajo"
              icon={Package}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
