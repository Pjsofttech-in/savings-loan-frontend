// src/Pages/registration/List.jsx
import { useState, useEffect } from "react";
import NotificationModal from "../Components/NotificationModel";
import { fetchMembers } from "../services/memberService";
import { fetchShareAllocations } from "../services/shareService";
import { formatIndianCurrency } from "../utils/formHelpers";

export default function List() {
  const [records, setRecords] = useState([]);
  // Starts as true, so the effect never needs to set it before fetching
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");

  useEffect(() => {
    let cancelled = false;

    // All setState calls happen inside promise callbacks (asynchronously),
    // so nothing is set synchronously in the effect body.
    const loadData = () => {
      Promise.all([
        fetchMembers().catch(() => []),
        fetchShareAllocations().catch(() => []),
      ])
        .then(([memberRecords, shareRecords]) => {
          if (cancelled) return;

          const sharesByMemberId = new Map();
          shareRecords.forEach((share) => {
            sharesByMemberId.set(String(share.memberId), share);
          });

          const combinedRecords = memberRecords.map((member) => {
            const share = sharesByMemberId.get(String(member.id)) || {};
            const amount =
              Number(share.paymentAmount) || Number(member.registrationFee) || 500;
            const status = share.paymentStatus || "Complete";

            return {
              id: member.id,
              user: member.fullName || "Member",
              memberId: member.id || "-",
              memberFee: member.registrationFee || 500,
              category: share.shareType || "Standard Member",
              date: member.applicationDate || share.applicationDate || "-",
              paymentMethod: share.paymentMethod || "Cash",
              paymentStatus: status,
              amount: formatIndianCurrency(amount),
            };
          });

          setRecords(combinedRecords);
          setRecordsError("");
        })
        .catch((error) => {
          if (!cancelled) setRecordsError(error.message);
        })
        .finally(() => {
          if (!cancelled) setLoadingRecords(false);
        });
    };

    loadData();
    window.addEventListener("dataUpdated", loadData);

    return () => {
      cancelled = true;
      window.removeEventListener("dataUpdated", loadData);
    };
  }, []);

  const filteredRecords = records.filter((item) => {
    if (filterPaymentStatus !== "All" && item.paymentStatus !== filterPaymentStatus) return false;
    if (
      searchQuery.trim() &&
      !item.user.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !String(item.memberId).toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPaid = records
    .filter((record) => record.paymentStatus === "Complete")
    .reduce((total, record) => total + (Number(record.amount.replace(/[₹,]/g, "")) || 0), 0);
  const totalPending = records
    .filter((record) => record.paymentStatus === "Pending")
    .reduce((total, record) => total + (Number(record.amount.replace(/[₹,]/g, "")) || 0), 0);

  return (
    <div className="p-4 max-w-[1300px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans text-xs">
      <div className="mb-4 pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[#102a43] text-base font-bold m-0">Member &amp; Transaction List</h2>
          <p className="text-slate-500 text-[11px] mt-0.5">Review all registered members and fee details. Click a row for ledger details.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 px-3 border border-slate-300 rounded-md bg-white text-xs text-slate-700 outline-none focus:border-teal-600"
          />
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="h-8 px-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Complete">Complete</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="bg-[#22c55e] text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1.5">
          <span>Paid:</span>
          <span>{formatIndianCurrency(totalPaid)}</span>
        </div>
        <div className="bg-[#f97316] text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1.5">
          <span>Pending:</span>
          <span>{formatIndianCurrency(totalPending)}</span>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-blue-600 text-white font-bold border-b border-blue-500 text-center">
              <th className="p-2 border-r border-blue-500">Member ID</th>
              <th className="p-2 border-r border-blue-500">User Name</th>
              <th className="p-2 border-r border-blue-500">Member Fee</th>
              <th className="p-2 border-r border-blue-500">Category</th>
              <th className="p-2 border-r border-blue-500">Date</th>
              <th className="p-2 border-r border-blue-500">Payment Method</th>
              <th className="p-2 border-r border-blue-500">Status</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-center">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedMember(record)}
                  className={`hover:bg-teal-50/50 cursor-pointer transition ${index % 2 === 0 ? "bg-slate-50/40" : "bg-white"}`}
                >
                  <td className="p-2 font-mono font-semibold text-slate-700">MEM-{record.memberId}</td>
                  <td className="p-2 font-bold text-slate-900">{record.user}</td>
                  <td className="p-2 font-bold text-teal-700">₹{record.memberFee}</td>
                  <td className="p-2 text-slate-600">{record.category}</td>
                  <td className="p-2 text-slate-600">{record.date}</td>
                  <td className="p-2 font-medium text-slate-700">{record.paymentMethod}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                        record.paymentStatus === "Complete"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="p-2 text-right font-bold text-slate-900">{record.amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-6 text-center text-slate-400">
                  {loadingRecords ? "Loading members..." : recordsError || "No members match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
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
                <span className="text-slate-500">Member Fee:</span>
                <span className="font-bold text-teal-700">₹{selectedMember.memberFee}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedMember.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-900">{selectedMember.amount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg text-xs transition cursor-pointer"
              >
                💬 Send Notification
              </button>
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

      {showNotificationModal && selectedMember && (
        <NotificationModal
          record={selectedMember}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </div>
  );
}
