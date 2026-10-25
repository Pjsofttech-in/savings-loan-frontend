// src/Pages/registration/List.jsx
import { useState, useEffect, useRef } from "react";
import { fetchMembers, updateMember } from "../../services/memberService";
import { fetchShareAllocations } from "../../services/shareService";
import apiClient from "../../services/apiClient";

export default function List({ onEditMember }) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", mobile: "", address: "", registrationFee: 500, newPassword: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");
  const [filterMemberStatus, setFilterMemberStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterBank, setFilterBank] = useState("All");

  const latestRequest = useRef(0);

  const buildRecords = (memberRecords, shareRecords) => {
    const membersList = Array.isArray(memberRecords) ? memberRecords : [];
    const sharesList = Array.isArray(shareRecords) ? shareRecords : [];

    const sharesByMemberId = new Map();
    sharesList.forEach((share) => {
      if (share && share.memberId && !sharesByMemberId.has(String(share.memberId))) {
        sharesByMemberId.set(String(share.memberId), share);
      }
    });

    return membersList.map((member) => {
      const share = sharesByMemberId.get(String(member.id)) || {};
      const hasAmount = share.paymentAmount !== undefined && share.paymentAmount !== null;
      const shareAmount = hasAmount ? Number(share.paymentAmount) : Number(member.registrationFee) || 500;
      const monthlyAmount = Number(share.monthlySaving || share.monthlyFee || member.monthlyFee) || 1000;
      const status = share.paymentStatus || member.paymentStatus || "Complete";
      const memberStatus = member.status || "Active";
      const category = share.shareType || member.memberType || "Standard";
      const bank = share.destinationBank || member.destinationBank || "SBI";

      return {
        id: member.id,
        user: member.fullName || member.user || "Member",
        memberId: member.id || "-",
        shareAmount,
        monthlyAmount,
        mobile: member.mobile || "",
        address: member.address || member.street || "",
        category,
        bank,
        memberStatus,
        date: member.applicationDate || member.joiningDate || share.applicationDate || "2026-10-20",
        paymentMethod: share.paymentMethod || member.paymentMode || "Cash",
        paymentStatus: status,
        amount: `₹${shareAmount}`,
        rawMember: member,
        share,
      };
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const requestId = ++latestRequest.current;
      setRecordsError("");
      try {
        const [memberRecords, shareRecords] = await Promise.all([
          fetchMembers(),
          fetchShareAllocations().catch(() => []),
        ]);
        if (!isMounted || requestId !== latestRequest.current) return;
        setRecords(buildRecords(memberRecords, shareRecords));
      } catch (error) {
        if (isMounted && requestId === latestRequest.current) {
          setRecordsError(error.message || "Failed to load records.");
        }
      } finally {
        if (isMounted && requestId === latestRequest.current) setLoadingRecords(false);
      }
    };

    loadData();
    window.addEventListener("dataUpdated", loadData);

    return () => {
      isMounted = false;
      window.removeEventListener("dataUpdated", loadData);
    };
  }, []);

  const handleEditClick = (record, e) => {
    e.stopPropagation();
    if (typeof onEditMember === "function") {
      const share = record.share || {};
      onEditMember({
        ...(record.rawMember || {}),
        registrationFee: record.shareAmount,
        monthlyFee: record.monthlyAmount,
        paymentStatus: record.paymentStatus,
        paymentMode: record.paymentMethod,
        transactionId: share.referenceNumber || "",
        sourceBank: share.sourceBank || "",
        destinationBank: record.bank,
        memberType: record.category,
      });
    } else {
      setEditingMember(record);
      setEditForm({
        fullName: record.user,
        mobile: record.mobile || "",
        address: record.address || "",
        registrationFee: record.shareAmount || 500,
        newPassword: "",
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingEdit(true);
    try {
      const { newPassword, ...memberFields } = editForm;
      const saved = await updateMember(editingMember.id, memberFields);
      if (!saved) throw new Error("Member was not found on the server.");
      
      setRecords((prev) => prev.map((r) => (r.id === editingMember.id
        ? { ...r, user: saved.fullName || r.user, mobile: saved.mobile || r.mobile, address: saved.address || r.address,
            shareAmount: Number(memberFields.registrationFee) || r.shareAmount,
            amount: `₹${Number(memberFields.registrationFee) || r.shareAmount}`, rawMember: saved }
        : r)));
      if (newPassword) {
        if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
        await apiClient.put(`/api/members/${encodeURIComponent(editingMember.id)}/password`, { password: newPassword });
      }
      setEditingMember(null);
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (err) {
      alert("Failed to update member: " + (err.message || "Unknown error"));
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredRecords = records.filter((item) => {
    if (filterPaymentStatus !== "All" && item.paymentStatus !== filterPaymentStatus) return false;
    if (filterMemberStatus !== "All" && item.memberStatus !== filterMemberStatus) return false;
    if (filterCategory !== "All" && item.category !== filterCategory) return false;
    if (filterBank !== "All" && item.bank !== filterBank) return false;
    if (searchQuery.trim() && !item.user.toLowerCase().includes(searchQuery.toLowerCase()) && !String(item.memberId).toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPaid = records
    .filter((record) => record.paymentStatus === "Complete" || record.paymentStatus === "Paid")
    .reduce((total, record) => total + (Number(String(record.amount).replace(/[^0-9.-]+/g, "")) || 0), 0);
  
  const totalPending = records
    .filter((record) => record.paymentStatus === "Pending")
    .reduce((total, record) => total + (Number(String(record.amount).replace(/[^0-9.-]+/g, "")) || 0), 0);

  const totalMonthly = filteredRecords.reduce((total, record) => total + (Number(record.monthlyAmount) || 0), 0);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="p-6 max-w-[1400px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans text-xs">
      
      {/* Header & Advanced Filters */}
      <div className="mb-5 pb-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[#102a43] text-base font-bold m-0 uppercase tracking-wide">Member &amp; Transaction Directory</h2>
            <p className="text-slate-500 text-[11px] mt-0.5">Review registered members, manage details, or inspect financial records.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 outline-none focus:border-teal-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Categories</option>
            <option value="Standard">Standard</option>
            <option value="Lifetime">Lifetime</option>
            <option value="Founder">Founder</option>
            <option value="Honorary">Honorary</option>
          </select>

          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Banks</option>
            <option value="SBI">SBI</option>
            <option value="HDFC Bank">HDFC Bank</option>
            <option value="ICICI Bank">ICICI Bank</option>
            <option value="Axis Bank">Axis Bank</option>
          </select>

          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Payment Statuses</option>
            <option value="Complete">Complete</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>

          <select
            value={filterMemberStatus}
            onChange={(e) => setFilterMemberStatus(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Member Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Summary Badges (Clean White Background Cards) */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Collected:</span>
          <span className="text-sm font-extrabold text-emerald-700">₹{totalPaid}</span>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Pending:</span>
          <span className="text-sm font-extrabold text-amber-600">₹{totalPending}</span>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Monthly:</span>
          <span className="text-sm font-extrabold text-teal-700">₹{totalMonthly}</span>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Yearly:</span>
          <span className="text-sm font-extrabold text-sky-700">₹{totalYearly}</span>
        </div>
      </div>

      {/* Professional Clean Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-center">
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Member ID</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">User Name</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Category</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Bank</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Share Amount</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Monthly Amount</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Member Status</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Payment Status</th>
              <th className="py-3 px-3 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-center text-slate-700">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <tr 
                  key={record.id} 
                  onClick={() => setSelectedMember(record)}
                  className={`hover:bg-slate-50 cursor-pointer transition ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-600">MEM-{record.memberId}</td>
                  <td className="py-3.5 px-3 font-bold text-[#102a43]">{record.user}</td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">{record.category}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700">{record.bank}</td>
                  <td className="py-3.5 px-3 font-bold text-teal-700">₹{record.shareAmount}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-800">₹{record.monthlyAmount}</td>
                  
                  {/* Clean text member status */}
                  <td className="py-3.5 px-3">
                    <span className={`font-bold text-xs uppercase tracking-wider ${
                      record.memberStatus === "Active" ? "text-teal-700" : "text-slate-500"
                    }`}>
                      {record.memberStatus}
                    </span>
                  </td>

                  {/* Clean text payment status */}
                  <td className="py-3.5 px-3">
                    <span className={`font-bold text-xs uppercase tracking-wider ${
                      record.paymentStatus === "Complete" || record.paymentStatus === "Paid"
                        ? "text-emerald-700"
                        : "text-amber-600"
                    }`}>
                      {record.paymentStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={(e) => handleEditClick(record, e)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-bold text-[11px] transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-10 text-center text-slate-400 font-medium">
                  {loadingRecords ? "Loading member records..." : recordsError || "No member records found matching your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Local Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Member Management</span>
                <h3 className="text-base font-bold text-[#102a43] mt-0.5">Edit Member Details</h3>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold grid place-items-center transition cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-teal-600 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-teal-600 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-teal-600 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Set / Reset Login Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave empty to keep current (min 8 characters)"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-teal-600 bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Registration Fee (₹)</label>
                <input
                  type="number"
                  value={editForm.registrationFee}
                  onChange={(e) => setEditForm({ ...editForm, registrationFee: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-300 rounded-lg outline-none focus:border-teal-600 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Financial Ledger Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Member Financial Ledger</span>
                <h3 className="text-base font-bold text-[#102a43] mt-0.5">{selectedMember.user}</h3>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold grid place-items-center transition cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Member ID:</span>
                <span className="font-mono font-bold text-slate-800">MEM-{selectedMember.memberId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mobile:</span>
                <span className="font-bold text-slate-800">{selectedMember.mobile || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Share Amount:</span>
                <span className="font-bold text-teal-700">₹{selectedMember.shareAmount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Monthly Amount:</span>
                <span className="font-bold text-slate-800">₹{selectedMember.monthlyAmount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Category / Bank:</span>
                <span className="font-bold text-slate-900">{selectedMember.category} ({selectedMember.bank})</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}