// src/Pages/savings/MonthlySavingList.jsx
import { useState } from "react";

export default function MonthlySavingList({ onStartSaving }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("All Months");

  const [savings] = useState([
    { id: "SAV-501293", memberId: "MEM-1001", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 5000, status: "Verified" },
    { id: "SAV-501294", memberId: "MEM-1004", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 3500, status: "Verified" },
    { id: "SAV-501295", memberId: "MEM-1008", noOfMembers: 4, year: "2026", month: "September", amountMonthly: 20000, status: "Verified" },
    { id: "SAV-501296", memberId: "MEM-1012", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 5000, status: "Pending" },
    { id: "SAV-501297", memberId: "MEM-1015", noOfMembers: 2, year: "2026", month: "August", amountMonthly: 10000, status: "Verified" },
  ]);

  const filteredSavings = savings.filter((item) => {
    const matchesSearch = item.memberId.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = monthFilter === "All Months" || item.month === monthFilter;
    return matchesSearch && matchesMonth;
  });

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Savings Records Directory</span>
          <h1 className="text-2xl font-extrabold text-[#102a43] m-0">Monthly Saving Table</h1>
          <p className="text-xs text-slate-500 mt-1 m-0">Detailed searchable ledger of all registered monthly member savings.</p>
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

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by ID or Member ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs w-full sm:w-80 focus:outline-none focus:border-teal-700 bg-white text-slate-800"
          />
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-700"
          >
            <option>All Months</option>
            <option>January</option>
            <option>February</option>
            <option>March</option>
            <option>April</option>
            <option>May</option>
            <option>June</option>
            <option>July</option>
            <option>August</option>
            <option>September</option>
            <option>October</option>
            <option>November</option>
            <option>December</option>
          </select>
        </div>
        <span className="text-xs font-bold text-slate-500">Total Records: {filteredSavings.length}</span>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-teal-700 text-white font-bold uppercase tracking-wider">
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Member ID</th>
                <th className="p-3.5">No. of Members</th>
                <th className="p-3.5">Year</th>
                <th className="p-3.5">Month</th>
                <th className="p-3.5">Amount Monthly (₹)</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredSavings.length > 0 ? (
                filteredSavings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-teal-800">{item.id}</td>
                    <td className="p-3.5 text-slate-500">{item.memberId}</td>
                    <td className="p-3.5 font-semibold text-[#102a43]">{item.noOfMembers}</td>
                    <td className="p-3.5 text-slate-600">{item.year}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{item.month}</td>
                    <td className="p-3.5 font-bold text-teal-700">₹{item.amountMonthly.toLocaleString("en-IN")}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "Verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">No monthly saving records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}