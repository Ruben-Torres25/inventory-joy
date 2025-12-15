// Enums
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";
export type SaleStatus = "CONFIRMED" | "CANCELED";
export type PurchaseStatus = "CONFIRMED" | "CANCELED";
export type CashMovementType = "IN" | "OUT";

export enum AuditEntityType {
  PRODUCT = "PRODUCT",
  CLIENT = "CLIENT",
  SUPPLIER = "SUPPLIER",
  SALE = "SALE",
  PURCHASE = "PURCHASE",
  CASH = "CASH"
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DEACTIVATE = "DEACTIVATE",
  CANCEL = "CANCEL",
  MANUAL = "MANUAL"
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Product
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  minStock: number;
  isActive?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  minStock?: number;
  isActive?: boolean;
}

// Client
export interface Client {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// Supplier
export interface Supplier {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  name?: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// Sale
export interface SaleItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  customerId?: string;
  customer?: Client;
  items: SaleItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
}

export interface CreateSaleDto {
  customerId?: string | null;
  items: CreateSaleItemDto[];
  discountPercent?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

// Purchase
export interface PurchaseItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  supplierId?: string;
  supplier?: Supplier;
  items: PurchaseItem[];
  total: number;
  status: PurchaseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseItemDto {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseDto {
  supplierId?: string | null;
  items: CreatePurchaseItemDto[];
  notes?: string;
}

// Cash
export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  method: PaymentMethod;
  description: string;
  relatedSaleId?: string;
  relatedPurchaseId?: string;
  createdAt: string;
}

export interface CreateCashMovementDto {
  type: CashMovementType;
  amount: number;
  method: PaymentMethod;
  description: string;
}

export interface CashSummary {
  in: {
    total: number;
    byMethod: {
      CASH: number;
      CARD: number;
      TRANSFER: number;
    };
  };
  out: {
    total: number;
    byMethod: {
      CASH: number;
      CARD: number;
      TRANSFER: number;
    };
  };
  net: number;
}

// Reports
export interface SalesDayReport {
  date: string;
  count: number;
  total: number;
  byMethod: {
    CASH: number;
    CARD: number;
    TRANSFER: number;
  };
}

export interface SalesSummaryReport {
  from: string | null;
  to: string | null;
  days: SalesDayReport[];
  totals: {
    count: number;
    total: number;
    byMethod: {
      CASH: number;
      CARD: number;
      TRANSFER: number;
    };
  };
}

export interface TopProduct {
  productId: string;
  product: Product;
  totalQuantity: number;
  totalRevenue: number;
}

// Audit
export interface AuditLog {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  summary: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}
