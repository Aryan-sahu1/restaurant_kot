import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronDown, RefreshCw, Search, X } from 'lucide-react';
import api from '../services/api';

function KotHistoryCard({ kot }) {
  const tableName = kot.table?.name || `Table ${kot.table_no}`;
  const total = kot.items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 text-white">
        <span className="font-semibold text-sm">KOT #{kot.id}</span>
        <span className="text-xs text-neutral-300">{tableName}</span>
      </div>
      <div className="px-4 py-3">
        <div className="text-xs text-neutral-400 mb-2">
          {new Date(kot.created_at).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
        {kot.waiter && (
          <div className="text-xs text-neutral-500 mb-2">
            Waiter: {kot.waiter.name}
          </div>
        )}
        <div className="divide-y divide-neutral-100">
          {kot.items.map((item) => (
            <div
              key={`${kot.id}-${item.menu_item_id}`}
              className="flex items-center justify-between gap-3 py-1.5 text-sm"
            >
              <div className="min-w-0">
                <div className="text-neutral-800 truncate">{item.name}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-neutral-500">x{item.quantity}</div>
                <div className="text-neutral-900 font-medium">
                  Rs. {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-200">
          <span className="text-xs font-medium text-neutral-500">Total</span>
          <span className="text-sm font-semibold text-neutral-900">Rs. {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function KotHistoryPage({ initialDate, onBack }) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [waiters, setWaiters] = useState([]);
  const [waiterId, setWaiterId] = useState('');
  const [waiterSearch, setWaiterSearch] = useState('');
  const [isWaiterDropdownOpen, setIsWaiterDropdownOpen] = useState(false);
  const [isWaiterLoading, setIsWaiterLoading] = useState(false);
  const [waiterError, setWaiterError] = useState('');
  const [kots, setKots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const waiterDropdownRef = useRef(null);

  const selectedWaiter = waiters.find((waiter) => String(waiter.id) === String(waiterId));
  const filteredWaiters = waiters.filter((waiter) => {
    const search = waiterSearch.trim().toLowerCase();

    if (!search || selectedWaiter?.name === waiterSearch) {
      return true;
    }

    return [waiter.name, waiter.code]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

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

  const fetchKots = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data } = await api.get('/kots/my-kots', {
        params: {
          date: selectedDate,
          ...(waiterId ? { waiter_id: waiterId } : {}),
        },
      });

      setKots(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load KOT history.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, waiterId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchWaiters();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchWaiters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchKots();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchKots]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setWaiterSearch(selectedWaiter?.name || '');
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [selectedWaiter]);

  useEffect(() => {
    const handlePointerDown = (event) => {
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

  const grandTotal = kots.reduce(
    (sum, kot) =>
      sum + kot.items.reduce((itemSum, item) => itemSum + Number(item.price) * Number(item.quantity), 0),
    0,
  );

  return (
    <main className="min-h-screen w-full bg-neutral-100 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-4 lg:gap-5">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm px-4 py-3 sm:px-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={fetchKots}
            disabled={isLoading}
            className="w-9 h-9 flex items-center justify-center bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-md hover:bg-neutral-100 disabled:text-neutral-300"
            title="Refresh history"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <section className="bg-white border border-orange-200 border-t-4 border-t-orange-500 rounded-lg shadow-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-orange-700 font-semibold">
                KOT History
              </div>
              <div className="text-lg font-semibold text-neutral-900">
                {kots.length} KOT{kots.length !== 1 ? 's' : ''} | Rs. {grandTotal.toFixed(2)}
              </div>
            </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div ref={waiterDropdownRef} className="relative">
              <label htmlFor="history-waiter" className="block text-xs font-medium text-orange-700 mb-1">
                Waiter
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="history-waiter"
                  placeholder="All waiters"
                  className="w-full border border-orange-200 rounded-md pl-8 pr-14 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={waiterSearch}
                  onFocus={() => setIsWaiterDropdownOpen(true)}
                  onChange={(event) => {
                    setWaiterSearch(event.target.value);
                    setWaiterId('');
                    setIsWaiterDropdownOpen(true);
                  }}
                />
                {waiterSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setWaiterSearch('');
                      setWaiterId('');
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
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setWaiterId('');
                      setWaiterSearch('');
                      setIsWaiterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50"
                  >
                    All waiters
                  </button>
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
                        setWaiterId(String(waiter.id));
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
            <label htmlFor="history-date" className="block text-xs font-medium text-orange-700 mb-1">
              Date
            </label>
            <input
              id="history-date"
              type="date"
              className="w-full border border-orange-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
            </div>
          </div>

          {waiterError && (
            <div className="mt-3 text-sm text-red-600 font-medium">{waiterError}</div>
          )}
        </section>

        {isLoading && (
          <div className="py-10 text-center text-sm text-neutral-400">Loading KOTs...</div>
        )}

        {!isLoading && error && (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        )}

        {!isLoading && !error && kots.length === 0 && (
          <div className="py-10 text-center text-sm text-neutral-400">
            No KOTs found for this date.
          </div>
        )}

        {!isLoading && !error && kots.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kots.map((kot) => <KotHistoryCard key={kot.id} kot={kot} />)}
          </div>
        )}
      </div>
    </main>
  );
}
