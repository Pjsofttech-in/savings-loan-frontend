// src/Pages/savings/MonthlySavingList.jsx
import { useState, useMemo } from "react";

export default function MonthlySavingList({ onStartSaving }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  const [savings] = useState([
    { id: "SAV-501293", memberId: "MEM-1001", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 5000, status: "Paid", mode: "UPI", dueDate: "2026-10-10" },
    { id: "SAV-501294", memberId: "MEM-1004", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 3500, status: "Installment", mode: "Cash", dueDate: "2026-10-15" },
    { id: "SAV-501295", memberId: "MEM-1008", noOfMembers: 4, year: "2026", month: "September", amountMonthly: 20000, status: "Paid", mode: "Bank Transfer", dueDate: "2026-09-10" },
    { id: "SAV-501296", memberId: "MEM-1012", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 5000, status: "Pending", mode: "Cheque", dueDate: "2026-10-25" },
    { id: "SAV-501297", memberId: "MEM-1015", noOfMembers: 2, year: "2026", month: "August", amountMonthly: 10000, status: "Refund", mode: "UPI", dueDate: "2026-08-10" },
  ]);

  // Filtered records
  const filteredSavings = useMemo(() => {
    return savings.filter((item) => {
      const matchesSearch = item.memberId.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = yearFilter === "All" || item.year === yearFilter;
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesMode = modeFilter === "All" || item.mode === modeFilter;
      const matchesDueDate = !dueDateFilter || item.dueDate === dueDateFilter;
      return matchesSearch && matchesYear && matchesStatus && matchesMode && matchesDueDate;
    });
  }, [savings, searchQuery, yearFilter, statusFilter, modeFilter, dueDateFilter]);

  // Vertical Summary Totals
  const totalAmount = filteredSavings.reduce((acc, curr) => acc + curr.amountMonthly, 0);
  const paidAmount = filteredSavings.filter(i => i.status === "Paid" || i.status === "Installment").reduce((acc, curr) => acc + curr.amountMonthly, 0);
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
          <p className="text-xs text-slate-500 mt-1 m-0">Detailed searchable ledger of all registered monthly member savings with advanced filters.</p>
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

      {/* Layout Grid: Filters & Vertical Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Panel */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-xs font-black text-[#102a43] uppercase tracking-wider">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Installment">Installment</option>
              <option value="Refund">Refund</option>
              <option value="Pending">Pending</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => { setModeFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>

            <input
              type="date"
              value={dueDateFilter}
              onChange={(e) => { setDueDateFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700"
            />

            <button
              onClick={() => {
                setSearchQuery("");
                setYearFilter("All");
                setStatusFilter("All");
                setModeFilter("All");
                setDueDateFilter("");
                setCurrentPage(1);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Vertical Financial Summary Cards */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
          <h3 className="text-xs font-black text-[#102a43] uppercase tracking-wider mb-1">Financial Summary</h3>
          
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Total Amount</span>
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

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-teal-700 text-white font-bold uppercase tracking-wider">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Member ID</th>
                <th className="p-3.5">Units</th>
                <th className="p-3.5">Year / Month</th>
                <th className="p-3.5">Amount (₹)</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-teal-800">{item.id}</td>
                    <td className="p-3.5 text-slate-500">{item.memberId}</td>
                    <td className="p-3.5 font-semibold text-[#102a43]">{item.noOfMembers}</td>
                    <td className="p-3.5 text-slate-600">{item.month} {item.year}</td>
                    <td className="p-3.5 font-bold text-teal-700">₹{item.amountMonthly.toLocaleString("en-IN")}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{item.mode}</td>
                    <td className="p-3.5 text-slate-600">{item.dueDate}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "Paid" ? "bg-emerald-100 text-emerald-800" :
                        item.status === "Installment" ? "bg-sky-100 text-sky-800" :
                        item.status === "Refund" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">No matching saving records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Entries Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Per Page Entries:</span>
            <select
              value={entriesPerPage}
              onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-bold text-slate-800 focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-500 ml-2">Showing {paginatedData.length} of {filteredSavings.length} entries</span>
          </div>

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
    </div>
  );
}