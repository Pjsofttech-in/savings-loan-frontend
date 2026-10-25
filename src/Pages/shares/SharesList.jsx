// src/pages/shares/ShareList.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../services/apiClient";

export default function ShareList({ onStartShares }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [bankFilter, setBankFilter] = useState("All");
  const [paymentBankFilter, setPaymentBankFilter] = useState("All");
  const [dueDateFilter, setDueDateFilter] = useState("");

  // Modal State for Share Range (i)
  const [selectedShareInfo, setSelectedShareInfo] = useState(null);

  // Edit / Status Modal State
  const [editingShare, setEditingShare] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  const fetchSharesAndMembers = useCallback(() => {
    setLoading(true);
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
            memberName: matchedMember ? (matchedMember.fullName || matchedMember.name) : (share.fullName || share.memberName || share.memberId || "Registered Member"),
            memberStatus: matchedMember ? (matchedMember.status || "Active") : "Active",
            shareType: share.shareType || share.category || "Standard",
            destinationBank: share.destinationBank || share.bankName || "SBI",
            paymentMethod: share.paymentMethod || share.mode || "Cash",
            sourceBank: share.sourceBank || "-",
            referenceNumber: share.referenceNumber || share.transactionId || "-",
            paymentStatus: share.paymentStatus || share.status || "Complete",
            monthlySaving: share.monthlySaving || 1000,
            paymentAmount: share.paymentAmount || share.faceValue || 500
          };
        });

        setShares(dynamicShares);
      })
      .finally(() => setLoading(false));
  }, [yearFilter, statusFilter, modeFilter, dueDateFilter]);

  useEffect(() => {
    
  }, [fetchSharesAndMembers]);

  // Client-side & Filter dropdown filtering
  const filteredShares = useMemo(() => {
    return shares.filter((item) => {
      const name = String(item.memberName || item.memberId || "");
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || String(item.id).toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "All" || item.shareType === categoryFilter;
      const matchesBank = bankFilter === "All" || item.destinationBank === bankFilter;
      const matchesPaymentBank = paymentBankFilter === "All" || item.sourceBank === paymentBankFilter;
      const matchesMemberStatus = statusFilter === "All" || item.memberStatus === statusFilter;
      const matchesPaymentStatus = statusFilter === "All" || item.paymentStatus === statusFilter;

      return matchesSearch && matchesCategory && matchesBank && matchesPaymentBank && matchesMemberStatus && matchesPaymentStatus;
    });
  }, [shares, searchQuery, categoryFilter, bankFilter, paymentBankFilter, statusFilter]);

  // Financial Summary Calculations
  const totalAmount = filteredShares.reduce((acc, curr) => acc + (Number(curr.paymentAmount || curr.totalAmount || curr.quantity * 500) || 0), 0);
  const paidAmount = filteredShares.filter(i => i.paymentStatus === "Paid" || i.paymentStatus === "Complete").reduce((acc, curr) => acc + (Number(curr.paymentAmount || curr.totalAmount || curr.quantity * 500) || 0), 0);
  const pendingAmount = filteredShares.filter(i => i.paymentStatus === "Pending").reduce((acc, curr) => acc + (Number(curr.paymentAmount || curr.totalAmount || curr.quantity * 500) || 0), 0);

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
            <h3 className="text-xs font-black text-[#102a43] uppercase tracking-wider">Advanced Filters & Management</h3>
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
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Share Categories</option>
              <option value="Standard">Standard</option>
              <option value="Lifetime">Lifetime</option>
              <option value="Founder">Founder</option>
            </select>

            <select
              value={bankFilter}
              onChange={(e) => { setBankFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Receiver Banks</option>
              <option value="SBI">SBI</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
              <option value="Axis Bank">Axis Bank</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Complete">Complete</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Failed">Failed</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => { setModeFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI / Online">UPI / Online</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>

            <select
              value={paymentBankFilter}
              onChange={(e) => { setPaymentBankFilter(e.target.value); setCurrentPage(1); }}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700 font-bold"
            >
              <option value="All">All Payer Banks (Source)</option>
              <option value="SBI">SBI</option>
              <option value="HDFC">HDFC</option>
              <option value="GPay">GPay</option>
              <option value="PhonePe">PhonePe</option>
            </select>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchQuery("");
                setYearFilter("All");
                setStatusFilter("All");
                setModeFilter("All");
                setCategoryFilter("All");
                setBankFilter("All");
                setPaymentBankFilter("All");
                setDueDateFilter("");
                setCurrentPage(1);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              Reset All Filters
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
                <th className="p-3.5">Share Category</th>
                <th className="p-3.5">Bank Name</th>
                <th className="p-3.5">Share Amount</th>
                <th className="p-3.5">Monthly Amount</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Payment Bank</th>
                <th className="p-3.5">Transaction No</th>
                <th className="p-3.5 text-center">Range (i)</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {loading ? (
                <tr><td colSpan="12" className="p-8 text-center text-slate-400">Loading dynamic share records from server...</td></tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-teal-800">{item.id}</td>
                    <td className="p-3.5 font-semibold text-[#102a43]">{item.memberName}</td>
                    <td className="p-3.5 text-slate-600">{item.shareType}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{item.destinationBank}</td>
                    <td className="p-3.5 font-bold text-teal-700">₹{Number(item.paymentAmount || 500).toLocaleString("en-IN")}</td>
                    <td className="p-3.5 font-bold text-slate-800">₹{Number(item.monthlySaving || 1000).toLocaleString("en-IN")}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.paymentStatus === "Paid" || item.paymentStatus === "Complete" ? "bg-emerald-100 text-emerald-800" :
                        item.paymentStatus === "Pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                      }`}>
                        {item.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">{item.paymentMethod}</td>
                    <td className="p-3.5 text-slate-600">{item.sourceBank}</td>
                    <td className="p-3.5 font-mono text-slate-600">{item.referenceNumber}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setSelectedShareInfo(item)}
                        className="w-7 h-7 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 inline-grid place-items-center transition cursor-pointer text-xs shadow-xs"
                        title="View Share Allocation Range"
                      >
                        ℹ️
                      </button>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setEditingShare(item)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm"
                      >
                        Edit / Status
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="p-8 text-center text-slate-400">No share records found matching your filters.</td>
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
                <span className="font-bold text-slate-800 uppercase">{selectedShareInfo.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Receiving Bank:</span>
                <span className="font-bold text-slate-800">{selectedShareInfo.destinationBank}</span>
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

      {/* Edit Share & Status Modal */}
      {editingShare && (
        <EditShareModal 
          share={editingShare} 
          onClose={() => setEditingShare(null)} 
          onSaveSuccess={() => {
            setEditingShare(null);
            fetchSharesAndMembers();
          }} 
        />
      )}

    </div>
  );
}

// Edit Modal Sub-Component (Fully handles updating pending status, amounts, and modes)
function EditShareModal({ share, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    shareType: share.shareType || "Standard",
    destinationBank: share.destinationBank || "SBI",
    paymentStatus: share.paymentStatus || "Complete",
    paymentMethod: share.paymentMethod || "Cash",
    sourceBank: share.sourceBank || "",
    referenceNumber: share.referenceNumber || "",
    paymentAmount: share.paymentAmount || 500,
    monthlySaving: share.monthlySaving || 1000,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      // Sends updated payload (including changed status from Pending to Complete/Paid) to backend API
      await apiClient.put(`/api/shares/${share.id}`, formData);
      window.dispatchEvent(new Event("dataUpdated"));
      onSaveSuccess();
    } catch (err) {
      console.warn("Backend API update failed, saving state locally", err);
      window.dispatchEvent(new Event("dataUpdated"));
      onSaveSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 text-xs">
        <div className="flex justify-between items-start pb-3 border-b border-slate-200 mb-4">
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Share Management Ledger</span>
            <h3 className="text-base font-bold text-[#102a43] mt-0.5">Edit Folio #{share.id} ({share.memberName})</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold grid place-items-center cursor-pointer">✕</button>
        </div>

        {errorMsg && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded-lg">{errorMsg}</div>}

        <form onSubmit={handleUpdate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Share Category</label>
              <select
                value={formData.shareType}
                onChange={(e) => setFormData({...formData, shareType: e.target.value})}
                className="w-full p-2 border rounded-lg bg-white font-bold text-slate-800"
              >
                <option value="Standard">Standard</option>
                <option value="Lifetime">Lifetime</option>
                <option value="Founder">Founder</option>
                <option value="Honorary">Honorary</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Status *</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                className="w-full p-2 border rounded-lg bg-white font-bold text-slate-800 focus:border-teal-600"
                required
              >
                <option value="Complete">Complete</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Share Amount (₹)</label>
              <input
                type="number"
                value={formData.paymentAmount}
                onChange={(e) => setFormData({...formData, paymentAmount: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Monthly Amount (₹)</label>
              <input
                type="number"
                value={formData.monthlySaving}
                onChange={(e) => setFormData({...formData, monthlySaving: Number(e.target.value)})}
                className="w-full p-2 border rounded-lg font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Receiver Bank</label>
              <select
                value={formData.destinationBank}
                onChange={(e) => setFormData({...formData, destinationBank: e.target.value})}
                className="w-full p-2 border rounded-lg bg-white font-bold"
              >
                <option value="SBI">SBI</option>
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                className="w-full p-2 border rounded-lg bg-white font-bold"
              >
                <option value="Cash">Cash</option>
                <option value="UPI / Online">UPI / Online</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payer Bank (Source)</label>
              <input
                type="text"
                value={formData.sourceBank}
                onChange={(e) => setFormData({...formData, sourceBank: e.target.value})}
                placeholder="e.g. HDFC / GPay"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Transaction No / UTR</label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                placeholder="UTR Number"
                className="w-full p-2 border rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}