"use client";

import React, { useState, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import {
    Search, Filter, Plus, Download, ChevronRight, TrendingUp, Users,
    Calendar, DollarSign, ArrowUpRight, ArrowDownRight, MoreHorizontal,
    Table as TableIcon, LayoutDashboard, Settings, LogOut, Loader2,
    Edit, Trash2
} from "lucide-react";

interface DashboardProps {
    initialData: any[][] | null | undefined;
}

export default function Dashboard({ initialData }: DashboardProps) {
    const [data, setData] = useState<any[][]>(initialData || []);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
    const [activeView, setActiveView] = useState<"overview" | "table" | "schedule">("overview");
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
    const [newRow, setNewRow] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const headers = data[0] || [];
    const rows = useMemo(() => data.slice(1), [data]);

    const filteredRows = useMemo(() => {
        return rows.filter(row => {
            const matchesSearch = row.some(cell =>
                String(cell).toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Improved Date Filtering
            const dateIdx = headers.findIndex(h => h.toLowerCase().includes("date") || h.toLowerCase().includes("timestamp"));
            let matchesDateRange = true;

            if (dateIdx !== -1 && (startDate || endDate)) {
                const rowDateValue = row[dateIdx];
                if (rowDateValue) {
                    const rowDate = new Date(String(rowDateValue));
                    if (!isNaN(rowDate.getTime())) {
                        if (startDate) {
                            const start = new Date(startDate);
                            if (rowDate < start) matchesDateRange = false;
                        }
                        if (endDate) {
                            const end = new Date(endDate);
                            end.setHours(23, 59, 59, 999);
                            if (rowDate > end) matchesDateRange = false;
                        }
                    }
                }
            }

            return matchesSearch && matchesDateRange;
        });
    }, [rows, searchTerm, startDate, endDate, headers]);

    // Mock chart data based on sheet content
    const chartData = useMemo(() => {
        const nameIdx = headers.findIndex(h => h.toLowerCase().includes("project") || h.toLowerCase().includes("nom"));
        const valueIdx = headers.findIndex(h => h.toLowerCase().includes("valeur") || h.toLowerCase().includes("amount") || h.toLowerCase().includes("price"));

        return filteredRows.slice(0, 10).map(row => ({
            name: String(row[nameIdx !== -1 ? nameIdx : 0] || "Entry"),
            value: parseFloat(String(row[valueIdx !== -1 ? valueIdx : 2])) || Math.floor(Math.random() * 1000),
        }));
    }, [filteredRows, headers]);

    const stats = useMemo(() => {
        const projectIdx = headers.findIndex(h => h.toLowerCase().includes("project") || h.toLowerCase().includes("nom"));
        const hoursIdx = headers.findIndex(h => h.toLowerCase().includes("heure") || h.toLowerCase().includes("hour"));

        const uniqueProjects = new Set(filteredRows.map(row => String(row[projectIdx] || "")).filter(Boolean)).size;
        const totalHours = filteredRows.reduce((acc, row) => acc + (parseFloat(String(row[hoursIdx] || "0")) || 0), 0);
        const avgHours = totalHours / (filteredRows.length || 1);

        return [
            { label: "Total Projects", value: uniqueProjects, icon: TableIcon, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Hours", value: totalHours.toFixed(1), icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Avg Hours/Entry", value: avgHours.toFixed(1), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Entries", value: rows.length, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
        ];
    }, [filteredRows, headers]);

    const handleSubmitRow = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const finalRow = [...newRow];
            headers.forEach((h, i) => {
                if (h.toLowerCase() === "timestamp") {
                    finalRow[i] = new Date().toLocaleString();
                }
            });

            const method = editingRowIndex !== null ? "PATCH" : "POST";
            const payload = editingRowIndex !== null
                ? { rowIndex: editingRowIndex + 1, values: finalRow } // +1 because rows slice(1)
                : { values: finalRow };

            const res = await fetch("/api/sheets", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await refreshData();
                setIsAddingRow(false);
                setEditingRowIndex(null);
                setNewRow([]);
            }
        } catch (error) {
            console.error("Error submitting row:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRow = async (index: number) => {
        if (!confirm("Are you sure you want to delete this row?")) return;
        setIsLoading(true);
        try {
            // rows is data.slice(1), so data index is index + 1
            const res = await fetch(`/api/sheets?rowIndex=${index + 1}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await refreshData();
            }
        } catch (error) {
            console.error("Error deleting row:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/sheets");
            const result = await res.json();
            if (result.success) {
                setData(result.data || []);
                setLastRefreshed(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 hidden lg:flex">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <LayoutDashboard size={24} />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">SheetDash</span>
                </div>

                <nav className="flex flex-col gap-1">
                    <button
                        onClick={() => setActiveView("overview")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeView === "overview" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                    >
                        <LayoutDashboard size={20} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveView("table")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeView === "table" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                    >
                        <TableIcon size={20} /> Data Table
                    </button>
                    <button
                        onClick={() => setActiveView("schedule")}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeView === "schedule" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                    >
                        <Calendar size={20} /> Schedule
                    </button>
                </nav>

                <div className="mt-auto px-4 py-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-sm text-slate-400 font-medium mb-1">Current Plan</p>
                        <p className="text-lg font-bold mb-4">Pro Plan v2</p>
                        <button className="text-xs font-bold py-2 px-4 bg-white text-slate-900 rounded-lg hover:bg-indigo-50 transition-colors">
                            Upgrade Now
                        </button>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-10 overflow-y-auto  mx-auto w-full">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Metrics Overview</h1>
                        <p className="text-slate-500 font-medium text-lg">Real-time data from your Google Sheet connection.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Sync</span>
                            <span className="text-xs font-bold text-slate-600">{lastRefreshed}</span>
                        </div>
                        <button
                            onClick={refreshData}
                            disabled={isLoading}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <Loader2 size={20} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
                            <Download size={20} />
                        </button>
                        <button
                            onClick={() => setIsAddingRow(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
                        >
                            <Plus size={20} /> Add Entry
                        </button>
                    </div>
                </header>

                {/* Conditional Content Rendering */}
                {activeView === "overview" && (
                    <>
                        {/* Stats Grid */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-stats gap-6 mb-10 stats-grid-config">
                            {stats.map((stat, i) => (
                                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                            <stat.icon size={24} />
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                                            <ArrowUpRight size={14} /> 12%
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-semibold mb-1 uppercase tracking-wider text-xs">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                                </div>
                            ))}
                        </section>

                        {/* Charts & Filters */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                            {/* Main Chart */}
                            <section className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Performance Trend</h3>
                                        <p className="text-slate-500 text-sm font-medium">Visualizing the top 10 entries from your sheet.</p>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#4f46e5"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Filters & Actions */}
                            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
                                <h3 className="text-xl font-bold text-slate-900">Advanced Filters</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Search Data</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search anything..."
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium border text-slate-800"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date Range</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 bg-slate-50 border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium border text-xs text-slate-800"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    placeholder="Start"
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 bg-slate-50 border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium border text-xs text-slate-800"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    placeholder="End"
                                                />
                                            </div>
                                        </div>
                                        {(startDate || endDate) && (
                                            <button
                                                onClick={() => { setStartDate(""); setEndDate(""); }}
                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 mt-2 flex items-center gap-1"
                                            >
                                                Clear Date Range
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                            <DollarSign size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-900">Revenue Insight</span>
                                    </div>
                                    <p className="text-xs text-emerald-700 leading-tight">Your data shows a positive trend in high-value transactions this month.</p>
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {activeView === "table" && (
                    <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-10">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Spreadsheet Rows</h3>
                                <p className="text-slate-500 text-sm font-medium">Detailed view of all active records.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1">
                                    <Calendar size={14} className="text-slate-400" />
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 p-1"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        title="Start Date"
                                    />
                                    <span className="text-slate-300">—</span>
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-xs font-semibold text-slate-600 focus:ring-0 p-1"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        title="End Date"
                                    />
                                    {(startDate || endDate) && (
                                        <button
                                            onClick={() => { setStartDate(""); setEndDate(""); }}
                                            className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Clear Dates"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Quick search..."
                                        className="pl-10 pr-4 py-2 bg-slate-50 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-medium border text-slate-800 text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-400 text-xs font-extrabold uppercase tracking-widest">
                                        {headers.map((h, i) => (
                                            <th key={i} className="px-8 py-4">{h}</th>
                                        ))}
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRows.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            {headers.map((_, j) => (
                                                <td key={j} className="px-8 py-5">
                                                    <span className={`text-sm font-semibold ${j === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {row[j] || "—"}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => {
                                                            setEditingRowIndex(rows.indexOf(row));
                                                            setNewRow([...row]);
                                                            setIsAddingRow(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Edit Row"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRow(rows.indexOf(row))}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Row"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeView === "schedule" && (
                    <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6 min-h-[400px] items-center justify-center text-center">
                        <div className="p-6 bg-indigo-50 text-indigo-600 rounded-full mb-4">
                            <Calendar size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">Schedule View</h3>
                        <p className="text-slate-500 max-w-md">Coming soon: A calendar-based view of your sheet data, organized by the date columns found in your spreadsheet.</p>
                        <button
                            onClick={() => setActiveView("table")}
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                        >
                            Back to Table
                        </button>
                    </section>
                )}
            </main>

            {/* Add Row Modal */}
            {isAddingRow && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-900">{editingRowIndex !== null ? "Edit Row Entry" : "New Spreadsheet Entry"}</h3>
                            <button
                                onClick={() => {
                                    setIsAddingRow(false);
                                    setEditingRowIndex(null);
                                    setNewRow([]);
                                }}
                                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all font-bold"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmitRow} className="p-8 flex flex-col gap-6">
                            {headers.map((h, i) => {
                                if (h.toLowerCase() === "timestamp") return null;

                                const isDate = h.toLowerCase() === "date";
                                const isComment = h.toLowerCase().includes("comment");

                                return (
                                    <div key={i}>
                                        <label className="text-sm font-bold text-slate-600 mb-2 block">{h}</label>
                                        {isComment ? (
                                            <textarea
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-semibold border text-slate-800 min-h-[100px] resize-none"
                                                placeholder={`Enter ${h}...`}
                                                onChange={(e) => {
                                                    const updated = [...newRow];
                                                    updated[i] = e.target.value;
                                                    setNewRow(updated);
                                                }}
                                            />
                                        ) : (
                                            <input
                                                type={isDate ? "date" : "text"}
                                                required
                                                className="w-full px-4 py-3 bg-slate-50 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all font-semibold border text-slate-800"
                                                placeholder={`Enter ${h}...`}
                                                onChange={(e) => {
                                                    const updated = [...newRow];
                                                    updated[i] = e.target.value;
                                                    setNewRow(updated);
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingRow(false);
                                        setEditingRowIndex(null);
                                        setNewRow([]);
                                    }}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (editingRowIndex !== null ? "Update Entry" : "Save Entry")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
        .stats-grid-config {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
      `}</style>
        </div>
    );
}
