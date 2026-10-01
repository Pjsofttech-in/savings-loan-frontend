// src/Pages/registration/List.jsx
import { useState } from "react";
import NotificationModal from "../../Components/NotificationModel";

export default function List() {
  const [selectedMember, setSelectedMember] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState("All");
  const [filterTimeframe, setFilterTimeframe] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("All");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");
  const [filterUser, setFilterUser] = useState("All");
  const [filterMessageType, setFilterMessageType] = useState("All");

  // Sample transaction/member records
  const [records] = useState([
    {
      id: 1,
      user: "Vivek Arun Deore",
      type: "Income",
      category: "Share Capital & Loan",
      date: "2026-09-24",
      dueDate: "2026-10-15",
      paymentMethod: "UPI",
      transactionId: "UPI/2026/839201",
      paymentStatus: "Pending",
      totalLoanAmount: "₹50,000",
      amountPaid: "₹35,000",
      pendingAmount: "₹15,000",
      amount: "₹10,000",
    },
    {
      id: 2,
      user: "Aarav Sharma",
      type: "Income",
      category: "Monthly Saving",
      date: "2026-09-20",
      dueDate: "-",
      paymentMethod: "Bank Transfer",
      transactionId: "TXN9382019283",
      paymentStatus: "Complete",
      totalLoanAmount: "₹20,000",
      amountPaid: "₹20,000",
      pendingAmount: "₹0",
      amount: "₹1,000",
    },
    {
      id: 3,
      user: "Priya Patil",
      type: "Expense",
      category: "Loan Disbursement",
      date: "2026-09-15",
      dueDate: "2026-11-01",
      paymentMethod: "Cash",
      transactionId: "",
      paymentStatus: "Pending",
      totalLoanAmount: "₹1,00,000",
      amountPaid: "₹40,000",
      pendingAmount: "₹60,000",
      amount: "₹5,000",
    },
    {
      id: 4,
      user: "Rohan Deshmukh",
      type: "Income",
      category: "Registration Fee",
      date: "2026-09-10",
      dueDate: "2026-09-25",
      paymentMethod: "Cheque",
      transactionId: "CHQ-004829",
      paymentStatus: "Refunded",
      totalLoanAmount: "₹10,000",
      amountPaid: "₹10,000",
      pendingAmount: "₹0",
      amount: "₹500",
    },
  ]);

  // Filter logic
  const filteredRecords = records.filter((item) => {
    if (filterType !== "All" && item.type !== filterType) return false;
    if (filterPaymentStatus !== "All" && item.paymentStatus !== filterPaymentStatus) return false;
    if (filterPaymentMethod !== "All" && item.paymentMethod !== filterPaymentMethod) return false;
    if (filterCategory !== "All" && !item.category.includes(filterCategory)) return false;
    if (filterUser !== "All" && !item.user.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-[#102a43] text-xl font-bold m-0">Transaction &amp; Member List</h2>
        <p className="text-slate-500 text-xs mt-1">Manage payments, tracking status, due dates, and click any row to inspect member financial ledgers.</p>
      </div>

      {/* Filter Control Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="All">Type (Income/Expense)</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>

        <select
          value={filterTimeframe}
          onChange={(e) => setFilterTimeframe(e.target.value)}
          className="p-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="All">Timeframe</option>
          <option value="Today">Today</option>
          <option value="7D">Last 7 Days</option>
          <option value="30D">Last 30 Days</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="All">Category</option>
          <option value="Share Capital">Share Capital</option>
          <option value="Monthly Saving">Monthly Saving</option>
          <option value="Loan Disbursement">Loan Disbursement</option>
          <option value="Registration Fee">Registration Fee</option>
        </select>

        <select
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value)}
          className="p-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="All">Payment Method</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cheque">Cheque</option>
        </select>

        <select
          value={filterPaymentStatus}
          onChange={(e) => setFilterPaymentStatus(e.target.value)}
          className="p-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="All">Payment Status</option>
          <option value="Complete">Complete</option>
          <option value="Pending">Pending</option>
          <option value="Refunded">Refunded</option>
        </select>

        <input
          type="text"
          placeholder="Filter by User Name..."
          value={filterUser === "All" ? "" : filterUser}
          onChange={(e) => setFilterUser(e.target.value || "All")}
          className="p-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
        />

        <select
          value={filterMessageType}
          onChange={(e) => setFilterMessageType(e.target.value)}
          className="p-2 border border-slate-300 rounded-md bg-white text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="All">Message Type</option>
          <option value="SMS">SMS</option>
          <option value="Email">Email</option>
        </select>

      </div>

      {/* Reference-Style Summary Pill Badges positioned BELOW the filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 overflow-x-auto pb-2">
        <div className="bg-[#0284c7] text-white px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-2 whitespace-nowrap">
          <span>Total GST:</span>
          <span>₹1,350</span>
        </div>
        <div className="bg-[#9333ea] text-white px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-2 whitespace-nowrap">
          <span>Total TDS:</span>
          <span>₹0</span>
        </div>
        <div className="bg-[#22c55e] text-white px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-2 whitespace-nowrap">
          <span>Paid:</span>
          <span>₹76,001</span>
        </div>
        <div className="bg-[#f97316] text-white px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-2 whitespace-nowrap">
          <span>Pending:</span>
          <span>₹75,000</span>
        </div>
        <div className="bg-[#16a34a] text-white px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-2 whitespace-nowrap">
          <span>Expense Refund:</span>
          <span>₹0</span>
        </div>
        <div className="bg-[#22c55e] text-white px-5 py-2.5 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-2 whitespace-nowrap">
          <span>Total Income:</span>
          <span>₹76,001</span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-3">User</th>
              <th className="p-3">Type &amp; Category</th>
              <th className="p-3">Date</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Payment Method</th>
              <th className="p-3">Transaction ID</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr 
                  key={record.id} 
                  onClick={() => setSelectedMember(record)}
                  className="hover:bg-teal-50/50 cursor-pointer transition"
                >
                  <td className="p-3 font-bold text-slate-900">{record.user}</td>
                  <td className="p-3 text-slate-600">
                    <span className="font-semibold text-slate-800">{record.type}</span> / {record.category}
                  </td>
                  <td className="p-3 text-slate-600">{record.date}</td>
                  <td className="p-3 text-slate-600">
                    {record.paymentStatus === "Pending" && record.dueDate && record.dueDate !== "-" ? (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {record.dueDate}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-slate-700">{record.paymentMethod}</td>
                  <td className="p-3 text-slate-600 font-mono text-[11px]">
                    {record.paymentMethod !== "Cash" ? record.transactionId || "N/A" : <span className="text-slate-400 italic">Not Applicable (Cash)</span>}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        record.paymentStatus === "Complete"
                          ? "bg-emerald-100 text-emerald-800"
                          : record.paymentStatus === "Pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {record.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">{record.amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-6 text-center text-slate-400">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Member Financial Ledger Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 mb-6">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Member Financial Ledger</span>
                <h3 className="text-xl font-black text-[#102a43] mt-1 m-0">{selectedMember.user}</h3>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold grid place-items-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Financial Summary Cards inside Modal */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-slate-500 text-[11px] block font-semibold uppercase">Total Sanctioned</span>
                <strong className="text-slate-900 text-base font-extrabold mt-1 block">{selectedMember.totalLoanAmount}</strong>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-emerald-800 text-[11px] block font-semibold uppercase">Amount Paid</span>
                <strong className="text-emerald-700 text-base font-extrabold mt-1 block">{selectedMember.amountPaid}</strong>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="text-rose-800 text-[11px] block font-semibold uppercase">Pending Due</span>
                <strong className="text-rose-600 text-base font-extrabold mt-1 block">{selectedMember.pendingAmount}</strong>
              </div>
            </div>

            {/* Detailed Transaction & Due Info */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-bold text-slate-800 uppercase">{selectedMember.paymentStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-bold text-amber-700">{selectedMember.dueDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-800">{selectedMember.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-800">{selectedMember.transactionId || "N/A (Cash)"}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                💬 Send WhatsApp/SMS
              </button>

              <button
                onClick={() => setSelectedMember(null)}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Close Ledger
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Notification Dispatch Modal */}
      {showNotificationModal && selectedMember && (
        <NotificationModal
          record={selectedMember}
          onClose={() => setShowNotificationModal(false)}
        />
      )}

    </div>
  );
}
