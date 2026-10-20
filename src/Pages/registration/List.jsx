// src/Pages/registration/List.jsx
import { useState, useEffect } from "react";
import { fetchMembers, updateMember } from "../../services/memberService";
import { fetchShareAllocations } from "../../services/shareService";

export default function List({ onEditMember }) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", mobile: "", address: "", registrationFee: 500 });
  const [savingEdit, setSavingEdit] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      setLoadingRecords(true);
      try {
        const [memberRecords, shareRecords] = await Promise.all([
          fetchMembers().catch(() => []),
          fetchShareAllocations().catch(() => [])
        ]);

        if (!isMounted) return;

        const membersList = Array.isArray(memberRecords) ? memberRecords : [];
        const sharesList = Array.isArray(shareRecords) ? shareRecords : [];

        const sharesByMemberId = new Map();
        sharesList.forEach((share) => {
          if (share && share.memberId) {
            sharesByMemberId.set(String(share.memberId), share);
          }
        });

        const combinedRecords = membersList.map((member) => {
          const share = sharesByMemberId.get(String(member.id)) || {};
          const amount = Number(share.paymentAmount) || Number(member.registrationFee) || 500;
          const status = share.paymentStatus || member.paymentStatus || "Complete";

          return {
            id: member.id,
            user: member.fullName || member.user || "Member",
            memberId: member.id || "-",
            memberFee: member.registrationFee || 500,
            mobile: member.mobile || "",
            address: member.address || member.street || "",
            category: share.shareType || member.memberType || "Standard Member",
            date: member.applicationDate || member.joiningDate || share.applicationDate || "2026-10-20",
            paymentMethod: share.paymentMethod || member.paymentMode || "Cash",
            paymentStatus: status,
            amount: `₹${amount}`,
            rawMember: member
          };
        });

        setRecords(combinedRecords);
      } catch (error) {
        if (isMounted) setRecordsError(error.message || "Failed to load records.");
      } finally {
        if (isMounted) setLoadingRecords(false);
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
      onEditMember(record.rawMember || record);
    } else {
      setEditingMember(record);
      setEditForm({
        fullName: record.user,
        mobile: record.mobile || "",
        address: record.address || "",
        registrationFee: record.memberFee || 500,
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingEdit(true);
    try {
      if (typeof updateMember === "function") {
        await updateMember(editingMember.id, editForm);
      } else {
        await fetch(`/api/members/${editingMember.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });
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
    if (searchQuery.trim() && !item.user.toLowerCase().includes(searchQuery.toLowerCase()) && !String(item.memberId).toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPaid = records
    .filter((record) => record.paymentStatus === "Complete")
    .reduce((total, record) => total + (Number(String(record.amount).replace(/[^0-9.-]+/g, "")) || 0), 0);
  
  const totalPending = records
    .filter((record) => record.paymentStatus === "Pending")
    .reduce((total, record) => total + (Number(String(record.amount).replace(/[^0-9.-]+/g, "")) || 0), 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans text-xs">
      
      {/* Header & Controls */}
      <div className="mb-5 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[#102a43] text-base font-bold m-0 uppercase tracking-wide">Member &amp; Transaction Directory</h2>
          <p className="text-slate-500 text-[11px] mt-0.5">Review registered members, manage details, or inspect financial records.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 outline-none focus:border-teal-600 shadow-2xs"
          />
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Statuses</option>
            <option value="Complete">Complete</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-emerald-700 uppercase">Total Collected:</span>
          <span className="text-sm font-extrabold">₹{totalPaid}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-amber-700 uppercase">Total Pending:</span>
          <span className="text-sm font-extrabold">₹{totalPending}</span>
        </div>
      </div>

      {/* Professional Clean Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-center">
              <th className="py-3 px-4 border-r border-slate-200 font-bold">Member ID</th>
              <th className="py-3 px-4 border-r border-slate-200 font-bold">User Name</th>
              <th className="py-3 px-4 border-r border-slate-200 font-bold">Member Fee</th>
              <th className="py-3 px-4 border-r border-slate-200 font-bold">Category</th>
              <th className="py-3 px-4 border-r border-slate-200 font-bold">Date</th>
              <th className="py-3 px-4 border-r border-slate-200 font-bold">Status</th>
              <th className="py-3 px-4 border-r border-slate-200 font-bold">Amount</th>
              <th className="py-3 px-4 font-bold text-center">Actions</th>
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
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">MEM-{record.memberId}</td>
                  <td className="py-3.5 px-4 font-bold text-[#102a43]">{record.user}</td>
                  <td className="py-3.5 px-4 font-bold text-teal-700">₹{record.memberFee}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{record.category}</td>
                  <td className="py-3.5 px-4 text-slate-600">{record.date}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                        record.paymentStatus === "Complete"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{record.amount}</td>
                  <td className="py-3.5 px-4 text-center">
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
                <td colSpan="8" className="py-10 text-center text-slate-400 font-medium">
                  {loadingRecords ? "Loading member records..." : recordsError || "No member records found."}
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
                <span className="text-slate-500">Member Fee:</span>
                <span className="font-bold text-teal-700">₹{selectedMember.memberFee}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-900">{selectedMember.amount}</span>
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