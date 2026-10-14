// src/Pages/registration/SharesList.jsx
import { useState, useEffect, useMemo } from "react";
import apiClient from "../../services/apiClient";

export default function SharesList({ onStartShares }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState("");

  // Modal State for Share Range (i)
  const [selectedShareInfo, setSelectedShareInfo] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  // Fetch dynamic shares and member data from Spring Boot backend
  useEffect(() => {
    const params = new URLSearchParams();
    if (yearFilter !== "All") params.append("year", yearFilter);
    if (statusFilter !== "All") params.append("status", statusFilter);
    if (modeFilter !== "All") params.append("mode", modeFilter);
    if (dueDateFilter) params.append("dueDate", dueDateFilter);

    Promise.all([
      apiClient.get(`/api/shares?${params.toString()}`).catch(() => ({ data: [] })),
      apiClient.get('/api/members').catch(() => ({ data: [] }))
    ])
      .then(([sharesRes, membersRes]) => {
        const rawShares = Array.isArray(sharesRes.data) ? sharesRes.data : [];
        const membersList = Array.isArray(membersRes.data) ? membersRes.data : [];

        // Map member names dynamically and compute continuous share ranges
        let runningTotal = 0;
        const dynamicShares = rawShares.map(share => {
          const matchedMember = membersList.find(m => m.id === share.memberId || m.id === share.member_id);
          const qty = Number(share.numberOfShares || share.quantity) || 1;
          const start = runningTotal + 1;
          const end = start + qty - 1;
          runningTotal = end;

          return {
            ...share,
            quantity: qty,
            shareRange: `${start} - ${end}`,
            memberName: matchedMember ? (matchedMember.fullName || matchedMember.name) : (share.memberName || share.memberId || "Registered Member")
          };
        });

        setShares(dynamicShares);
      })
      .finally(() => setLoading(false));
  }, [yearFilter, statusFilter, modeFilter, dueDateFilter]);

  // Client-side search filtering
  const filteredShares = useMemo(() => {
    return shares.filter((item) => {
      const name = item.memberName || item.memberId || "";
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [shares, searchQuery]);

  // Vertical Summary Calculations
  const totalAmount = filteredShares.reduce((acc, curr) => acc + (Number(curr.totalAmount || curr.quantity * 1000) || 0), 0);
  const paidAmount = filteredShares.filter(i => i.status === "Paid" || i.status === "Installment" || i.status === "Complete").reduce((acc, curr) => acc + (Number(curr.totalAmount || curr.quantity * 1000) || 0), 0);
  const pendingAmount = filteredShares.filter(i => i.status === "Pending").reduce((acc, curr) => acc + (Number(curr.totalAmount || curr.quantity * 1000) || 0), 0);

  // Pagination calculation
  const totalPages = Math.ceil(filteredShares.length / entriesPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredShares.slice(start, start + entriesPerPage);
  }, [filteredShares, currentPage, entriesPerPage]);

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      
      {/* Filters & Vertical Summary Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Panel */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-[#102a43] uppercase tracking-wider">Advanced Filters</h3>
            {onStartShares && (
              <button
                onClick={onStartShares}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                + Allocate New Shares
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search Folio ID or Member Name..."
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
              <option value="Complete">Complete</option>
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
                <th className="p-3.5">Folio ID</th>
                <th className="p-3.5">Member Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Quantity</th>
                <th className="p-3.5">Total Amount (₹)</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Share Range (i)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {loading ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-400">Loading dynamic share records from server...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-teal-800">{item.id}</td>
                    <td className="p-3.5 font-semibold text-[#102a43]">{item.memberName}</td>
                    <td className="p-3.5 text-slate-600">{item.category || item.shareType}</td>
                    <td className="p-3.5 font-semibold">{item.quantity}</td>
                    <td className="p-3.5 font-bold text-teal-700">₹{(item.totalAmount || item.quantity * (item.faceValue || 1000)).toLocaleString("en-IN")}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{item.paymentMode || item.mode || "UPI"}</td>
                    <td className="p-3.5 text-slate-600">{item.dueDate || "-"}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "Paid" || item.status === "Complete" ? "bg-emerald-100 text-emerald-800" :
                        item.status === "Installment" ? "bg-sky-100 text-sky-800" :
                        item.status === "Refund" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status || "Complete"}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedShareInfo(item)}
                        className="w-7 h-7 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 inline-grid place-items-center transition cursor-pointer text-xs shadow-xs"
                        title="View Share Allocation Range"
                      >
                        ℹ️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-400">No share records found.</td>
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
            <span className="text-slate-500 ml-2">Showing {paginatedData.length} of {filteredShares.length} entries</span>
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

      {/* Share Range Info Modal Popup */}
      {selectedShareInfo && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Share Allocation Ledger</span>
                <h3 className="text-base font-bold text-[#102a43] mt-0.5">Folio: {selectedShareInfo.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedShareInfo(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold grid place-items-center transition cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Member Name:</span>
                <span className="font-bold text-slate-900">{selectedShareInfo.memberName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Total Shares Owned:</span>
                <span className="font-bold text-teal-700">{selectedShareInfo.quantity} Units</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 items-center">
                <span className="text-slate-500">Exact Share Number Range:</span>
                <span className="font-mono font-extrabold bg-teal-100 text-teal-900 px-2.5 py-1 rounded text-sm">
                  #{selectedShareInfo.shareRange}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedShareInfo.status || "Complete"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Receiving Bank:</span>
                <span className="font-bold text-slate-800">{selectedShareInfo.destinationBank || "Primary Settings Account"}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedShareInfo(null)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}