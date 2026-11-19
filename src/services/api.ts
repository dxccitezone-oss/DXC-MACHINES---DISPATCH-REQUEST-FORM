import type {
  CompanySettings,
  DashboardSummary,
  Department,
  GatePass,
  GatePassItem,
  StockItem,
  TransactionType,
  User,
} from '../types/gatepass';

const SESSION_KEY = 'tjd_gatepass_session_user_id';

export function getStoredUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(SESSION_KEY, userId);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore storage error
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const userId = getStoredUserId() || 'usr_admin';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  headers['x-user-id'] = userId;

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export interface SaveGatePassPayload {
  id?: string;
  gpNo?: string;
  fromAddress: string;
  sentTo: string;
  gstNo: string;
  stCode: string;
  wayBillNo: string;
  docRefNo: string;
  departmentId: string;
  departmentName?: string;
  preciousMaterial: boolean;
  returnable: boolean;
  expectedDate: string;
  appValue: number;
  appValueOverridden: boolean;
  despatchThru: string;
  transactionType: TransactionType;
  remarks: string;
  items: GatePassItem[];
}

export const api = {
  login: async (username: string, password: string): Promise<User> => {
    const res = await request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setStoredUserId(res.user.id);
    return res.user;
  },

  me: async (): Promise<User> => {
    const res = await request<{ user: User }>('/api/auth/me');
    return res.user;
  },

  logout: () => {
    setStoredUserId(null);
  },

  getDashboard: (): Promise<DashboardSummary> => request<DashboardSummary>('/api/dashboard'),

  getNextGpNumber: async (): Promise<string> => {
    const res = await request<{ gpNo: string }>('/api/gate-passes/next-number');
    return res.gpNo;
  },

  listGatePasses: async (): Promise<GatePass[]> => {
    const res = await request<{ gatePasses: GatePass[] }>('/api/gate-passes');
    return res.gatePasses;
  },

  getGatePass: async (id: string): Promise<GatePass> => {
    const res = await request<{ gatePass: GatePass }>(`/api/gate-passes/${encodeURIComponent(id)}`);
    return res.gatePass;
  },

  saveGatePass: async (payload: SaveGatePassPayload): Promise<GatePass> => {
    const url = payload.id
      ? `/api/gate-passes/${encodeURIComponent(payload.id)}`
      : '/api/gate-passes';
    const method = payload.id ? 'PUT' : 'POST';
    const res = await request<{ gatePass: GatePass }>(url, {
      method,
      body: JSON.stringify(payload),
    });
    return res.gatePass;
  },

  dispatchGatePass: async (
    id: string,
    payload: { vehicleOrCourierRef?: string; dispatchRemarks?: string }
  ): Promise<GatePass> => {
    const res = await request<{ gatePass: GatePass }>(
      `/api/gate-passes/${encodeURIComponent(id)}/dispatch`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.gatePass;
  },

  acknowledgeGatePass: async (
    id: string,
    payload: { receivedBy: string; remarks?: string }
  ): Promise<GatePass> => {
    const res = await request<{ gatePass: GatePass }>(
      `/api/gate-passes/${encodeURIComponent(id)}/acknowledge`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.gatePass;
  },

  listDepartments: async (): Promise<Department[]> => {
    const res = await request<{ departments: Department[] }>('/api/departments');
    return res.departments;
  },

  saveDepartment: async (
    dept: Partial<Department> & { code: string; name: string }
  ): Promise<Department> => {
    const url = dept.id
      ? `/api/departments/${encodeURIComponent(dept.id)}`
      : '/api/departments';
    const method = dept.id ? 'PUT' : 'POST';
    const res = await request<{ department: Department }>(url, {
      method,
      body: JSON.stringify(dept),
    });
    return res.department;
  },

  listStockItems: async (): Promise<StockItem[]> => {
    const res = await request<{ stockItems: StockItem[] }>('/api/stock-items');
    return res.stockItems;
  },

  saveStockItem: async (
    item: Partial<StockItem> & { description: string; vendorName?: string; stockNo?: string }
  ): Promise<StockItem> => {
    const url = item.id
      ? `/api/stock-items/${encodeURIComponent(item.id)}`
      : '/api/stock-items';
    const method = item.id ? 'PUT' : 'POST';
    const res = await request<{ stockItem: StockItem }>(url, {
      method,
      body: JSON.stringify(item),
    });
    return res.stockItem;
  },

  listUsers: async (): Promise<User[]> => {
    const res = await request<{ users: User[] }>('/api/users');
    return res.users;
  },

  saveUser: async (
    user: Partial<User> & {
      username: string;
      fullName: string;
      email: string;
      role: User['role'];
      password?: string;
    }
  ): Promise<User> => {
    const url = user.id ? `/api/users/${encodeURIComponent(user.id)}` : '/api/users';
    const method = user.id ? 'PUT' : 'POST';
    const res = await request<{ user: User }>(url, {
      method,
      body: JSON.stringify(user),
    });
    return res.user;
  },

  getSettings: async (): Promise<CompanySettings> => {
    const res = await request<{ settings: CompanySettings }>('/api/settings');
    return res.settings;
  },

  updateSettings: async (settings: CompanySettings): Promise<CompanySettings> => {
    const res = await request<{ settings: CompanySettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return res.settings;
  },

  getExcelInfo: (): Promise<{
    fileName: string;
    exists: boolean;
    sizeBytes: number;
    updatedAt: string | null;
    totalGatePasses: number;
  }> => request('/api/export/excel/info'),

  downloadExcelRegister: async (): Promise<void> => {
    const userId = getStoredUserId() || 'usr_admin';
    const headers: Record<string, string> = { 'x-user-id': userId };

    const res = await fetch('/api/export/excel', { headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to download Excel register.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'TJD_NON_STOCK_GATEPASS_REGISTER.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
