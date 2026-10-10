// src/Pages/registration/List.jsx
import { useEffect, useState } from "react";
import NotificationModal from "../../Components/NotificationModel";
import { fetchMembers } from "../../services/memberService";
import { fetchShareAllocations } from "../../services/shareService";
import { formatIndianCurrency } from "../../utils/formHelpers";

export default function List() {
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Streamlined search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");

  useEffect(() => {
    Promise.all([fetchMembers(), fetchShareAllocations()])
      .then(([memberRecords, shareRecords]) => {
        setMembers(memberRecords);
        const membersById = new Map(memberRecords.map((member) => [member.id, member]));
        setRecords(shareRecords.map((share) => {
          const member = membersById.get(share.memberId);
          const amount = Number(share.paymentAmount) || 0;
          const paid = share.paymentStatus === "Complete" ? amount : 0;
          const pending = share.paymentStatus === "Pending" ? amount : 0;
          return {
            id: share.id,
            user: share.memberName || member?.fullName || "Member",
            memberId: share.memberId || member?.id || "-",
            memberFee: member?.registrationFee || member?.memberFee || 500,
            type: "Income",
            category: "Share Capital",
            date: share.applicationDate || "-",
            dueDate: share.dueDate || "-",
            paymentMethod: share.paymentMethod || "Cash",
            transactionId: share.referenceNumber || "",
            paymentStatus: share.paymentStatus || "Pending",
            totalLoanAmount: formatIndianCurrency(amount),
            amountPaid: formatIndianCurrency(paid),
            pendingAmount: formatIndianCurrency(pending),
            amount: formatIndianCurrency(amount),
          };
        }));
      })
      .catch((error) => setRecordsError(error.message))
      .finally(() => setLoadingRecords(false));
  }, []);

  const memberIdsByName = new Map(
    members.map((member) => [member.fullName?.trim().toLocaleLowerCase(), member.id]),
  );
  const getMemberId = (name) => memberIdsByName.get(name.trim().toLocaleLowerCase()) || "-";

  // Filter logic
  const filteredRecords = records.filter((item) => {
    if (filterPaymentStatus !== "All" && item.paymentStatus !== filterPaymentStatus) return false;
    if (searchQuery.trim() && !item.user.toLowerCase().includes(searchQuery.toLowerCase()) && !String(item.memberId).toLowerCase().includes(searchQuery.toLowerCase())) {
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
          <p className="text-slate-500 text-[11px] mt-0.5">Review member share transactions and fee details. Click a row for ledger details.</p>
        </div>

        {/* Clean Search Input & Status Filter */}
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

      {/* Summary Pills */}
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

      {/* Main Data Table */}
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
                  <td className="p-2 font-mono font-semibold text-slate-700">{getMemberId(record.user)}</td>
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
                  {loadingRecords ? "Loading transactions..." : recordsError || "No members match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Member Financial Ledger Modal */}
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
                <span className="font-mono font-bold text-slate-800">{getMemberId(selectedMember.user)}</span>
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