// src/Pages/savings/MonthlySavingList.jsx
import { useState, useEffect, useMemo } from "react";
import apiClient from "../../services/apiClient";

const MONTHS_LIST = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const PAYMENT_MODES = ["Cash", "UPI / Online", "Bank Transfer", "Cheque"];

export default function MonthlySavingList({ onStartSaving }) {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Advanced Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  // Modal State for "i" Button & Calculator
  const [selectedSaving, setSelectedSaving] = useState(null);
  const [calculatorPaid, setCalculatorPaid] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(5);

  // Fetch live savings from Spring Boot MySQL backend
  useEffect(() => {
    apiClient.get('/api/savings')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSavings(data.map(item => ({
          id: item.id ? `SAV-${item.id}` : "SAV-501",
          memberId: item.memberId ? `MEM-${item.memberId}` : "MEM-1001",
          noOfMembers: item.numberOfMembers || 1,
          year: item.year || "2026",
          month: item.month || "October",
          amountMonthly: Number(item.amountMonthly || item.amount) || 0,
          totalExpected: (Number(item.amountMonthly || item.amount) || 0) * 12,
          status: item.status || item.paymentStatus || "Paid",
          mode: item.mode || item.paymentMode || "Bank Transfer",
          dueDate: item.dueDate || "2026-10-30"
        })));
      })
      .catch(err => setLoadError(err.message || "Failed to load savings records."))
      .finally(() => setLoading(false));
  }, []);

  // Filtered records
  const filteredSavings = useMemo(() => {
    return savings.filter((item) => {
      const matchesSearch = item.memberId.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = yearFilter === "All" || item.year === yearFilter;
      const matchesMonth = monthFilter === "All" || item.month === monthFilter;
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesMode = modeFilter === "All" || item.mode === modeFilter;
      return matchesSearch && matchesYear && matchesMonth && matchesStatus && matchesMode;
    });
  }, [savings, searchQuery, yearFilter, monthFilter, statusFilter, modeFilter]);

  // Financial Summary Totals
  const totalAmount = filteredSavings.reduce((acc, curr) => acc + curr.amountMonthly, 0);
  const paidAmount = filteredSavings.filter(i => i.status === "Paid" || i.status === "Installment" || i.status === "Complete").reduce((acc, curr) => acc + curr.amountMonthly, 0);
  const pendingAmount = filteredSavings.filter(i => i.status === "Pending").reduce((acc, curr) => acc + curr.amountMonthly, 0);

  // Pagination calculation
  const totalPages = Math.ceil(filteredSavings.length / entriesPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredSavings.slice(start, start + entriesPerPage);
  }, [filteredSavings, currentPage, entriesPerPage]);

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Savings Records Directory</span>
          <h1 className="text-2xl font-extrabold text-[#102a43] m-0">Monthly Saving Table</h1>
          <p className="text-xs text-slate-500 mt-1 m-0">Live searchable ledger of registered member savings with due amount calculators.</p>
        </div>
        {onStartSaving && (
          <button
            onClick={onStartSaving}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
          >
            + Register New Saving
          </button>
        )}
      </div>

      {/* Filters & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-[#102a43] uppercase tracking-wider">Advanced Filters</h3>
            <button
              onClick={() => {
                setSearchQuery("");
                setYearFilter("All");
                setMonthFilter("All");
                setStatusFilter("All");
                setModeFilter("All");
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-slate-600 hover:text-teal-700 underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Search ID or Member ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:border-teal-700 bg-white text-slate-800"
            />
            
            <select
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 font-bold"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <select
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 font-bold"
            >
              <option value="All">All Months</option>
              {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 font-bold"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Complete">Complete</option>
              <option value="Installment">Installment</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => { setModeFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 font-bold"
            >
              <option value="All">All Payment Modes</option>
              {PAYMENT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
          <h3 className="text-xs font-black text-[#102a43] uppercase tracking-wider mb-1">Financial Summary</h3>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Total</span>
            <span className="text-xs font-black text-teal-700">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-800">Paid</span>
            <span className="text-xs font-black text-emerald-700">₹{paidAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex justify-between items-center">
            <span className="text-xs font-bold text-amber-800">Pending</span>
            <span className="text-xs font-black text-amber-700">₹{pendingAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {loadError && <p className="text-red-600 text-xs" role="alert">{loadError}</p>}

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-teal-700 text-white font-bold uppercase tracking-wider">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Member ID</th>
                <th className="p-3.5">Year / Month</th>
                <th className="p-3.5">Monthly Amount</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 text-center">Action ("i")</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading live savings records from database...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-teal-800">{item.id}</td>
                    <td className="p-3.5 text-slate-500">{item.memberId}</td>
                    <td className="p-3.5 text-slate-600">{item.month} {item.year}</td>
                    <td className="p-3.5 font-bold text-teal-700">₹{item.amountMonthly.toLocaleString("en-IN")}</td>
                    <td className="p-3.5 text-slate-600">{item.mode}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "Paid" || item.status === "Complete" ? "bg-emerald-100 text-emerald-800" :
                        item.status === "Installment" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedSaving(item);
                          setCalculatorPaid(item.amountMonthly);
                        }}
                        className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-black border border-teal-200 hover:bg-teal-700 hover:text-white transition cursor-pointer inline-flex items-center justify-center shadow-xs"
                        title="View Details & Due Calculator"
                      >
                        i
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">No saving records found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-600">Showing {paginatedData.length} of {filteredSavings.length} entries</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="font-bold text-slate-700 px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* "i" BUTTON MODAL WITH DUE AMOUNT CALCULATOR */}
      {selectedSaving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest">Savings Audit &amp; Calculator</span>
                <h3 className="text-base font-extrabold text-[#102a43] m-0">Record Details: {selectedSaving.id}</h3>
              </div>
              <button
                onClick={() => setSelectedSaving(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Member ID</span>
                <strong className="text-[#102a43] font-bold text-sm">{selectedSaving.memberId}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Cycle</span>
                <strong className="text-[#102a43] font-bold text-sm">{selectedSaving.month} {selectedSaving.year}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Status</span>
                <span className="font-bold text-emerald-700">{selectedSaving.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Monthly Amount</span>
                <strong className="text-teal-700 font-extrabold text-sm">₹{selectedSaving.amountMonthly.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-blue-900">Total Expected Portfolio Target:</span>
                <span className="font-extrabold text-blue-900">₹{selectedSaving.totalExpected.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-emerald-800">Current Recorded Paid Amount:</span>
                <span className="font-extrabold text-emerald-700">₹{selectedSaving.amountMonthly.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-blue-200">
                <span className="font-black text-red-700">Standard Calculated Due Amount:</span>
                <span className="font-black text-red-700 text-sm">₹{Math.max(0, selectedSaving.totalExpected - selectedSaving.amountMonthly).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-4 bg-teal-50/40 border border-teal-200 rounded-xl space-y-3">
              <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider">🧮 Interactive Due Amount Calculator</h4>
              <p className="text-[11px] text-slate-600 m-0">Enter custom paid amount below to instantly calculate remaining due balance.</p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Custom Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={calculatorPaid}
                    onChange={(e) => setCalculatorPaid(e.target.value)}
                    className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs bg-white font-bold outline-none focus:border-teal-700"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex-1 bg-white p-2 rounded-lg border border-teal-300 text-right">
                  <span className="text-[9px] font-bold text-teal-800 uppercase block">Resulting Due</span>
                  <span className="text-sm font-black text-red-600">
                    ₹{Math.max(0, selectedSaving.totalExpected - (Number(calculatorPaid) || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSaving(null)}
                className="bg-[#102a43] hover:bg-[#081d30] text-white font-bold px-6 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}