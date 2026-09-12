import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronDown, RefreshCw, Search, X } from 'lucide-react';
import api from '../services/api';

function groupKotsByTable(kots) {
  const groups = new Map();

  kots.forEach((kot) => {
    const tableKey = String(kot.table_no);
    const tableName = kot.table?.name || `Table ${kot.table_no}`;

    if (!groups.has(tableKey)) {
      groups.set(tableKey, {
        tableNo: kot.table_no,
        tableName,
        restaurant: kot.table?.restaurant || '',
        kots: [],
        waiters: new Map(),
        items: new Map(),
        total: 0,
        latestAt: kot.created_at,
      });
    }

    const group = groups.get(tableKey);
    group.kots.push(kot);

    if (new Date(kot.created_at) > new Date(group.latestAt)) {
      group.latestAt = kot.created_at;
    }

    if (kot.waiter) {
      group.waiters.set(kot.waiter.id, kot.waiter.name);
    }

    kot.items.forEach((item) => {
      const itemKey = `${item.menu_item_id}-${Number(item.price)}`;
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const existingItem = group.items.get(itemKey);

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.total += price * quantity;
      } else {
        group.items.set(itemKey, {
          name: item.name,
          quantity,
          price,
          total: price * quantity,
        });
      }

      group.total += price * quantity;
    });
  });

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.latestAt) - new Date(a.latestAt),
  );
}

function TableBillControls({ tableGroup, bill, onGenerateBill, onSettleBill }) {
  const [cash, setCash] = useState(bill?.cash ? String(bill.cash) : '');
  const [online, setOnline] = useState(bill?.online ? String(bill.online) : '');
  const [settlementError, setSettlementError] = useState('');
  const total = Number(bill?.total_amount || tableGroup.total);
  const paid = Number(cash || 0) + Number(online || 0);
  const balance = total - paid;

  useEffect(() => {
    setCash(bill?.cash ? String(bill.cash) : '');
    setOnline(bill?.online ? String(bill.online) : '');
    setSettlementError('');
  }, [bill]);

  const handleSettlement = () => {
    if (!bill) {
      setSettlementError('Bill generate first.');
      return;
    }

    if (Math.abs(balance) > 0.009) {
      setSettlementError(
        `Bill Rs. ${total.toFixed(2)} ka hai. Cash + online poora Rs. ${total.toFixed(2)} hona chahiye.`,
      );
      return;
    }

    setSettlementError('');
    onSettleBill(tableGroup, bill, Number(cash || 0), Number(online || 0));
  };

  return (
    <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-neutral-900">{tableGroup.tableName}</div>
          <div className="text-[11px] text-neutral-500">
            {tableGroup.kots.length} KOT{tableGroup.kots.length !== 1 ? 's' : ''} | Bill amount: Rs. {total.toFixed(2)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {bill && (
          <span className="rounded bg-green-50 border border-green-100 px-2 py-1 text-[11px] font-medium text-green-700">
            Bill #{bill.id} Generated
          </span>
          )}
          <button
            type="button"
            onClick={() => onGenerateBill(tableGroup, bill)}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            Bill Generation
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor={`cash-${tableGroup.tableNo}`} className="block text-[11px] font-medium text-neutral-500 mb-1">
              Cash
            </label>
            <input
              id={`cash-${tableGroup.tableNo}`}
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={cash}
              onChange={(event) => {
                setCash(event.target.value);
                setSettlementError('');
              }}
            />
          </div>
          <div>
            <label htmlFor={`online-${tableGroup.tableNo}`} className="block text-[11px] font-medium text-neutral-500 mb-1">
              Online
            </label>
            <input
              id={`online-${tableGroup.tableNo}`}
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={online}
              onChange={(event) => {
                setOnline(event.target.value);
                setSettlementError('');
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSettlement}
              disabled={!bill}
              className="w-full rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:bg-neutral-300"
            >
              Bill Settlement
            </button>
          </div>
          <div className="sm:col-span-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
            <span>Paid: Rs. {paid.toFixed(2)}</span>
            <span>Balance: Rs. {balance.toFixed(2)}</span>
            <span>Method: {bill?.payment_method || 'Pending'}</span>
            {!bill && <span>Generate bill first.</span>}
          </div>
          {settlementError && (
            <div className="sm:col-span-3 text-[11px] font-medium text-red-600">
              {settlementError}
            </div>
          )}
        </div>
    </div>
  );
}

function TableHistoryCard({ tableGroup, bill, onGenerateBill, onSettleBill }) {
  const items = Array.from(tableGroup.items.values());
  const waiters = Array.from(tableGroup.waiters.values());

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-2.5 bg-neutral-900 text-white">
        <div className="min-w-0">
          <span className="block font-semibold text-sm truncate">{tableGroup.tableName}</span>
          {tableGroup.restaurant && (
            <span className="block text-xs text-neutral-300 truncate">{tableGroup.restaurant}</span>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-neutral-300">
            {tableGroup.kots.length} KOT{tableGroup.kots.length !== 1 ? 's' : ''}
          </div>
          <div className="text-sm font-semibold">Rs. {tableGroup.total.toFixed(2)}</div>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tableGroup.kots.map((kot) => (
            <span
              key={kot.id}
              className="rounded bg-orange-50 border border-orange-100 px-2 py-1 text-[11px] font-medium text-orange-700"
            >
              KOT #{kot.id}
            </span>
          ))}
        </div>
        <div className="text-xs text-neutral-400 mb-2">
          Last order:{' '}
          {new Date(tableGroup.latestAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
        {waiters.length > 0 && (
          <div className="text-xs text-neutral-500 mb-2">
            Waiter: {waiters.join(', ')}
          </div>
        )}
        <div className="divide-y divide-neutral-100">
          {items.map((item) => (
            <div
              key={`${item.name}-${item.price}`}
              className="flex items-center justify-between gap-3 py-1.5 text-sm"
            >
              <div className="min-w-0">
                <div className="text-neutral-800 truncate">{item.name}</div>
                <div className="text-xs text-neutral-400">Rs. {item.price.toFixed(2)} each</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-neutral-500">x{item.quantity}</div>
                <div className="text-neutral-900 font-medium">
                  Rs. {item.total.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-200">
          <span className="text-xs font-medium text-neutral-500">Table Total</span>
          <span className="text-sm font-semibold text-neutral-900">Rs. {tableGroup.total.toFixed(2)}</span>
        </div>
        <div className="mt-3 border-t border-neutral-200 pt-3">
          <div className="text-xs font-semibold uppercase text-neutral-500 mb-2">
            Bill Generation & Settlement
          </div>
          <TableBillControls
            tableGroup={tableGroup}
            bill={bill}
            onGenerateBill={onGenerateBill}
            onSettleBill={onSettleBill}
          />
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
  const [tableSearch, setTableSearch] = useState('');
  const [isWaiterDropdownOpen, setIsWaiterDropdownOpen] = useState(false);
  const [isWaiterLoading, setIsWaiterLoading] = useState(false);
  const [waiterError, setWaiterError] = useState('');
  const [kots, setKots] = useState([]);
  const [billsByTableNo, setBillsByTableNo] = useState({});
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

      const kotIds = data.map((kot) => kot.id);
      if (kotIds.length > 0) {
        const billsResponse = await api.get('/bill', {
          params: {
            kot_ids: kotIds.join(','),
          },
        });
        setBillsByTableNo(
          billsResponse.data.reduce((result, bill) => ({
            ...result,
            [bill.table_no]: bill,
          }), {}),
        );
      } else {
        setBillsByTableNo({});
      }
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
  const tableGroups = groupKotsByTable(kots);
  const filteredTableGroups = tableGroups.filter((tableGroup) => {
    const search = tableSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return [
      String(tableGroup.tableNo),
      tableGroup.tableName,
      tableGroup.restaurant,
      ...tableGroup.kots.map((kot) => String(kot.id)),
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

  const downloadBillPdf = async (bill) => {
    const response = await api.get(`/bill/${bill.id}/pdf`, {
      params: {
        size: '80',
      },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], {
      type: 'application/pdf',
    }));
    const link = document.createElement('a');

    link.href = url;
    link.download = `bill-${bill.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const generateBill = async (tableGroup, existingBill) => {
    try {
      const data = existingBill || (
        await api.post('/bill/generate', {
          kot_ids: tableGroup.kots.map((kot) => kot.id),
        })
      ).data;

      setBillsByTableNo((currentBills) => ({
        ...currentBills,
        [data.table_no]: data,
      }));
      await downloadBillPdf(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate bill.');
    }
  };

  const settleBill = async (tableGroup, existingBill, cash, online) => {
    try {
      const bill = existingBill || (
        await api.post('/bill/generate', {
          kot_ids: tableGroup.kots.map((kot) => kot.id),
        })
      ).data;
      const { data } = await api.patch(`/bill/${bill.id}/settle`, {
        cash,
        online,
      });

      setBillsByTableNo((currentBills) => ({
        ...currentBills,
        [data.table_no]: data,
      }));
      await downloadBillPdf(data);
      setKots((currentKots) =>
        currentKots.filter((kot) => !data.kot_ids.includes(kot.id)),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to settle bill.');
    }
  };

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
                {filteredTableGroups.length} Table{filteredTableGroups.length !== 1 ? 's' : ''} | {kots.length} KOT{kots.length !== 1 ? 's' : ''} | Rs. {grandTotal.toFixed(2)}
              </div>
            </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="history-table" className="block text-xs font-medium text-orange-700 mb-1">
                Table
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  id="history-table"
                  placeholder="Search table no"
                  className="w-full border border-orange-200 rounded-md pl-8 pr-9 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={tableSearch}
                  onChange={(event) => setTableSearch(event.target.value)}
                />
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => setTableSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                    title="Clear table search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

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

        {!isLoading && !error && kots.length > 0 && filteredTableGroups.length === 0 && (
          <div className="py-10 text-center text-sm text-neutral-400">
            No tables match your search.
          </div>
        )}

        {!isLoading && !error && filteredTableGroups.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTableGroups.map((tableGroup) => (
              <TableHistoryCard
                key={tableGroup.tableNo}
                tableGroup={tableGroup}
                bill={billsByTableNo[tableGroup.tableNo]}
                onGenerateBill={generateBill}
                onSettleBill={settleBill}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
