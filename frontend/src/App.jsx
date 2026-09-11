import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  LogOut,
  RefreshCw,
  Search,
  UserCircle2,
  X,
} from 'lucide-react';
import './index.css';
import KotApp from './components/KotApp';
import Login from './components/Login';
import KotHistoryPage from './components/KotHistoryPage';
import api from './services/api';

const CASHIER_TOKEN_KEY = 'cashier_access_token';
const CASHIER_USER_KEY = 'cashier_user';

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function KotMenuBar({
  refreshKey,
  onOpenHistory,
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

      <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-orange-50/70 border border-orange-100 px-3 py-2">
        <button
          type="button"
          onClick={() => onOpenHistory(selectedDate)}
          className="flex items-center gap-2 min-w-0 text-left"
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

function App() {
  const [kotStatsRefreshKey, setKotStatsRefreshKey] = useState(0);
  const [route, setRoute] = useState(() => window.location.pathname);
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

  const handleLogout = () => {
    localStorage.removeItem(CASHIER_TOKEN_KEY);
    localStorage.removeItem(CASHIER_USER_KEY);
    window.history.pushState({}, '', '/');
    setRoute('/');
    setCashier(null);
  };

  const openHistory = (date) => {
    window.history.pushState({}, '', `/kot-history?date=${date}`);
    setRoute('/kot-history');
  };

  const closeHistory = () => {
    window.history.pushState({}, '', '/');
    setRoute('/');
  };

  if (!cashier) {
    return <Login onLogin={handleLogin} />;
  }

  if (route === '/kot-history') {
    const params = new URLSearchParams(window.location.search);

    return (
      <KotHistoryPage
        initialDate={params.get('date') || getTodayDate()}
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
            setTableNo('');
            setTableLabel('');
            setWaiterId('');
            setWaiterLabel('');
          }}
        />
      </div>
    </main>
  );
}

export default App;
