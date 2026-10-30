// src/Components/DashboardAnalytics.jsx
import { useState } from "react";

export default function DashboardAnalytics() {
  const [activeTab, setActiveTab] = useState("savings-analytics");
  const [selectedYear, setSelectedYear] = useState("2026");

  // Mock analytical data for monthly savings breakdown (Total, Paid, Pending)
  const savingsDataByYear = {
    "2026": [
      { month: "June", total: 50000, paid: 45000, pending: 5000, paidPercent: 90 },
      { month: "July", total: 65000, paid: 60000, pending: 5000, paidPercent: 92 },
      { month: "August", total: 90000, paid: 80000, pending: 10000, paidPercent: 88 },
      { month: "September", total: 120000, paid: 110000, pending: 10000, paidPercent: 91 },
      { month: "October", total: 135000, paid: 125000, pending: 10000, paidPercent: 92 },
    ],
    "2025": [
      { month: "June", total: 30000, paid: 30000, pending: 0, paidPercent: 100 },
      { month: "July", total: 35000, paid: 32000, pending: 3000, paidPercent: 91 },
      { month: "August", total: 40000, paid: 38000, pending: 2000, paidPercent: 95 },
      { month: "September", total: 45000, paid: 42000, pending: 3000, paidPercent: 93 },
      { month: "October", total: 50000, paid: 47000, pending: 3000, paidPercent: 94 },
    ]
  };

  const currentData = savingsDataByYear[selectedYear] || [];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm font-sans my-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-black text-teal-700 uppercase tracking-wider">Financial Intelligence</span>
          <h3 className="text-xl font-black text-[#102a43] m-0">Portfolio &amp; Capital Analytics</h3>
        </div>
        
        {/* Navigation Tabs & Year Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs bg-white text-slate-800 font-bold focus:outline-none focus:border-teal-700"
          >
            <option value="2026">Year: 2026</option>
            <option value="2025">Year: 2025</option>
          </select>

          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("savings-analytics")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "savings-analytics" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Savings
            </button>
            <button
              onClick={() => setActiveTab("growth")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "growth" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Savings vs Loans
            </button>
            <button
              onClick={() => setActiveTab("shares")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === "shares" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Share Categories
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Monthly Savings (Total, Paid, Pending by Month & Year) */}
      {activeTab === "savings-analytics" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-xs text-slate-500 m-0">
              Monthly breakdown of Total Target vs. Paid Collections and Pending Audits for <strong className="text-teal-700">{selectedYear}</strong>.
            </p>
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block"></span> Paid Collections</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Pending Audit</span>
            </div>
          </div>

          <div className="space-y-4">
            {currentData.map((item, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{item.month} {selectedYear}</span>
                  <div className="flex gap-4 text-[11px]">
                    <span className="text-teal-700">Paid: ₹{item.paid.toLocaleString("en-IN")}</span>
                    <span className="text-amber-600">Pending: ₹{item.pending.toLocaleString("en-IN")}</span>
                    <span className="text-slate-400">| Total: ₹{item.total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Segmented Progress Bar */}
                <div className="h-3.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                  <div 
                    className="bg-teal-700 rounded-l-full h-full transition-all duration-500" 
                    style={{ width: `${item.paidPercent}%` }}
                    title={`Paid: ₹${item.paid}`}
                  />
                  <div 
                    className="bg-amber-500 rounded-r-full h-full transition-all duration-500" 
                    style={{ width: `${100 - item.paidPercent}%` }}
                    title={`Pending: ₹${item.pending}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Savings vs Loans */}
      {activeTab === "growth" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-4">Monthly comparison of member monthly savings collections versus active loan disbursements (in ₹ Thousands).</p>
          
          {[
            { month: "June", savings: 45, loans: 30 },
            { month: "July", savings: 60, loans: 50 },
            { month: "August", savings: 85, loans: 70 },
            { month: "September", savings: 110, loans: 95 },
          ].map((bar, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>{bar.month} 2026</span>
                <span className="text-slate-500">Savings: ₹{bar.savings}k | Loans: ₹{bar.loans}k</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-200">
                <div 
                  className="bg-emerald-500 rounded-full h-full transition-all duration-500" 
                  style={{ width: `${bar.savings}%` }}
                />
                <div 
                  className="bg-amber-500 rounded-full h-full transition-all duration-500" 
                  style={{ width: `${bar.loans}%` }}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center gap-6 pt-4 mt-4 border-t border-slate-200 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span> Savings Pool
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full inline-block"></span> Loan Disbursements
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Share Categories */}
      {activeTab === "shares" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-4">Distribution of total share capital pool across membership classes.</p>
          
          <div className="space-y-3 text-xs font-bold">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Ordinary Shares (60%)</span>
                <span>₹60,000</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-teal-700 h-full rounded-full" style={{ width: "60%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Preference Shares (25%)</span>
                <span>₹25,000</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: "25%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Founder Shares (15%)</span>
                <span>₹15,000</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-teal-600 h-full rounded-full" style={{ width: "15%" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
