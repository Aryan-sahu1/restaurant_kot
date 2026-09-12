import { useCallback, useEffect, useState } from "react";
import { Plus, Minus, Trash2, Printer, Utensils, Clock, RefreshCw, Search, X } from "lucide-react";
import api from "../services/api";

function Header({ kotNo, tableNo, tableLabel, waiterLabel }) {
    return (
        <div className="bg-neutral-900 text-white rounded-t-lg px-4 py-3 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <Utensils size={20} />
                <span className="font-semibold text-lg">KOT #{kotNo}</span>
            </div>
            <div className="text-left sm:text-right text-sm">
                <div className="font-medium">{tableNo ? tableLabel || `Table ${tableNo}` : "No table selected"}</div>
                <div className="text-xs text-neutral-300">{waiterLabel || "No waiter selected"}</div>
                <div className="flex items-center gap-1 text-neutral-300 sm:justify-end">
                    <Clock size={12} />
                    {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </div>
            </div>
        </div>
    );
}

function MenuGrid({
    menuItems,
    isLoading,
    error,
    searchTerm,
    onSearchChange,
    onAdd,
    onRetry,
}) {
    return (
        <div className="p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-neutral-200">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-neutral-600">Menu Items</div>
                {error && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="flex items-center gap-1 text-xs text-neutral-700 hover:text-neutral-950"
                    >
                        <RefreshCw size={12} />
                        Retry
                    </button>
                )}
            </div>
            <div className="relative mb-3">
                <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                    className="w-full border border-neutral-300 rounded-md pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Search by name or code"
                    value={searchTerm}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-neutral-700"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
            {isLoading && (
                <div className="py-6 text-center text-sm text-neutral-400">
                    Loading menu...
                </div>
            )}
            {!isLoading && error && (
                <div className="py-6 text-center text-sm text-red-500">
                    {error}
                </div>
            )}
            {!isLoading && !error && menuItems.length === 0 && (
                <div className="py-6 text-center text-sm text-neutral-400">
                    {searchTerm ? "No matching menu items found." : "No menu items found."}
                </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 lg:max-h-[calc(100vh-365px)] overflow-y-auto pr-1">
                {!isLoading && !error && menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onAdd(item)}
                        className="text-left text-sm border border-neutral-200 rounded-md px-3 py-2.5 hover:bg-neutral-100 active:scale-95 transition min-h-16"
                    >
                        <span className="block font-medium text-neutral-800">{item.name}</span>
                        <span className="block text-xs text-neutral-500">
                            {item.code ? `${item.code} | ` : ""}Rs. {Number(item.srate).toFixed(2)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function OrderRow({ item, onQtyChange, onRemove }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5 border-b last:border-b-0">
            <div className="flex-1 min-w-0 text-sm font-medium text-neutral-800">{item.name}</div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    className="w-6 h-6 flex items-center justify-center border rounded hover:bg-neutral-100"
                    onClick={() => onQtyChange(item.id, -1)}
                >
                    <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                <button
                    className="w-6 h-6 flex items-center justify-center border rounded hover:bg-neutral-100"
                    onClick={() => onQtyChange(item.id, 1)}
                >
                    <Plus size={12} />
                </button>
                <button
                    className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                    onClick={() => onRemove(item.id)}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

function OrderList({ items, onQtyChange, onRemove }) {
    if (items.length === 0) {
        return (
        <div className="p-8 text-center text-sm text-neutral-400">
                No items added yet. Tap a menu item above.
            </div>
        );
    }
    return (
        <div className="px-4 sm:px-5 py-2 max-h-72 lg:max-h-[calc(100vh-470px)] overflow-y-auto">
            {items.map((item) => (
                <OrderRow key={item.id} item={item} onQtyChange={onQtyChange} onRemove={onRemove} />
            ))}
        </div>
    );
}

function KotPrintPreview({ kotNo, tableNo, tableLabel, waiterLabel, items, total }) {
    if (items.length === 0) return null;
    return (
        <div className="mx-4 sm:mx-5 mb-4 border-2 border-dashed rounded-md p-3 bg-neutral-50 font-mono text-xs">
            <div className="text-center font-bold mb-1">KOT</div>
            <div className="flex justify-between">
                <span>KOT No: {kotNo}</span>
                <span>{tableNo ? tableLabel || `Table ${tableNo}` : "-"}</span>
            </div>
            <div className="text-center text-[10px] text-neutral-500">
                Waiter: {waiterLabel || "-"}
            </div>
            <div className="text-center text-[10px] text-neutral-500 mb-1">
                {new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
            </div>
            <div className="border-t border-dashed my-1" />
            <div className="flex font-bold">
                <span className="flex-1">Item</span>
                <span className="w-10 text-right">Qty</span>
            </div>
            <div className="border-t border-dashed my-1" />
            {items.map((item) => (
                <div key={item.id} className="flex">
                    <span className="flex-1">{item.name}</span>
                    <span className="w-10 text-right">{item.qty}</span>
                </div>
            ))}
            <div className="border-t border-dashed my-1" />
            <div className="flex justify-between font-bold">
                <span>Total items</span>
                <span>{total}</span>
            </div>
        </div>
    );
}

function Footer({ onSubmit, disabled, isSubmitting }) {
    return (
        <div className="p-4 sm:p-5 border-t bg-white">
            <button
                onClick={onSubmit}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 disabled:bg-neutral-300 text-white rounded-md py-2.5 font-medium text-sm"
            >
                <Printer size={16} />
                {isSubmitting ? "Generating KOT..." : "Send KOT to kitchen"}
            </button>
        </div>
    );
}

export default function KotApp({ tableNo, tableLabel, waiterId, waiterLabel, onKotGenerated }) {
    const [kotNo, setKotNo] = useState(null);
    const [items, setItems] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMenuLoading, setIsMenuLoading] = useState(false);
    const [menuError, setMenuError] = useState("");
    const [kotError, setKotError] = useState("");
    const [generatedKotId, setGeneratedKotId] = useState(null);
    const [isSubmittingKot, setIsSubmittingKot] = useState(false);
    const [sent, setSent] = useState(false);

    const fetchNextKotNo = useCallback(async () => {
        try {
            const { data } = await api.get("/kots/next-number");
            setKotNo(data.next_kot_no);
        } catch {
            setKotNo(null);
        }
    }, []);

    const fetchMenuItems = useCallback(async (term = "") => {
        setIsMenuLoading(true);
        setMenuError("");

        try {
            const trimmedTerm = term.trim();
            const { data } = await api.get(trimmedTerm ? "/menu/search" : "/menu", {
                params: trimmedTerm ? { search: trimmedTerm } : undefined,
            });

            setMenuItems(data);
        } catch (err) {
            setMenuError(err.response?.data?.message || "Unable to load menu items.");
        } finally {
            setIsMenuLoading(false);
        }
    }, []);

    const downloadKotPdf = async (kotId) => {
        const response = await api.get(`/kots/${kotId}/pdf`, {
            params: {
                size: "80",
            },
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data], {
            type: "application/pdf",
        }));
        const link = document.createElement("a");

        link.href = url;
        link.download = `kot-${kotId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchMenuItems(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [fetchMenuItems, searchTerm]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchNextKotNo();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [fetchNextKotNo]);

    const addItem = (menuItem) => {
        setSent(false);
        setItems((prev) => {
            const existing = prev.find((i) => i.id === menuItem.id);
            if (existing) {
                return prev.map((i) => (i.id === menuItem.id ? { ...i, qty: i.qty + 1 } : i));
            }
            return [...prev, { id: menuItem.id, name: menuItem.name, qty: 1 }];
        });
    };

    const onQtyChange = (id, delta) => {
        setItems((prev) =>
            prev
                .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
                .filter((i) => i.qty > 0)
        );
    };

    const onRemove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

    const total = items.reduce((sum, i) => sum + i.qty, 0);
    const tableNoValue = Number(tableNo);
    const waiterIdValue = Number(waiterId);
    const canSubmit =
        Number.isInteger(tableNoValue) &&
        tableNoValue > 0 &&
        Number.isInteger(waiterIdValue) &&
        waiterIdValue > 0 &&
        items.length > 0 &&
        !isSubmittingKot;

    const generateKot = async () => {
        if (!canSubmit) {
            return;
        }

        setKotError("");
        setGeneratedKotId(null);
        setIsSubmittingKot(true);

        try {
            const { data } = await api.post("/kots", {
                table_no: tableNoValue,
                waiter_id: waiterIdValue,
                items: items.map((item) => ({
                    menu_item_id: item.id,
                    quantity: item.qty,
                })),
            });

            setGeneratedKotId(data.kot_id);
            await downloadKotPdf(data.kot_id);
            setKotNo(Number(data.kot_id) + 1);
            setSent(true);
            setItems([]);
            onKotGenerated?.();
        } catch (err) {
            setSent(false);
            setKotError(err.response?.data?.message || "Unable to generate KOT.");
        } finally {
            setIsSubmittingKot(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden border border-neutral-200">
            <Header kotNo={kotNo || "..."} tableNo={tableNo} tableLabel={tableLabel} waiterLabel={waiterLabel} />
            {(!tableNo || !waiterId) && (
                <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
                    Select table and waiter before sending the KOT.
                </div>
            )}
            <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <MenuGrid
                    menuItems={menuItems}
                    isLoading={isMenuLoading}
                    error={menuError}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAdd={addItem}
                    onRetry={() => fetchMenuItems(searchTerm)}
                />
                <div className="flex min-h-0 flex-col">
                    <div className="px-4 sm:px-5 pt-4 pb-2 border-b border-neutral-100">
                        <div className="text-xs font-medium text-neutral-600">Current Order</div>
                        <div className="text-sm font-semibold text-neutral-900">{total} item{total !== 1 ? "s" : ""}</div>
                    </div>
                    <OrderList items={items} onQtyChange={onQtyChange} onRemove={onRemove} />
                    <KotPrintPreview
                        kotNo={kotNo || "..."}
                        tableNo={tableNo}
                        tableLabel={tableLabel}
                        waiterLabel={waiterLabel}
                        items={items}
                        total={total}
                    />
                    {kotError && (
                        <div className="px-4 pt-4 text-center text-sm text-red-600 font-medium">
                            {kotError}
                        </div>
                    )}
                    <div className="mt-auto">
                        <Footer onSubmit={generateKot} disabled={!canSubmit} isSubmitting={isSubmittingKot} />
                    </div>
                    {sent && (
                        <div className="px-4 pb-4 text-center text-sm text-green-600 font-medium">
                            KOT #{generatedKotId} generated successfully.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
