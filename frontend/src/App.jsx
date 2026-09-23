import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Pencil,
  RefreshCw,
  ReceiptText,
  Search,
  Table2,
  Trash2,
  Utensils,
  UserCircle2,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import './index.css';
import KotApp from './components/KotApp';
import Login from './components/Login';
import KotHistoryPage from './components/KotHistoryPage';
import api from './services/api';

const CASHIER_TOKEN_KEY = 'cashier_access_token';
const CASHIER_USER_KEY = 'cashier_user';
const ADMIN_TOKEN_KEY = 'admin_access_token';
const ADMIN_USER_KEY = 'admin_user';

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function KotMenuBar({
  refreshKey,
  onOpenHistory,
  onOpenOldKots,
  tableNo,
  onTableNoChange,
  waiterId,
  onWaiterChange,
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  const [waiterSearch, setWaiterSearch] = useState('');
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const [isWaiterDropdownOpen, setIsWaiterDropdownOpen] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isWaiterLoading, setIsWaiterLoading] = useState(false);
  const [tableError, setTableError] = useState('');
  const [waiterError, setWaiterError] = useState('');
  const [kotCount, setKotCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const tableDropdownRef = useRef(null);
  const waiterDropdownRef = useRef(null);

  const selectedTable = tables.find((table) => String(table.id) === String(tableNo));
  const selectedWaiter = waiters.find((waiter) => String(waiter.id) === String(waiterId));
  const filteredTables = tables.filter((table) => {
    const search = tableSearch.trim().toLowerCase();

    if (!search || selectedTable?.name === tableSearch) {
      return true;
    }

    return [table.name, table.restaurant]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });
  const filteredWaiters = waiters.filter((waiter) => {
    const search = waiterSearch.trim().toLowerCase();

    if (!search || selectedWaiter?.name === waiterSearch) {
      return true;
    }

    return [waiter.name, waiter.code]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

  const fetchTables = useCallback(async () => {
    setIsTableLoading(true);
    setTableError('');

    try {
      const { data } = await api.get('/table-no');
      setTables(data);
    } catch (err) {
      setTableError(err.response?.data?.message || 'Unable to load tables.');
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  const fetchWaiters = useCallback(async () => {
    setIsWaiterLoading(true);
    setWaiterError('');

    try {
      const { data } = await api.get('/waiters');
      setWaiters(data);
    } catch (err) {
      setWaiterError(err.response?.data?.message || 'Unable to load waiters.');
    } finally {
      setIsWaiterLoading(false);
    }
  }, []);

  const fetchKotCount = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data } = await api.get('/kots/my-count', {
        params: { date: selectedDate },
      });

      setKotCount(Number(data.kot_count) || 0);
      setTotalAmount(Number(data.total_amount) || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load KOT count.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchKotCount();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchKotCount, refreshKey]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTables();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchTables]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchWaiters();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchWaiters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTableSearch(selectedTable?.name || '');
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedTable]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setWaiterSearch(selectedWaiter?.name || '');
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedWaiter]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        tableDropdownRef.current &&
        !tableDropdownRef.current.contains(event.target)
      ) {
        setIsTableDropdownOpen(false);
      }

      if (
        waiterDropdownRef.current &&
        !waiterDropdownRef.current.contains(event.target)
      ) {
        setIsWaiterDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm p-3 sm:p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div ref={tableDropdownRef} className="relative">
          <label htmlFor="table-no" className="block text-xs font-medium text-orange-700 mb-1">
            Table No <span className="text-red-500">*mandatory</span>
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="table-no"
              placeholder="Search table"
              className="w-full border border-orange-200 rounded-md pl-8 pr-14 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={tableSearch}
              onFocus={() => setIsTableDropdownOpen(true)}
              onChange={(event) => {
                setTableSearch(event.target.value);
                setIsTableDropdownOpen(true);
                onTableNoChange('', '');
              }}
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch('');
                  onTableNoChange('', '');
                  setIsTableDropdownOpen(true);
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                title="Clear table"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsTableDropdownOpen((value) => !value)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-orange-700 hover:bg-orange-50"
              title="Open tables"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {isTableDropdownOpen && (
            <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-orange-200 rounded-md shadow-lg">
              {isTableLoading && (
                <div className="px-3 py-3 text-sm text-neutral-400">Loading tables...</div>
              )}
              {!isTableLoading && tableError && (
                <button
                  type="button"
                  onClick={fetchTables}
                  className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  {tableError}
                </button>
              )}
              {!isTableLoading && !tableError && filteredTables.length === 0 && (
                <div className="px-3 py-3 text-sm text-neutral-400">No tables found.</div>
              )}
              {!isTableLoading && !tableError && filteredTables.map((table) => (
                <button
                  type="button"
                  key={table.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onTableNoChange(String(table.id), table.name);
                    setTableSearch(table.name);
                    setIsTableDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50"
                >
                  <span className="block font-medium text-neutral-800">{table.name}</span>
                  {table.restaurant && (
                    <span className="block text-xs text-neutral-400">{table.restaurant}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={waiterDropdownRef} className="relative">
          <label htmlFor="waiter" className="block text-xs font-medium text-orange-700 mb-1">
            Waiter <span className="text-red-500">*mandatory</span>
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="waiter"
              placeholder="Search waiter"
              className="w-full border border-orange-200 rounded-md pl-8 pr-14 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={waiterSearch}
              onFocus={() => setIsWaiterDropdownOpen(true)}
              onChange={(event) => {
                setWaiterSearch(event.target.value);
                setIsWaiterDropdownOpen(true);
                onWaiterChange('', '');
              }}
            />
            {waiterSearch && (
              <button
                type="button"
                onClick={() => {
                  setWaiterSearch('');
                  onWaiterChange('', '');
                  setIsWaiterDropdownOpen(true);
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                title="Clear waiter"
              >
                <X size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsWaiterDropdownOpen((value) => !value)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-orange-700 hover:bg-orange-50"
              title="Open waiters"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {isWaiterDropdownOpen && (
            <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-orange-200 rounded-md shadow-lg">
              {isWaiterLoading && (
                <div className="px-3 py-3 text-sm text-neutral-400">Loading waiters...</div>
              )}
              {!isWaiterLoading && waiterError && (
                <button
                  type="button"
                  onClick={fetchWaiters}
                  className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  {waiterError}
                </button>
              )}
              {!isWaiterLoading && !waiterError && filteredWaiters.length === 0 && (
                <div className="px-3 py-3 text-sm text-neutral-400">No waiters found.</div>
              )}
              {!isWaiterLoading && !waiterError && filteredWaiters.map((waiter) => (
                <button
                  type="button"
                  key={waiter.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onWaiterChange(String(waiter.id), waiter.name);
                    setWaiterSearch(waiter.name);
                    setIsWaiterDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50"
                >
                  <span className="block font-medium text-neutral-800">{waiter.name}</span>
                  {waiter.code && (
                    <span className="block text-xs text-neutral-400">{waiter.code}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="kot-count-date" className="block text-xs font-medium text-orange-700 mb-1">
            Date
          </label>
          <input
            id="kot-count-date"
            type="date"
            className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <button
          type="button"
          onClick={() => onOpenHistory(selectedDate)}
          className="flex items-center gap-2 min-w-0 text-left rounded-md bg-orange-50/70 border border-orange-100 px-3 py-2 hover:bg-orange-100"
        >
          <div className="w-9 h-9 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
              KOT ({isLoading ? '...' : kotCount})
            </div>
            <div className="text-sm font-semibold text-neutral-900">
              Rs. {isLoading ? '...' : totalAmount.toFixed(2)}
            </div>
          </div>
          <ChevronRight size={16} className="text-orange-600 flex-shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onOpenOldKots(selectedDate)}
          className="flex items-center gap-2 min-w-0 text-left rounded-md bg-white border border-neutral-200 px-3 py-2 hover:bg-neutral-50"
        >
          <div className="w-9 h-9 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center flex-shrink-0">
            <ReceiptText size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">
              Old KOTs
            </div>
            <div className="text-sm font-semibold text-neutral-900">
              Settled history
            </div>
          </div>
          <ChevronRight size={16} className="text-neutral-500 flex-shrink-0" />
        </button>

        <button
          type="button"
          onClick={fetchKotCount}
          disabled={isLoading}
          className="w-9 h-9 flex items-center justify-center bg-white border border-orange-200 text-orange-700 rounded-md hover:bg-orange-100 disabled:text-orange-300 flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {(error || tableError || waiterError) && (
        <div className="mt-3 text-sm text-red-600 font-medium">
          {error || tableError || waiterError}
        </div>
      )}
    </section>
  );
}

function AdminDashboard({ admin, onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [menuName, setMenuName] = useState('');
  const [menuCode, setMenuCode] = useState('');
  const [menuRate, setMenuRate] = useState('');
  const [menuTaxRate, setMenuTaxRate] = useState('');
  const [tableName, setTableName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [waiterName, setWaiterName] = useState('');
  const [waiterCode, setWaiterCode] = useState('');
  const [editingCashierId, setEditingCashierId] = useState(null);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [editingTableId, setEditingTableId] = useState(null);
  const [editingWaiterId, setEditingWaiterId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingMenuItem, setIsCreatingMenuItem] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isCreatingWaiter, setIsCreatingWaiter] = useState(false);
  const [cashierMessage, setCashierMessage] = useState('');
  const [cashierError, setCashierError] = useState('');
  const [menuMessage, setMenuMessage] = useState('');
  const [menuError, setMenuError] = useState('');
  const [tableMessage, setTableMessage] = useState('');
  const [tableError, setTableError] = useState('');
  const [waiterMessage, setWaiterMessage] = useState('');
  const [waiterError, setWaiterError] = useState('');
  const [stats, setStats] = useState({
    cashiers: 0,
    waiters: 0,
    menuItems: 0,
    tables: 0,
    kots: 0,
    runningKots: 0,
  });
  const [adminLists, setAdminLists] = useState({
    cashiers: [],
    waiters: [],
    menuItems: [],
    tables: [],
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [reportStartDate, setReportStartDate] = useState(getTodayDate);
  const [reportEndDate, setReportEndDate] = useState(getTodayDate);
  const [reportData, setReportData] = useState(null);
  const [reportDownloadType, setReportDownloadType] = useState('kot');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isReportDownloading, setIsReportDownloading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isAdminPasswordSaving, setIsAdminPasswordSaving] = useState(false);
  const [adminPasswordMessage, setAdminPasswordMessage] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');

  const fetchAdminStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError('');

    try {
      const [cashiersResponse, waitersResponse, menuResponse, tablesResponse, kotsResponse] =
        await Promise.all([
          api.get('/cashiers'),
          api.get('/waiters'),
          api.get('/menu'),
          api.get('/table-no'),
          api.get('/kots/total-count'),
        ]);

      const cashiers = cashiersResponse.data.filter((cashier) => cashier.type !== 'admin');
      const waiters = waitersResponse.data;
      const menuItems = menuResponse.data;
      const tables = tablesResponse.data;

      setStats({
        cashiers: cashiers.length,
        waiters: waiters.length,
        menuItems: menuItems.length,
        tables: tables.length,
        kots: Number(kotsResponse.data.total_kot_count ?? kotsResponse.data.kot_count) || 0,
        runningKots: Number(kotsResponse.data.running_kot_count) || 0,
      });
      setAdminLists({
        cashiers,
        waiters,
        menuItems,
        tables,
      });
    } catch (err) {
      setStatsError(err.response?.data?.message || 'Unable to load dashboard totals.');
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAdminStats();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchAdminStats]);

  const fetchReport = useCallback(async () => {
    setIsReportLoading(true);
    setReportError('');

    try {
      const { data } = await api.get('/bill/report', {
        params: {
          start_date: reportStartDate,
          end_date: reportEndDate,
        },
      });

      setReportData(data);
    } catch (err) {
      setReportError(err.response?.data?.message || 'Unable to load report.');
    } finally {
      setIsReportLoading(false);
    }
  }, [reportStartDate, reportEndDate]);

  const downloadReportPdf = async () => {
    setIsReportDownloading(true);
    setReportError('');

    try {
      const response = await api.get('/bill/report/pdf', {
        params: {
          start_date: reportStartDate,
          end_date: reportEndDate,
          type: reportDownloadType,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: 'application/pdf',
      }));
      const link = document.createElement('a');

      link.href = url;
      link.download = `${reportDownloadType}-report-${reportStartDate}-${reportEndDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setReportError(err.response?.data?.message || 'Unable to download report PDF.');
    } finally {
      setIsReportDownloading(false);
    }
  };

  useEffect(() => {
    if (activeSection !== 'reports') {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      fetchReport();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [activeSection, fetchReport]);

  const saveCashier = async (event) => {
    event.preventDefault();
    setCashierMessage('');
    setCashierError('');
    setIsCreating(true);

    try {
      const payload = {
        username: username.trim(),
        ...(password ? { password } : {}),
      };
      const { data } = editingCashierId
        ? await api.patch(`/cashiers/${editingCashierId}`, payload)
        : await api.post('/cashiers', {
          username: username.trim(),
          password,
        });

      setCashierMessage(`Cashier "${data.username}" ${editingCashierId ? 'updated' : 'created'} successfully.`);
      setUsername('');
      setPassword('');
      setEditingCashierId(null);
      fetchAdminStats();
    } catch (err) {
      setCashierError(err.response?.data?.message || 'Unable to create cashier.');
    } finally {
      setIsCreating(false);
    }
  };

  const saveMenuItem = async (event) => {
    event.preventDefault();
    setMenuMessage('');
    setMenuError('');
    setIsCreatingMenuItem(true);

    try {
      const payload = {
        name: menuName.trim(),
        code: menuCode.trim() || undefined,
        srate: Number(menuRate),
        trate: menuTaxRate.trim() || undefined,
      };
      const { data } = editingMenuItemId
        ? await api.patch(`/menu/${editingMenuItemId}`, payload)
        : await api.post('/menu', payload);

      setMenuMessage(`Menu item "${data.name}" ${editingMenuItemId ? 'updated' : 'added'} successfully.`);
      setMenuName('');
      setMenuCode('');
      setMenuRate('');
      setMenuTaxRate('');
      setEditingMenuItemId(null);
      fetchAdminStats();
    } catch (err) {
      setMenuError(err.response?.data?.message || 'Unable to add menu item.');
    } finally {
      setIsCreatingMenuItem(false);
    }
  };

  const saveTable = async (event) => {
    event.preventDefault();
    setTableMessage('');
    setTableError('');
    setIsCreatingTable(true);

    try {
      const payload = {
        name: tableName.trim(),
        restaurant: restaurantName.trim() || undefined,
      };
      const { data } = editingTableId
        ? await api.patch(`/table-no/${editingTableId}`, payload)
        : await api.post('/table-no', payload);

      setTableMessage(`Table "${data.name}" ${editingTableId ? 'updated' : 'added'} successfully.`);
      setTableName('');
      setRestaurantName('');
      setEditingTableId(null);
      fetchAdminStats();
    } catch (err) {
      setTableError(err.response?.data?.message || 'Unable to add table.');
    } finally {
      setIsCreatingTable(false);
    }
  };

  const saveWaiter = async (event) => {
    event.preventDefault();
    setWaiterMessage('');
    setWaiterError('');
    setIsCreatingWaiter(true);

    try {
      const payload = {
        name: waiterName.trim(),
        code: waiterCode.trim(),
      };
      const { data } = editingWaiterId
        ? await api.patch(`/waiters/${editingWaiterId}`, payload)
        : await api.post('/waiters', payload);

      setWaiterMessage(`Waiter "${data.name}" ${editingWaiterId ? 'updated' : 'added'} successfully.`);
      setWaiterName('');
      setWaiterCode('');
      setEditingWaiterId(null);
      fetchAdminStats();
    } catch (err) {
      setWaiterError(err.response?.data?.message || 'Unable to add waiter.');
    } finally {
      setIsCreatingWaiter(false);
    }
  };

  const startCashierEdit = (cashier) => {
    setEditingCashierId(cashier.id);
    setUsername(cashier.username);
    setPassword('');
    setCashierMessage('');
    setCashierError('');
  };

  const resetCashierForm = () => {
    setEditingCashierId(null);
    setUsername('');
    setPassword('');
  };

  const changeAdminPassword = async (event) => {
    event.preventDefault();
    setAdminPasswordMessage('');
    setAdminPasswordError('');

    if (newAdminPassword !== confirmAdminPassword) {
      setAdminPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsAdminPasswordSaving(true);

    try {
      await api.post('/auth/admin/change-password', {
        currentPassword: currentAdminPassword,
        newPassword: newAdminPassword,
      });

      setAdminPasswordMessage('Admin password changed successfully.');
      setCurrentAdminPassword('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      setIsAdminPasswordOpen(false);
    } catch (err) {
      setAdminPasswordError(err.response?.data?.message || 'Unable to change admin password.');
    } finally {
      setIsAdminPasswordSaving(false);
    }
  };

  const startMenuEdit = (item) => {
    setEditingMenuItemId(item.id);
    setMenuName(item.name || '');
    setMenuCode(item.code || '');
    setMenuRate(String(item.srate || ''));
    setMenuTaxRate(item.trate ? String(item.trate) : '');
    setMenuMessage('');
    setMenuError('');
  };

  const startTableEdit = (table) => {
    setEditingTableId(table.id);
    setTableName(table.name || '');
    setRestaurantName(table.restaurant || '');
    setTableMessage('');
    setTableError('');
  };

  const startWaiterEdit = (waiter) => {
    setEditingWaiterId(waiter.id);
    setWaiterName(waiter.name || '');
    setWaiterCode(waiter.code || '');
    setWaiterMessage('');
    setWaiterError('');
  };

  const deleteItem = async (url, refreshMessage, setMessage, setError) => {
    if (!window.confirm('Delete this item?')) {
      return;
    }

    try {
      setMessage('');
      setError('');
      await api.delete(url);
      setMessage(refreshMessage);
      fetchAdminStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete item.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cashiers', label: 'Cashiers', icon: UsersRound },
    { id: 'menu', label: 'Menu Items', icon: Utensils },
    { id: 'tables-waiters', label: 'Tables & Waiters', icon: Table2 },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const statCards = [
    {
      label: 'Total Cashiers',
      value: stats.cashiers,
      icon: UsersRound,
    },
    {
      label: 'Total Waiters',
      value: stats.waiters,
      icon: UserPlus,
    },
    {
      label: 'Total Menu Items',
      value: stats.menuItems,
      icon: Utensils,
    },
    {
      label: 'Total Tables',
      value: stats.tables,
      icon: Table2,
    },
    {
      label: 'Total KOTs',
      value: stats.kots,
      icon: ReceiptText,
    },
    {
      label: 'Running KOTs',
      value: stats.runningKots,
      icon: RefreshCw,
    },
  ];

  return (
    <main className="min-h-screen w-full bg-neutral-100 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 lg:gap-5">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm px-4 py-3 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center flex-shrink-0">
              <UserCircle2 size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">
                Admin logged in
              </div>
              <h1 className="text-sm font-semibold text-neutral-900 truncate">
                {admin.username || 'Admin'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsAdminPasswordOpen((value) => !value);
                setAdminPasswordMessage('');
                setAdminPasswordError('');
              }}
              className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-md px-3 py-2 text-xs font-medium hover:bg-orange-100 transition-colors"
            >
              <KeyRound size={14} />
              Password
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-md px-3 py-2 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {(isAdminPasswordOpen || adminPasswordMessage || adminPasswordError) && (
          <section className="bg-white border border-orange-200 rounded-lg shadow-sm p-4 sm:p-5">
            {isAdminPasswordOpen && (
              <form onSubmit={changeAdminPassword} className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="admin-current-password" className="block text-xs font-medium text-neutral-600 mb-1">
                    Current Password
                  </label>
                  <input
                    id="admin-current-password"
                    type="password"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={currentAdminPassword}
                    onChange={(event) => setCurrentAdminPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="admin-new-password" className="block text-xs font-medium text-neutral-600 mb-1">
                    New Password
                  </label>
                  <input
                    id="admin-new-password"
                    type="password"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={newAdminPassword}
                    onChange={(event) => setNewAdminPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="admin-confirm-password" className="block text-xs font-medium text-neutral-600 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="admin-confirm-password"
                    type="password"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={confirmAdminPassword}
                    onChange={(event) => setConfirmAdminPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="sm:col-span-3 flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={isAdminPasswordSaving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-800"
                  >
                    <KeyRound size={16} />
                    {isAdminPasswordSaving ? 'Saving...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminPasswordOpen(false);
                      setCurrentAdminPassword('');
                      setNewAdminPassword('');
                      setConfirmAdminPassword('');
                    }}
                    className="w-full sm:w-auto border border-neutral-200 text-neutral-600 rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {(adminPasswordMessage || adminPasswordError) && (
              <div className={`mt-3 text-sm font-medium rounded-md px-3 py-2 border ${
                adminPasswordError
                  ? 'text-red-600 bg-red-50 border-red-100'
                  : 'text-green-700 bg-green-50 border-green-100'
              }`}
              >
                {adminPasswordError || adminPasswordMessage}
              </div>
            )}
          </section>
        )}

        <nav className="grid grid-cols-2 lg:grid-cols-5 gap-2 bg-white border border-neutral-200 rounded-xl shadow-sm p-2">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </nav>

        {activeSection === 'dashboard' && (
          <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-4 sm:px-5 border-b border-neutral-100 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                  Admin Dashboard
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Restaurant Overview
                </h2>
              </div>
              <button
                type="button"
                onClick={fetchAdminStats}
                disabled={isStatsLoading}
                className="w-9 h-9 flex items-center justify-center bg-orange-50 border border-orange-200 text-orange-700 rounded-md hover:bg-orange-100 disabled:text-orange-300 flex-shrink-0"
                title="Refresh totals"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {statsError && (
                <div className="mb-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {statsError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="border border-neutral-200 rounded-lg p-4 bg-neutral-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-neutral-500">
                          {label}
                        </div>
                        <div className="mt-1 text-3xl font-semibold text-neutral-900">
                          {isStatsLoading ? '...' : value}
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-md bg-white border border-neutral-200 text-orange-700 flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'cashiers' && (
        <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-4 sm:px-5 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                  Cashier Management
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editingCashierId ? 'Edit Cashier' : 'Create Cashier'}
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={saveCashier} className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cashier-username" className="block text-xs font-medium text-neutral-600 mb-1">
                Username
              </label>
              <input
                id="cashier-username"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="cashier-password" className="block text-xs font-medium text-neutral-600 mb-1">
                Password
              </label>
              <input
                id="cashier-password"
                type="password"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                placeholder={editingCashierId ? 'Leave blank to keep same' : ''}
                required={!editingCashierId}
              />
            </div>

            {(cashierMessage || cashierError) && (
              <div className={`sm:col-span-2 text-sm font-medium rounded-md px-3 py-2 border ${
                cashierError
                  ? 'text-red-600 bg-red-50 border-red-100'
                  : 'text-green-700 bg-green-50 border-green-100'
              }`}
              >
                {cashierError || cashierMessage}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-800"
              >
                <UserPlus size={16} />
                {isCreating ? 'Saving...' : editingCashierId ? 'Update Cashier' : 'Create Cashier'}
              </button>
              {editingCashierId && (
                <button
                  type="button"
                  onClick={resetCashierForm}
                  className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto border border-neutral-200 text-neutral-600 rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="border-t border-neutral-100 px-4 py-4 sm:px-5">
            <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">
              Cashier List
            </h3>
            <div className="overflow-hidden border border-neutral-200 rounded-md">
              {adminLists.cashiers.length === 0 ? (
                <div className="px-3 py-3 text-xs text-neutral-400">No cashiers found.</div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {adminLists.cashiers.map((cashier) => (
                    <div
                      key={cashier.id}
                      className="grid grid-cols-[48px_1fr_auto_auto] gap-2 px-3 py-2 text-xs items-center"
                    >
                      <span className="text-neutral-400">#{cashier.id}</span>
                      <span className="font-medium text-neutral-800 truncate">{cashier.username}</span>
                      <span className="text-neutral-500">{cashier.type || 'cashier'}</span>
                      <span className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startCashierEdit(cashier)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                          title="Edit cashier"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(`/cashiers/${cashier.id}`, 'Cashier deleted successfully.', setCashierMessage, setCashierError)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-red-100 text-red-500 hover:bg-red-50"
                          title="Delete cashier"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {activeSection === 'menu' && (
        <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-4 sm:px-5 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                  Menu Management
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Add Menu Item
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={saveMenuItem} className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="menu-name" className="block text-xs font-medium text-neutral-600 mb-1">
                Item Name
              </label>
              <input
                id="menu-name"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={menuName}
                onChange={(event) => setMenuName(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="menu-code" className="block text-xs font-medium text-neutral-600 mb-1">
                Code
              </label>
              <input
                id="menu-code"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={menuCode}
                onChange={(event) => setMenuCode(event.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="menu-rate" className="block text-xs font-medium text-neutral-600 mb-1">
                Sale Rate
              </label>
              <input
                id="menu-rate"
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={menuRate}
                onChange={(event) => setMenuRate(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="menu-tax-rate" className="block text-xs font-medium text-neutral-600 mb-1">
                Tax Rate
              </label>
              <select
                id="menu-tax-rate"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={menuTaxRate}
                onChange={(event) => setMenuTaxRate(event.target.value)}
              >
                <option value="">Select tax rate</option>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
                <option value="40">40%</option>
              </select>
            </div>

            {(menuMessage || menuError) && (
              <div className={`sm:col-span-2 text-sm font-medium rounded-md px-3 py-2 border ${
                menuError
                  ? 'text-red-600 bg-red-50 border-red-100'
                  : 'text-green-700 bg-green-50 border-green-100'
              }`}
              >
                {menuError || menuMessage}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isCreatingMenuItem}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-800"
              >
                <UserPlus size={16} />
                {isCreatingMenuItem ? 'Saving...' : editingMenuItemId ? 'Update Menu Item' : 'Add Menu Item'}
              </button>
              {editingMenuItemId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMenuItemId(null);
                    setMenuName('');
                    setMenuCode('');
                    setMenuRate('');
                    setMenuTaxRate('');
                  }}
                  className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto border border-neutral-200 text-neutral-600 rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="border-t border-neutral-100 px-4 py-4 sm:px-5">
            <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">
              Menu Item List
            </h3>
            <div className="overflow-hidden border border-neutral-200 rounded-md">
              {adminLists.menuItems.length === 0 ? (
                <div className="px-3 py-3 text-xs text-neutral-400">No menu items found.</div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto">
                  {adminLists.menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[48px_1fr_auto_auto] gap-2 px-3 py-2 text-xs items-center"
                    >
                      <span className="text-neutral-400">#{item.id}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-800 truncate">{item.name}</div>
                        {item.code && (
                          <div className="text-[11px] text-neutral-400 truncate">{item.code}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-neutral-800">
                          Rs. {Number(item.srate || 0).toFixed(2)}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Tax {item.trate || 0}%
                        </div>
                      </div>
                      <span className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startMenuEdit(item)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                          title="Edit menu item"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(`/menu/${item.id}`, 'Menu item deleted successfully.', setMenuMessage, setMenuError)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-red-100 text-red-500 hover:bg-red-50"
                          title="Delete menu item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {activeSection === 'reports' && (
          <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-4 sm:px-5 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                    Reports
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    KOT & Bill Report
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_180px_auto_auto]">
                <div>
                  <label htmlFor="report-start-date" className="block text-xs font-medium text-neutral-600 mb-1">
                    Start Date
                  </label>
                  <input
                    id="report-start-date"
                    type="date"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={reportStartDate}
                    onChange={(event) => setReportStartDate(event.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="report-end-date" className="block text-xs font-medium text-neutral-600 mb-1">
                    End Date
                  </label>
                  <input
                    id="report-end-date"
                    type="date"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={reportEndDate}
                    onChange={(event) => setReportEndDate(event.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={fetchReport}
                    disabled={isReportLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-800"
                  >
                    <RefreshCw size={15} />
                    {isReportLoading ? 'Loading...' : 'Load Report'}
                  </button>
                </div>
                <div>
                  <label htmlFor="report-download-type" className="block text-xs font-medium text-neutral-600 mb-1">
                    Download Type
                  </label>
                  <select
                    id="report-download-type"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={reportDownloadType}
                    onChange={(event) => setReportDownloadType(event.target.value)}
                  >
                    <option value="kot">KOT Report</option>
                    <option value="bill">Bill Report</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={downloadReportPdf}
                    disabled={isReportDownloading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 disabled:bg-neutral-300 text-white rounded-md px-4 py-2.5 font-medium text-sm hover:bg-orange-700"
                  >
                    <Download size={15} />
                    {isReportDownloading ? 'Downloading...' : 'Download A4'}
                  </button>
                </div>
              </div>

              {reportError && (
                <div className="mt-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {reportError}
                </div>
              )}

              {reportData && (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ['Total KOTs', reportData.kot_report.total_kots],
                      ['Running KOTs', reportData.kot_report.running_kots],
                      ['Settled KOTs', reportData.kot_report.settled_kots],
                      ['KOT Amount', `Rs. ${formatMoney(reportData.kot_report.total_amount)}`],
                      ['Total Bills', reportData.bill_report.total_bills],
                      ['Bill Amount', `Rs. ${formatMoney(reportData.bill_report.total_amount)}`],
                      ['Cash', `Rs. ${formatMoney(reportData.bill_report.cash)}`],
                      ['Online', `Rs. ${formatMoney(reportData.bill_report.online)}`],
                    ].map(([label, value]) => (
                      <div key={label} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                        <div className="text-xs font-medium text-neutral-500">{label}</div>
                        <div className="mt-1 text-xl font-semibold text-neutral-900">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">
                        KOT Report
                      </h3>
                      <div className="max-h-80 overflow-auto border border-neutral-200 rounded-md">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">KOT</th>
                              <th className="px-3 py-2 text-left font-semibold">Table</th>
                              <th className="px-3 py-2 text-left font-semibold">Waiter</th>
                              <th className="px-3 py-2 text-left font-semibold">Status</th>
                              <th className="px-3 py-2 text-right font-semibold">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {reportData.kot_report.rows.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-3 py-5 text-center text-neutral-400">
                                  No KOTs found.
                                </td>
                              </tr>
                            ) : reportData.kot_report.rows.map((kot) => (
                              <tr key={kot.id}>
                                <td className="px-3 py-2 font-medium text-neutral-900">#{kot.id}</td>
                                <td className="px-3 py-2 text-neutral-700">{kot.table_name}</td>
                                <td className="px-3 py-2 text-neutral-500">{kot.waiter_name}</td>
                                <td className="px-3 py-2">
                                  <span className={`rounded px-2 py-1 text-[11px] font-medium ${
                                    kot.status === 'RUNNING'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-green-50 text-green-700 border border-green-100'
                                  }`}
                                  >
                                    {kot.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right text-neutral-900">
                                  Rs. {formatMoney(kot.total_amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">
                        Bill Report
                      </h3>
                      <div className="max-h-80 overflow-auto border border-neutral-200 rounded-md">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Bill</th>
                              <th className="px-3 py-2 text-left font-semibold">Table</th>
                              <th className="px-3 py-2 text-left font-semibold">Method</th>
                              <th className="px-3 py-2 text-right font-semibold">Cash</th>
                              <th className="px-3 py-2 text-right font-semibold">Online</th>
                              <th className="px-3 py-2 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {reportData.bill_report.rows.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="px-3 py-5 text-center text-neutral-400">
                                  No bills found.
                                </td>
                              </tr>
                            ) : reportData.bill_report.rows.map((bill) => (
                              <tr key={bill.id}>
                                <td className="px-3 py-2 font-medium text-neutral-900">#{bill.id}</td>
                                <td className="px-3 py-2 text-neutral-700">{bill.table_no}</td>
                                <td className="px-3 py-2 text-neutral-500">{bill.payment_method}</td>
                                <td className="px-3 py-2 text-right text-neutral-900">Rs. {formatMoney(bill.cash)}</td>
                                <td className="px-3 py-2 text-right text-neutral-900">Rs. {formatMoney(bill.online)}</td>
                                <td className="px-3 py-2 text-right font-medium text-neutral-900">
                                  Rs. {formatMoney(bill.total_amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {activeSection === 'tables-waiters' && (
          <>
        <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-4 sm:px-5 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
                <Table2 size={20} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                  Table Management
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Add Table
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={saveTable} className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="table-name" className="block text-xs font-medium text-neutral-600 mb-1">
                Table Name
              </label>
              <input
                id="table-name"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={tableName}
                onChange={(event) => setTableName(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="restaurant-name" className="block text-xs font-medium text-neutral-600 mb-1">
                Restaurant
              </label>
              <input
                id="restaurant-name"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
                autoComplete="off"
              />
            </div>

            {(tableMessage || tableError) && (
              <div className={`sm:col-span-2 text-sm font-medium rounded-md px-3 py-2 border ${
                tableError
                  ? 'text-red-600 bg-red-50 border-red-100'
                  : 'text-green-700 bg-green-50 border-green-100'
              }`}
              >
                {tableError || tableMessage}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isCreatingTable}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-800"
              >
                <Table2 size={16} />
                {isCreatingTable ? 'Saving...' : editingTableId ? 'Update Table' : 'Add Table'}
              </button>
              {editingTableId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTableId(null);
                    setTableName('');
                    setRestaurantName('');
                  }}
                  className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto border border-neutral-200 text-neutral-600 rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="border-t border-neutral-100 px-4 py-4 sm:px-5">
            <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">
              Table List
            </h3>
            <div className="overflow-hidden border border-neutral-200 rounded-md">
              {adminLists.tables.length === 0 ? (
                <div className="px-3 py-3 text-xs text-neutral-400">No tables found.</div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                  {adminLists.tables.map((table) => (
                    <div
                      key={table.id}
                      className="grid grid-cols-[48px_1fr_auto] gap-2 px-3 py-2 text-xs items-center"
                    >
                      <span className="text-neutral-400">#{table.id}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-800 truncate">{table.name}</div>
                        {table.restaurant && (
                          <div className="text-[11px] text-neutral-400 truncate">{table.restaurant}</div>
                        )}
                      </div>
                      <span className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startTableEdit(table)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                          title="Edit table"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(`/table-no/${table.id}`, 'Table deleted successfully.', setTableMessage, setTableError)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-red-100 text-red-500 hover:bg-red-50"
                          title="Delete table"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-4 sm:px-5 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                  Waiter Management
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Add Waiter
                </h2>
              </div>
            </div>
          </div>

          <form onSubmit={saveWaiter} className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="waiter-name" className="block text-xs font-medium text-neutral-600 mb-1">
                Waiter Name
              </label>
              <input
                id="waiter-name"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={waiterName}
                onChange={(event) => setWaiterName(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="waiter-code" className="block text-xs font-medium text-neutral-600 mb-1">
                Code
              </label>
              <input
                id="waiter-code"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={waiterCode}
                onChange={(event) => setWaiterCode(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            {(waiterMessage || waiterError) && (
              <div className={`sm:col-span-2 text-sm font-medium rounded-md px-3 py-2 border ${
                waiterError
                  ? 'text-red-600 bg-red-50 border-red-100'
                  : 'text-green-700 bg-green-50 border-green-100'
              }`}
              >
                {waiterError || waiterMessage}
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isCreatingWaiter}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-800"
              >
                <UserPlus size={16} />
                {isCreatingWaiter ? 'Saving...' : editingWaiterId ? 'Update Waiter' : 'Add Waiter'}
              </button>
              {editingWaiterId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingWaiterId(null);
                    setWaiterName('');
                    setWaiterCode('');
                  }}
                  className="mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto border border-neutral-200 text-neutral-600 rounded-md px-4 py-2.5 font-medium text-sm hover:bg-neutral-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="border-t border-neutral-100 px-4 py-4 sm:px-5">
            <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">
              Waiter List
            </h3>
            <div className="overflow-hidden border border-neutral-200 rounded-md">
              {adminLists.waiters.length === 0 ? (
                <div className="px-3 py-3 text-xs text-neutral-400">No waiters found.</div>
              ) : (
                <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                  {adminLists.waiters.map((waiter) => (
                    <div
                      key={waiter.id}
                      className="grid grid-cols-[48px_1fr_auto_auto] gap-2 px-3 py-2 text-xs items-center"
                    >
                      <span className="text-neutral-400">#{waiter.id}</span>
                      <span className="font-medium text-neutral-800 truncate">{waiter.name}</span>
                      <span className="text-neutral-500">{waiter.code}</span>
                      <span className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startWaiterEdit(waiter)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                          title="Edit waiter"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(`/waiters/${waiter.id}`, 'Waiter deleted successfully.', setWaiterMessage, setWaiterError)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded border border-red-100 text-red-500 hover:bg-red-50"
                          title="Delete waiter"
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </main>
  );
}

function App() {
  const [kotStatsRefreshKey, setKotStatsRefreshKey] = useState(0);
  const [route, setRoute] = useState(() => window.location.pathname);
  const isAdminRoute = route.startsWith('/admin');
  const [tableNo, setTableNo] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [waiterId, setWaiterId] = useState('');
  const [waiterLabel, setWaiterLabel] = useState('');
  const [cashier, setCashier] = useState(() => {
    const token = localStorage.getItem(CASHIER_TOKEN_KEY);
    const savedCashier = localStorage.getItem(CASHIER_USER_KEY);

    if (!token || !savedCashier) {
      return null;
    }

    try {
      return JSON.parse(savedCashier);
    } catch {
      localStorage.removeItem(CASHIER_TOKEN_KEY);
      localStorage.removeItem(CASHIER_USER_KEY);
      return null;
    }
  });
  const [admin, setAdmin] = useState(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const savedAdmin = localStorage.getItem(ADMIN_USER_KEY);

    if (!token || !savedAdmin) {
      return null;
    }

    try {
      return JSON.parse(savedAdmin);
    } catch {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      return null;
    }
  });

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = ({ accessToken, cashier: loggedInCashier }) => {
    localStorage.setItem(CASHIER_TOKEN_KEY, accessToken);
    localStorage.setItem(CASHIER_USER_KEY, JSON.stringify(loggedInCashier));
    setCashier(loggedInCashier);
  };

  const handleAdminLogin = ({ accessToken, cashier: loggedInAdmin }) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, accessToken);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(loggedInAdmin));
    setAdmin(loggedInAdmin);
  };

  const handleLogout = () => {
    localStorage.removeItem(CASHIER_TOKEN_KEY);
    localStorage.removeItem(CASHIER_USER_KEY);
    window.history.pushState({}, '', '/');
    setRoute('/');
    setCashier(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    window.history.pushState({}, '', '/admin');
    setRoute('/admin');
    setAdmin(null);
  };

  useEffect(() => {
    let isActive = true;

    const verifySession = async () => {
      const tokenKey = isAdminRoute ? ADMIN_TOKEN_KEY : CASHIER_TOKEN_KEY;
      const userKey = isAdminRoute ? ADMIN_USER_KEY : CASHIER_USER_KEY;
      const user = isAdminRoute ? admin : cashier;
      const token = localStorage.getItem(tokenKey);

      if (!token || !user) {
        return;
      }

      try {
        const { data } = await api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const verifiedUser = data.cashier;
        const verifiedType = verifiedUser?.type || 'cashier';

        if (
          (isAdminRoute && verifiedType !== 'admin') ||
          (!isAdminRoute && verifiedType !== 'cashier')
        ) {
          throw new Error('Invalid user role');
        }

        if (!isActive) {
          return;
        }

        localStorage.setItem(userKey, JSON.stringify(verifiedUser));

        if (isAdminRoute) {
          setAdmin((currentAdmin) =>
            currentAdmin?.id === verifiedUser.id &&
            currentAdmin?.username === verifiedUser.username &&
            (currentAdmin?.type || 'cashier') === verifiedType
              ? currentAdmin
              : verifiedUser,
          );
        } else {
          setCashier((currentCashier) =>
            currentCashier?.id === verifiedUser.id &&
            currentCashier?.username === verifiedUser.username &&
            (currentCashier?.type || 'cashier') === verifiedType
              ? currentCashier
              : verifiedUser,
          );
        }
      } catch {
        if (!isActive) {
          return;
        }

        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);

        if (isAdminRoute) {
          window.history.pushState({}, '', '/admin');
          setRoute('/admin');
          setAdmin(null);
        } else {
          window.history.pushState({}, '', '/');
          setRoute('/');
          setCashier(null);
        }
      }
    };

    verifySession();

    return () => {
      isActive = false;
    };
  }, [admin, cashier, isAdminRoute]);

  useEffect(() => {
    const handleInvalidSession = () => {
      if (isAdminRoute) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        window.history.pushState({}, '', '/admin');
        setRoute('/admin');
        setAdmin(null);
      } else {
        localStorage.removeItem(CASHIER_TOKEN_KEY);
        localStorage.removeItem(CASHIER_USER_KEY);
        window.history.pushState({}, '', '/');
        setRoute('/');
        setCashier(null);
      }
    };

    window.addEventListener('auth:invalid', handleInvalidSession);
    return () => window.removeEventListener('auth:invalid', handleInvalidSession);
  }, [isAdminRoute]);

  const openHistory = (date) => {
    window.history.pushState({}, '', `/kot-history?date=${date}`);
    setRoute('/kot-history');
  };

  const openOldKots = (date) => {
    window.history.pushState({}, '', `/old-kots?date=${date}`);
    setRoute('/old-kots');
  };

  const closeHistory = () => {
    window.history.pushState({}, '', '/');
    setRoute('/');
  };

  if (isAdminRoute && !admin) {
    return (
      <Login
        onLogin={handleAdminLogin}
        loginPath="/auth/admin/login"
        title="Admin Login"
        subtitle="Login to manage cashiers"
      />
    );
  }

  if (isAdminRoute) {
    return <AdminDashboard admin={admin} onLogout={handleAdminLogout} />;
  }

  if (!cashier) {
    return <Login onLogin={handleLogin} />;
  }

  if (route === '/kot-history') {
    const params = new URLSearchParams(window.location.search);

    return (
      <KotHistoryPage
        initialDate={params.get('date') || getTodayDate()}
        initialMode="running"
        onBack={closeHistory}
      />
    );
  }

  if (route === '/old-kots') {
    const params = new URLSearchParams(window.location.search);

    return (
      <KotHistoryPage
        initialDate={params.get('date') || getTodayDate()}
        initialMode="old"
        onBack={closeHistory}
      />
    );
  }

  return (
    <main className="min-h-screen w-full bg-neutral-100 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 lg:gap-5">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm px-4 py-3 sm:px-5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center flex-shrink-0">
              <UserCircle2 size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">
                Logged in
              </div>
              <h1 className="text-sm font-semibold text-neutral-900 truncate">
                {cashier.username || 'KOT Counter'}
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-md px-3 py-2 text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex-shrink-0"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>

        <KotMenuBar
          refreshKey={kotStatsRefreshKey}
          onOpenHistory={openHistory}
          onOpenOldKots={openOldKots}
          tableNo={tableNo}
          waiterId={waiterId}
          onTableNoChange={(value, label = '') => {
            setTableNo(value);
            setTableLabel(label);
          }}
          onWaiterChange={(value, label = '') => {
            setWaiterId(value);
            setWaiterLabel(label);
          }}
        />

        <KotApp
          tableNo={tableNo}
          tableLabel={tableLabel}
          waiterId={waiterId}
          waiterLabel={waiterLabel}
          onKotGenerated={() => {
            setKotStatsRefreshKey((value) => value + 1);
          }}
        />
      </div>
    </main>
  );
}

export default App;
