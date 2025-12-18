import type {
  PaginatedResponse,
  Product,
  CreateProductDto,
  UpdateProductDto,
  Client,
  CreateClientDto,
  UpdateClientDto,
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  Sale,
  CreateSaleDto,
  Purchase,
  CreatePurchaseDto,
  CashMovement,
  CreateCashMovementDto,
  CashSummary,
  SalesSummaryReport,
  TopProduct,
  AuditLog,
  AuditEntityType,
  AuditAction,
} from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Error handling
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error de conexión" }));
    const message = Array.isArray(error.message)
      ? error.message.join(", ")
      : error.message || "Error desconocido";
    throw new ApiError(message, response.status);
  }
  return response.json();
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return handleResponse<T>(response);
}

// Query params helper
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// Export helper
export function exportFile(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        url.searchParams.set(k, v);
      }
    });
  }
  window.open(url.toString(), "_blank");
}

// Products API
export const productsApi = {
  getAll: (params: {
    search?: string;
    page?: number;
    limit?: number;
    active?: boolean;
    sortBy?: string;
    sortOrder?: string;
    priceMin?: number;
    priceMax?: number;
    stockMin?: number;
    stockMax?: number;
    lowStockOnly?: boolean;
    zeroStockOnly?: boolean;
  } = {}) =>
    fetchApi<PaginatedResponse<Product>>(
      `/products${buildQueryString(params)}`
    ),

  getById: (id: string) => fetchApi<Product>(`/products/${id}`),

  create: (data: CreateProductDto) =>
    fetchApi<Product>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateProductDto) =>
    fetchApi<Product>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/products/${id}`, { method: "DELETE" }),

  export: (params?: { search?: string; active?: boolean }) =>
    exportFile("/exports/products.xlsx", {
      search: params?.search,
      active: params?.active?.toString(),
    }),
};

// Clients API
export const clientsApi = {
  getAll: (params: {
    search?: string;
    page?: number;
    limit?: number;
    active?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}) =>
    fetchApi<PaginatedResponse<Client>>(
      `/clients${buildQueryString(params)}`
    ),

  getById: (id: string) => fetchApi<Client>(`/clients/${id}`),

  create: (data: CreateClientDto) =>
    fetchApi<Client>("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateClientDto) =>
    fetchApi<Client>(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/clients/${id}`, { method: "DELETE" }),

  export: (params?: { search?: string; active?: boolean }) =>
    exportFile("/exports/clients.xlsx", {
      search: params?.search,
      active: params?.active?.toString(),
    }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params: {
    search?: string;
    page?: number;
    limit?: number;
    active?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}) =>
    fetchApi<PaginatedResponse<Supplier>>(
      `/suppliers${buildQueryString(params)}`
    ),

  getById: (id: string) => fetchApi<Supplier>(`/suppliers/${id}`),

  create: (data: CreateSupplierDto) =>
    fetchApi<Supplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateSupplierDto) =>
    fetchApi<Supplier>(`/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/suppliers/${id}`, { method: "DELETE" }),

  export: (params?: { search?: string; active?: boolean }) =>
    exportFile("/exports/suppliers.xlsx", {
      search: params?.search,
      active: params?.active?.toString(),
    }),
};

// Sales API
export const salesApi = {
  getAll: (params: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    customerId?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) =>
    fetchApi<PaginatedResponse<Sale>>(`/sales${buildQueryString(params)}`),

  getById: (id: string) => fetchApi<Sale>(`/sales/${id}`),

  create: (data: CreateSaleDto) =>
    fetchApi<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    fetchApi<Sale>(`/sales/${id}/cancel`, { method: "POST" }),

  export: (params?: {
    from?: string;
    to?: string;
    customerId?: string;
    method?: string;
    status?: string;
  }) =>
    exportFile("/exports/sales.xlsx", params),

  exportPdf: (id: string) => exportFile(`/exports/sales/${id}.pdf`),
};

// Purchases API
export const purchasesApi = {
  getAll: (params: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    supplierId?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) =>
    fetchApi<PaginatedResponse<Purchase>>(
      `/purchases${buildQueryString(params)}`
    ),

  getById: (id: string) => fetchApi<Purchase>(`/purchases/${id}`),

  create: (data: CreatePurchaseDto) =>
    fetchApi<Purchase>("/purchases", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancel: (id: string) =>
    fetchApi<Purchase>(`/purchases/${id}/cancel`, { method: "POST" }),

  export: (params?: {
    from?: string;
    to?: string;
    supplierId?: string;
    status?: string;
  }) =>
    exportFile("/exports/purchases.xlsx", params),

  exportPdf: (id: string) => exportFile(`/exports/purchases/${id}.pdf`),
};

// Cash API
export const cashApi = {
  getMovements: (params: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    type?: "IN" | "OUT";
    method?: "CASH" | "CARD" | "TRANSFER";
    sortBy?: string;
    sortOrder?: string;
  } = {}) =>
    fetchApi<PaginatedResponse<CashMovement>>(
      `/cash/movements${buildQueryString(params)}`
    ),

  createMovement: (data: CreateCashMovementDto) =>
    fetchApi<CashMovement>("/cash/movements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSummary: (params: { from?: string; to?: string } = {}) =>
    fetchApi<CashSummary>(`/cash/summary${buildQueryString(params)}`),

  export: (params?: {
    from?: string;
    to?: string;
    type?: string;
    method?: string;
  }) =>
    exportFile("/exports/cash.xlsx", params),
};

// Reports API
export const reportsApi = {
  getSalesSummary: (params: { from?: string; to?: string } = {}) =>
    fetchApi<SalesSummaryReport>(
      `/reports/sales-summary${buildQueryString(params)}`
    ),

  getLowStock: () => fetchApi<Product[]>("/reports/low-stock"),

  getTopProducts: (params: {
    from?: string;
    to?: string;
    limit?: number;
  } = {}) =>
    fetchApi<TopProduct[]>(`/reports/top-products${buildQueryString(params)}`),

  exportSalesSummary: (params?: { from?: string; to?: string }) =>
    exportFile("/exports/reports/sales-summary.xlsx", params),

  exportTopProducts: (params?: {
    from?: string;
    to?: string;
    limit?: string;
  }) =>
    exportFile("/exports/reports/top-products.xlsx", params),

  exportLowStock: () => exportFile("/exports/reports/low-stock.xlsx"),
};

// Audit API
export const auditApi = {
  getAll: (params: {
    entityType?: AuditEntityType;
    action?: AuditAction;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}) =>
    fetchApi<PaginatedResponse<AuditLog>>(`/audit${buildQueryString(params)}`),

  getById: (id: string) => fetchApi<AuditLog>(`/audit/${id}`),
};
