export type UserRole = 'ADMIN' | 'OPERATOR' | 'SUPERVISOR' | 'SECURITY';

export type GatePassStatus = 'PENDING' | 'DISPATCHED' | 'ACKNOWLEDGED';

export type TransactionType = 'INTRA_STATE' | 'INTER_STATE';

export type PortalPage =
  | 'dashboard'
  | 'new-gatepass'
  | 'gatepass-list'
  | 'gatepass-details'
  | 'reports'
  | 'departments'
  | 'stock-master'
  | 'settings';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId: string;
  departmentName?: string;
  active: boolean;
  createdAt: string;
}

export interface StoredUser extends User {
  password: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  costCenter: string;
  hodName: string;
  active: boolean;
  createdAt: string;
}

export interface StockItem {
  id: string;
  stockNo: string;
  vendorName?: string;
  description: string;
  uom: string;
  hsnCode: string;
  invoiceNo?: string;
  quantity?: number;
  unitPrice: number;
  taxPercent: number;
  category: string;
  receiver?: string;
  entryDate?: string;
  active: boolean;
  createdAt: string;
}

export interface GatePassItem {
  id: string;
  sNo: number;
  stockNo: string;
  description: string;
  uom: string;
  hsnCode: string;
  quantity: number;
  pricePerUnit: number;
  taxPercent: number;
  igstValue: number;
  cgstValue: number;
  sgstValue: number;
  taxValue: number;
  total: number;
}

export interface DispatchDetails {
  dispatchedById: string;
  dispatchedByName: string;
  dispatchedAt: string;
  despatchThru: string;
  wayBillNo: string;
  vehicleOrCourierRef: string;
  remarks: string;
}

export interface AcknowledgementDetails {
  acknowledgedById: string;
  acknowledgedByName: string;
  acknowledgedAt: string;
  receivedBy: string;
  remarks: string;
}

export interface AuditLogEntry {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'DISPATCHED' | 'ACKNOWLEDGED';
  performedById: string;
  performedByName: string;
  timestamp: string;
  summary: string;
}

export interface GatePass {
  id: string;
  gpNo: string;
  fromAddress?: string;
  sentTo: string;
  gstNo: string;
  stCode: string;
  wayBillNo: string;
  status: GatePassStatus;
  docRefNo: string;
  departmentId: string;
  departmentName: string;
  preciousMaterial: boolean;
  returnable: boolean;
  expectedDate: string;
  appValue: number;
  appValueOverridden: boolean;
  despatchThru: string;
  transactionType: TransactionType;
  remarks: string;
  totalQuantity: number;
  totalTaxValue: number;
  grandTotal: number;
  items: GatePassItem[];
  dispatchDetails: DispatchDetails | null;
  acknowledgementDetails: AcknowledgementDetails | null;
  auditLog: AuditLogEntry[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  modifiedById: string;
  modifiedByName: string;
  modifiedAt: string;
}

export interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyGstin: string;
  homeStateCode: string;
  phone: string;
  email: string;
  gpPrefix: string;
  defaultTaxPercent: number;
  allowAuthorizedOverride: boolean;
}

export interface DashboardSummary {
  totalGatePasses: number;
  pendingCount: number;
  dispatchedCount: number;
  acknowledgedCount: number;
  totalValue: number;
  returnablePendingCount: number;
  preciousCount: number;
  recentGatePasses: GatePass[];
  departmentStats: Array<{
    departmentName: string;
    count: number;
    totalValue: number;
  }>;
}
