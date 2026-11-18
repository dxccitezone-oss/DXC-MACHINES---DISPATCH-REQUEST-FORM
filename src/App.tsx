import { useCallback, useEffect, useState } from 'react';
import { DepartmentMasterPage } from './components/DepartmentMasterPage';
import { DashboardPage } from './components/DashboardPage';
import { GatePassDetailsPage } from './components/GatePassDetailsPage';
import { GatePassEntryForm } from './components/GatePassEntryForm';
import { GatePassListPage } from './components/GatePassListPage';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import { ReportsPage } from './components/ReportsPage';
import { SettingsPage } from './components/SettingsPage';
import { StockMasterPage } from './components/StockMasterPage';
import { ToastContainer, type ToastItem } from './components/ToastContainer';
import { UserManagementPage } from './components/UserManagementPage';
import { api, getStoredUserId, type SaveGatePassPayload } from './services/api';
import type {
  CompanySettings,
  DashboardSummary,
  Department,
  GatePass,
  PortalPage,
  StockItem,
  User,
  UserRole,
} from './types/gatepass';

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'TJD Industries Pvt. Ltd.',
  companyAddress: 'Plot No. B-42, MIDC Chakan Industrial Area, Phase II, Pune - 410501',
  companyGstin: '27AABCT4829K1Z8',
  homeStateCode: '27',
  phone: '+91 20 6712 4800',
  email: 'stores@tjdindustries.in',
  gpPrefix: 'TJD/NSGP/2026-27/',
  defaultTaxPercent: 18,
  allowAuthorizedOverride: true,
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const [currentPage, setCurrentPage] = useState<PortalPage>('new-gatepass');
  const [loadingData, setLoadingData] = useState<boolean>(false);

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [nextGpNo, setNextGpNo] = useState<string>('TJD/NSGP/2026-27/0001');

  const [editingGatePass, setEditingGatePass] = useState<GatePass | null>(null);
  const [formResetKey, setFormResetKey] = useState<number>(0);
  const [selectedDetailsGp, setSelectedDetailsGp] = useState<GatePass | null>(null);
  const [printTargetGp, setPrintTargetGp] = useState<GatePass | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback(
    (type: ToastItem['type'], title: string, message?: string) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadPortalData = useCallback(
    async (user: User) => {
      setLoadingData(true);
      try {
        const [dash, gpList, deptList, stockList, cfg, nextNo] = await Promise.all([
          api.getDashboard(),
          api.listGatePasses(),
          api.listDepartments(),
          api.listStockItems(),
          api.getSettings(),
          api.getNextGpNumber(),
        ]);

        setDashboard(dash);
        setGatePasses(gpList);
        setDepartments(deptList);
        setStockItems(stockList);
        setSettings(cfg);
        setNextGpNo(nextNo);

        if (user.role === 'ADMIN') {
          const userList = await api.listUsers();
          setUsers(userList);
        } else {
          setUsers([]);
        }
      } catch (err) {
        notify(
          'error',
          'Data Load Failed',
          err instanceof Error ? err.message : 'Unable to load portal data.'
        );
      } finally {
        setLoadingData(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    const restoreSession = async () => {
      const storedId = getStoredUserId();
      if (!storedId) {
        setAuthChecking(false);
        return;
      }
      try {
        const user = await api.me();
        setCurrentUser(user);
        await loadPortalData(user);
      } catch {
        api.logout();
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    };
    restoreSession();
  }, [loadPortalData]);

  const handleLogin = async (username: string, password: string): Promise<User | null> => {
    const user = await api.login(username, password);
    setCurrentUser(user);
    setCurrentPage('new-gatepass');
    setEditingGatePass(null);
    await loadPortalData(user);
    notify('success', `Welcome, ${user.fullName}`, `Signed in as ${user.role}`);
    return user;
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setEditingGatePass(null);
    setSelectedDetailsGp(null);
    setPrintTargetGp(null);
    setCurrentPage('new-gatepass');
  };

  const refreshGatePassState = async (updatedGp?: GatePass) => {
    if (!currentUser) return;
    const [dash, gpList, nextNo] = await Promise.all([
      api.getDashboard(),
      api.listGatePasses(),
      api.getNextGpNumber(),
    ]);
    setDashboard(dash);
    setGatePasses(gpList);
    setNextGpNo(nextNo);

    if (updatedGp) {
      setEditingGatePass((prev) => (prev?.id === updatedGp.id ? updatedGp : prev));
      setSelectedDetailsGp((prev) => (prev?.id === updatedGp.id ? updatedGp : prev));
    }
  };

  const handleSaveGatePass = async (payload: SaveGatePassPayload): Promise<GatePass | null> => {
    try {
      const saved = await api.saveGatePass(payload);
      setEditingGatePass(saved);
      await refreshGatePassState(saved);
      notify(
        'success',
        'Gate Pass Saved & Excel Updated',
        `${saved.gpNo} (${saved.status}) synced to TJD_NON_STOCK_GATEPASS_REGISTER.xlsx.`
      );
      return saved;
    } catch (err) {
      notify(
        'error',
        'Save Failed',
        err instanceof Error ? err.message : 'Could not save Gate Pass.'
      );
      return null;
    }
  };

  const handleDispatchGatePass = async (
    id: string,
    payload: { vehicleOrCourierRef?: string; dispatchRemarks?: string }
  ): Promise<GatePass | null> => {
    try {
      const dispatched = await api.dispatchGatePass(id, payload);
      await refreshGatePassState(dispatched);
      notify(
        'success',
        'Dispatch Confirmed & Excel Updated',
        `${dispatched.gpNo} marked DISPATCHED in Dispatch Register sheet.`
      );
      return dispatched;
    } catch (err) {
      notify(
        'error',
        'Dispatch Failed',
        err instanceof Error ? err.message : 'Unable to confirm dispatch.'
      );
      return null;
    }
  };

  const handleAcknowledgeGatePass = async (
    id: string,
    payload: { receivedBy: string; remarks?: string }
  ): Promise<GatePass | null> => {
    try {
      const acked = await api.acknowledgeGatePass(id, payload);
      await refreshGatePassState(acked);
      notify(
        'success',
        'Acknowledgement Confirmed & Excel Updated',
        `${acked.gpNo} recorded in Acknowledgement Register sheet.`
      );
      return acked;
    } catch (err) {
      notify(
        'error',
        'Acknowledgement Failed',
        err instanceof Error ? err.message : 'Unable to acknowledge Gate Pass.'
      );
      return null;
    }
  };

  const handleDownloadExcel = async () => {
    try {
      await api.downloadExcelRegister();
      notify(
        'success',
        'Excel Workbook Downloaded',
        'TJD_NON_STOCK_GATEPASS_REGISTER.xlsx downloaded with all 4 worksheets.'
      );
    } catch (err) {
      notify(
        'error',
        'Excel Export Failed',
        err instanceof Error ? err.message : 'Could not download Excel file.'
      );
    }
  };

  const handleOpenNewForm = async () => {
    setEditingGatePass(null);
    setFormResetKey((k) => k + 1);
    setCurrentPage('new-gatepass');
    try {
      const nextNo = await api.getNextGpNumber();
      setNextGpNo(nextNo);
    } catch {
      // keep existing nextGpNo
    }
  };

  const handleOpenInForm = (gp: GatePass) => {
    setEditingGatePass(gp);
    setCurrentPage('new-gatepass');
  };

  const handleViewDetails = (gp: GatePass) => {
    setSelectedDetailsGp(gp);
    setCurrentPage('gatepass-details');
  };

  const handleSaveDepartment = async (
    dept: Partial<Department> & { code: string; name: string }
  ): Promise<boolean> => {
    try {
      await api.saveDepartment(dept);
      const list = await api.listDepartments();
      setDepartments(list);
      notify('success', 'Department Saved', `${dept.code} - ${dept.name}`);
      return true;
    } catch (err) {
      notify(
        'error',
        'Department Save Failed',
        err instanceof Error ? err.message : 'Unable to save department.'
      );
      return false;
    }
  };

  const handleSaveStockItem = async (
    item: Partial<StockItem> & { stockNo: string; description: string }
  ): Promise<boolean> => {
    try {
      await api.saveStockItem(item);
      const list = await api.listStockItems();
      setStockItems(list);
      notify('success', 'Stock Item Saved', `${item.stockNo} updated in catalog.`);
      return true;
    } catch (err) {
      notify(
        'error',
        'Stock Item Save Failed',
        err instanceof Error ? err.message : 'Unable to save stock item.'
      );
      return false;
    }
  };

  const handleSaveUser = async (
    user: Partial<User> & {
      username: string;
      fullName: string;
      email: string;
      role: UserRole;
      password?: string;
    }
  ): Promise<boolean> => {
    try {
      await api.saveUser(user);
      const list = await api.listUsers();
      setUsers(list);
      notify('success', 'User Saved', `${user.fullName} (${user.role})`);
      return true;
    } catch (err) {
      notify(
        'error',
        'User Save Failed',
        err instanceof Error ? err.message : 'Unable to save user.'
      );
      return false;
    }
  };

  const handleSaveSettings = async (next: CompanySettings): Promise<boolean> => {
    try {
      const updated = await api.updateSettings(next);
      setSettings(updated);
      const nextNo = await api.getNextGpNumber();
      setNextGpNo(nextNo);
      notify('success', 'Settings Saved', 'Portal configuration updated.');
      return true;
    } catch (err) {
      notify(
        'error',
        'Settings Save Failed',
        err instanceof Error ? err.message : 'Unable to save settings.'
      );
      return false;
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#EAECF3] flex items-center justify-center text-sm font-semibold text-[#2B3352]">
        Loading TJD Gate Pass Portal...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <Layout
        currentPage={currentPage}
        currentUser={currentUser}
        hasSelectedGatePass={Boolean(selectedDetailsGp)}
        onNavigate={setCurrentPage}
        onNewGatePass={handleOpenNewForm}
        onLogout={handleLogout}
      >
        {currentPage === 'dashboard' && (
          <DashboardPage
            summary={dashboard}
            loading={loadingData}
            onNewGatePass={handleOpenNewForm}
            onOpenGatePass={handleOpenInForm}
            onViewDetails={handleViewDetails}
            onNavigateList={() => setCurrentPage('gatepass-list')}
          />
        )}

        {currentPage === 'new-gatepass' && (
          <GatePassEntryForm
            key={editingGatePass ? editingGatePass.id : `new-${formResetKey}`}
            currentUser={currentUser}
            departments={departments}
            stockItems={stockItems}
            settings={settings}
            editingGatePass={editingGatePass}
            nextGpNo={nextGpNo}
            onSave={handleSaveGatePass}
            onDispatch={handleDispatchGatePass}
            onAcknowledge={handleAcknowledgeGatePass}
            onCallReport={() => setCurrentPage('reports')}
            onPrintInvoice={(gp) => setPrintTargetGp(gp)}
            onDownloadExcel={handleDownloadExcel}
            onResetToNew={handleOpenNewForm}
            onNotify={notify}
          />
        )}

        {currentPage === 'gatepass-list' && (
          <GatePassListPage
            gatePasses={gatePasses}
            departments={departments}
            loading={loadingData}
            onNewGatePass={handleOpenNewForm}
            onOpenInForm={handleOpenInForm}
            onViewDetails={handleViewDetails}
            onPrint={(gp) => setPrintTargetGp(gp)}
            onDownloadExcel={handleDownloadExcel}
          />
        )}

        {currentPage === 'gatepass-details' && (
          <GatePassDetailsPage
            gatePass={selectedDetailsGp}
            currentUser={currentUser}
            onBack={() => setCurrentPage('gatepass-list')}
            onEditInForm={handleOpenInForm}
            onPrint={(gp) => setPrintTargetGp(gp)}
            onDispatch={handleDispatchGatePass}
            onAcknowledge={handleAcknowledgeGatePass}
          />
        )}

        {currentPage === 'reports' && (
          <ReportsPage
            gatePasses={gatePasses}
            departments={departments}
            onViewDetails={handleViewDetails}
            onOpenInForm={handleOpenInForm}
            onPrint={(gp) => setPrintTargetGp(gp)}
            onDownloadExcel={handleDownloadExcel}
          />
        )}

        {currentPage === 'departments' && (
          <DepartmentMasterPage
            departments={departments}
            currentUser={currentUser}
            onSaveDepartment={handleSaveDepartment}
          />
        )}

        {currentPage === 'stock-master' && (
          <StockMasterPage
            stockItems={stockItems}
            currentUser={currentUser}
            onSaveStockItem={handleSaveStockItem}
          />
        )}

        {currentPage === 'users' && (
          <UserManagementPage
            users={users}
            departments={departments}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            currentUser={currentUser}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </Layout>

      <PrintInvoiceModal
        open={Boolean(printTargetGp)}
        gatePass={printTargetGp}
        settings={settings}
        onClose={() => setPrintTargetGp(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
