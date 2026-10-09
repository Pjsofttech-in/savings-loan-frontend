// src/Components/Dashboard.jsx
import { useState, useEffect } from "react";
import { formatIndianCurrency } from "../utils/formHelpers";
import apiClient from "../services/apiClient";

export default function Dashboard({ onStartRegistration, onShowUserList }) {
  const [metrics, setMetrics] = useState({
    totalMembers: 4,
    totalSharesAllotted: 35,
    shareCapitalPool: 35000,
    monthlySavingsPool: 20000,
    totalCollections: 55000,
    pendingSavings: 5000,
    verifiedSavingsCount: 4,
    pendingSavingsCount: 1,
  });
  const [selectedYear, setSelectedYear] = useState("2026");

  // Detailed monthly savings breakdown for the graph
  const monthlySavingsBreakdown = {
    "2026": [
      { month: "June", total: 15000, paid: 12000, pending: 3000 },
      { month: "July", total: 18000, paid: 15000, pending: 3000 },
      { month: "August", total: 22000, paid: 20000, pending: 2000 },
      { month: "September", total: 25000, paid: 22000, pending: 3000 },
      { month: "October", total: 28000, paid: 25000, pending: 3000 },
    ],
    "2025": [
      { month: "June", total: 10000, paid: 10000, pending: 0 },
      { month: "July", total: 12000, paid: 11000, pending: 1000 },
      { month: "August", total: 14000, paid: 13000, pending: 1000 },
      { month: "September", total: 15000, paid: 14000, pending: 1000 },
      { month: "October", total: 16000, paid: 15000, pending: 1000 },
    ]
  };

  const currentYearSavings = monthlySavingsBreakdown[selectedYear] || [];

  // Fetch live aggregated data from your backend
  useEffect(() => {
    Promise.all([
      apiClient.get('/api/members')
        .then(res => res.data)
        .catch(() => []),
      apiClient.get('/api/shares')
        .then(res => res.data)
        .catch(() => [])
    ])
    .then(([membersData, sharesData]) => {
      const members = Array.isArray(membersData) ? membersData : [];
      const shares = Array.isArray(sharesData) ? sharesData : [];

      const totalMembers = members.length || 4;
      const totalSharesAllotted = shares.reduce((sum, s) => sum + (Number(s.numberOfShares) || 1), 35);
      const shareCapitalPool = totalSharesAllotted * 1000; 
      const monthlySavingsPool = totalMembers * 5000; 
      const totalCollections = shareCapitalPool + monthlySavingsPool;

      setMetrics({
        totalMembers,
        totalSharesAllotted,
        shareCapitalPool,
        monthlySavingsPool,
        totalCollections,
        pendingSavings: 5000,
        verifiedSavingsCount: totalMembers,
        pendingSavingsCount: 1,
      });
    })
    .catch(() => {});
  }, []);

  return (
    <div className="p-6 lg:p-8 bg-[#f4f6f8] min-h-[calc(100vh-76px)] font-sans space-y-6">
      
      {/* 1. Top 5 Pastel Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* ACTIVE MEMBERS CARD */}
        <div className="bg-[#e0f2fe] border border-[#bae6fd] rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#0369a1] text-xs font-black tracking-wider uppercase">Active Members</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#0369a1] font-black text-xs shadow-sm">👥</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#0284c7]"><span>Total Enrolled</span><span className="font-bold">{metrics.totalMembers}</span></div>
            <div className="flex justify-between text-[#0284c7]"><span>Verified Units</span><span className="font-bold">{metrics.verifiedSavingsCount}</span></div>
            <div className="flex justify-between text-[#0284c7]"><span>Pending Audit</span><span className="font-bold">{metrics.pendingSavingsCount}</span></div>
            <div className="flex justify-between text-[#0369a1] pt-2.5 border-t border-[#bae6fd] font-black text-sm">
              <span>Status</span><span>Active</span>
            </div>
          </div>
        </div>

        {/* SHARE CAPITAL POOL CARD */}
        <div className="bg-[#ffedd5] border border-[#fed7aa] rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#c2410c] text-xs font-black tracking-wider uppercase">Share Capital Pool</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#c2410c] font-black text-xs shadow-sm">📊</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#ea580c]"><span>Units Allotted</span><span className="font-bold">{metrics.totalSharesAllotted}</span></div>
            <div className="flex justify-between text-[#ea580c]"><span>Face Value</span><span className="font-bold">₹1,000</span></div>
            <div className="flex justify-between text-[#ea580c]"><span>Capital Value</span><span className="font-bold">{formatIndianCurrency(metrics.shareCapitalPool)}</span></div>
            <div className="flex justify-between text-[#c2410c] pt-2.5 border-t border-[#fed7aa] font-black text-sm">
              <span>Total</span><span>{formatIndianCurrency(metrics.shareCapitalPool)}</span>
            </div>
          </div>
        </div>

        {/* MONTHLY SAVINGS CARD */}
        <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#15803d] text-xs font-black tracking-wider uppercase">Monthly Savings</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#15803d] font-black text-xs shadow-sm">🏛️</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#16a34a]"><span>Monthly Target</span><span className="font-bold">{formatIndianCurrency(metrics.monthlySavingsPool)}</span></div>
            <div className="flex justify-between text-[#16a34a]"><span>Verified Pool</span><span className="font-bold">{formatIndianCurrency(metrics.monthlySavingsPool - metrics.pendingSavings)}</span></div>
            <div className="flex justify-between text-[#16a34a]"><span>Growth Rate</span><span className="font-bold">+12%</span></div>
            <div className="flex justify-between text-[#15803d] pt-2.5 border-t border-[#bbf7d0] font-black text-sm">
              <span>Total Pool</span><span>{formatIndianCurrency(metrics.monthlySavingsPool)}</span>
            </div>
          </div>
        </div>

        {/* TOTAL PORTFOLIO VALUE CARD */}
        <div className="bg-[#f3e8ff] border border-[#e9d5ff] rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#7e22ce] text-xs font-black tracking-wider uppercase">Total Portfolio</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#7e22ce] font-black text-xs shadow-sm">💰</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#9333ea]"><span>Share Capital</span><span className="font-bold">{formatIndianCurrency(metrics.shareCapitalPool)}</span></div>
            <div className="flex justify-between text-[#9333ea]"><span>Savings Pool</span><span className="font-bold">{formatIndianCurrency(metrics.monthlySavingsPool)}</span></div>
            <div className="flex justify-between text-[#9333ea]"><span>Combined</span><span className="font-bold">{formatIndianCurrency(metrics.totalCollections)}</span></div>
            <div className="flex justify-between text-[#7e22ce] pt-2.5 border-t border-[#e9d5ff] font-black text-sm">
              <span>Total</span><span>{formatIndianCurrency(metrics.totalCollections)}</span>
            </div>
          </div>
        </div>

        {/* PENDING DUES CARD */}
        <div className="bg-[#ccfbf1] border border-[#99f6e4] rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#0f766e] text-xs font-black tracking-wider uppercase">Pending Dues</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#0f766e] font-black text-xs shadow-sm">⏳</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#0d9488]"><span>Pending Units</span><span className="font-bold">{metrics.pendingSavingsCount} Member</span></div>
            <div className="flex justify-between text-[#0d9488]"><span>Audit Required</span><span className="font-bold">Verification</span></div>
            <div className="flex justify-between text-[#0d9488]"><span>Dues Amount</span><span className="font-bold">{formatIndianCurrency(metrics.pendingSavings)}</span></div>
            <div className="flex justify-between text-[#0f766e] pt-2.5 border-t border-[#99f6e4] font-black text-sm">
              <span>Total</span><span>{formatIndianCurrency(metrics.pendingSavings)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Chart: Capital & Savings Comparison Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-center mb-6">
              <span className="px-6 py-2 border border-sky-200 rounded-full text-sky-900 font-bold text-xs bg-sky-50/50">
                Capital Pool &amp; Monthly Savings Comparison
              </span>
            </div>

            <div className="flex justify-center items-center gap-6 my-2 text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Share Capital</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Monthly Savings</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Pending Dues</span>
            </div>

            <div className="h-64 flex items-end justify-around border-b border-slate-200 pb-2 px-4 gap-6 pt-6">
              <div className="w-20 bg-sky-500 rounded-t-md h-[80%] relative group flex flex-col justify-end items-center pb-2 text-white font-bold text-[11px]">₹35k</div>
              <div className="w-20 bg-emerald-500 rounded-t-md h-[65%] relative group flex flex-col justify-end items-center pb-2 text-white font-bold text-[11px]">₹20k</div>
              <div className="w-20 bg-amber-500 rounded-t-md h-[25%] relative group flex flex-col justify-end items-center pb-2 text-white font-bold text-[11px]">₹5k</div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100 justify-between items-center text-xs">
            <button onClick={onStartRegistration} className="font-bold text-teal-700 hover:underline cursor-pointer">
              + Go to Registration Form →
            </button>
            <button onClick={onShowUserList} className="font-bold text-slate-700 hover:underline cursor-pointer">
              View User Records →
            </button>
          </div>
        </div>

        {/* Right Chart: Monthly Savings Breakdown Graph (Total, Paid, Pending by Month) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="px-5 py-2 border border-teal-200 rounded-full text-teal-900 font-bold text-xs bg-teal-50/60 mx-auto">
                Monthly Savings Breakdown ({selectedYear})
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>Year</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs outline-none font-bold text-teal-800"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 my-2 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block"></span> Paid Collections</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Pending Audit</span>
            </div>

            {/* Monthly Segmented Bars */}
            <div className="space-y-3.5 mt-4">
              {currentYearSavings.map((item, idx) => {
                const paidWidth = Math.round((item.paid / item.total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{item.month}</span>
                      <span className="text-[11px] text-slate-500">
                        Paid: <strong className="text-teal-700">₹{item.paid.toLocaleString("en-IN")}</strong> | Target: ₹{item.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-slate-200">
                      <div 
                        className="bg-teal-700 h-full rounded-l-full transition-all duration-500" 
                        style={{ width: `${paidWidth}%` }}
                        title={`Paid: ₹${item.paid}`}
                      />
                      <div 
                        className="bg-amber-500 h-full rounded-r-full transition-all duration-500" 
                        style={{ width: `${100 - paidWidth}%` }}
                        title={`Pending: ₹${item.pending}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Aggregated monthly savings cycle status</span>
            <span className="font-bold text-teal-700">Live Status Active</span>
          </div>
        </div>

      </div>

    </div>
  );
}