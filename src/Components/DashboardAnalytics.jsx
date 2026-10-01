// src/Components/DashboardAnalytics.jsx
import { useState } from "react";

export default function DashboardAnalytics() {
  const [activeTab, setActiveTab] = useState("growth");

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm font-sans my-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-black text-teal-700 uppercase tracking-wider">Financial Intelligence</span>
          <h3 className="text-xl font-black text-[#102a43] m-0 font-serif">Portfolio &amp; Capital Analytics</h3>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("growth")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "growth" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Savings vs Loans
          </button>
          <button
            onClick={() => setActiveTab("shares")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === "shares" ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Share Categories
          </button>
        </div>
      </div>

      {activeTab === "growth" ? (
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
                <span className="text-slate-500">Savings: ₹{bar.k || bar.savings}k | Loans: ₹{bar.loans}k</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-200">
                <div 
                  className="bg-emerald-500 rounded-full h-full transition-all duration-500" 
                  style={{ width: `${bar.savings}%` }}
                  title={`Savings: ₹${bar.savings}k`}
                />
                <div 
                  className="bg-amber-500 rounded-full h-full transition-all duration-500" 
                  style={{ width: `${bar.loans}%` }}
                  title={`Loans: ₹${bar.loans}k`}
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
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 mb-4">Distribution of total share capital pool across membership classes.</p>
          
          <div className="space-y-3 text-xs font-bold">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>Ordinary Shares (60%)</span>
                <span>₹60,000</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "60%" }}></div>
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