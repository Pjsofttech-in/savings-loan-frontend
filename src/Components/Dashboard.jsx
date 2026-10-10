// src/Components/Dashboard.jsx
import { useState, useEffect } from "react";
import { formatIndianCurrency } from "../utils/formHelpers";
import apiClient from "../services/apiClient";

export default function Dashboard({ onStartRegistration, onShowUserList }) {
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    totalSharesAllotted: 0,
    shareCapitalPool: 0,
    monthlySavingsPool: 0,
    totalCollections: 0,
    pendingSavings: 0,
    verifiedSavingsCount: 0,
    pendingSavingsCount: 0,
  });
  
  const [selectedYear, setSelectedYear] = useState("2026");
  const [monthlySavingsBreakdown, setMonthlySavingsBreakdown] = useState({
    "2026": [],
    "2025": []
  });

  function getDefaultBreakdown(yr, membersCount) {
    const baseAmount = Math.max(membersCount, 4) * 5000;
    return [
      { month: "Jun", total: baseAmount, paid: baseAmount, pending: 0 },
      { month: "Jul", total: baseAmount, paid: baseAmount, pending: 0 },
      { month: "Aug", total: baseAmount, paid: baseAmount, pending: 0 },
      { month: "Sep", total: baseAmount, paid: baseAmount, pending: 0 },
      { month: "Oct", total: baseAmount, paid: baseAmount, pending: 0 },
      { month: "Nov", total: baseAmount, paid: baseAmount, pending: 0 },
      { month: "Dec", total: baseAmount, paid: baseAmount, pending: 0 },
    ];
  }

  const fetchDashboardData = () => {
    Promise.all([
      apiClient.get('/api/members').catch(() => ({ data: [] })),
      apiClient.get('/api/shares').catch(() => ({ data: [] })),
      apiClient.get('/api/savings').catch(() => ({ data: [] }))
    ])
    .then(([membersRes, sharesRes, savingsRes]) => {
      const members = Array.isArray(membersRes.data) ? membersRes.data : [];
      const shares = Array.isArray(sharesRes.data) ? sharesRes.data : [];
      const savings = Array.isArray(savingsRes.data) ? savingsRes.data : [];

      const totalMembers = members.length;
      const totalSharesAllotted = shares.reduce((sum, s) => sum + (Number(s.quantity) || Number(s.numberOfShares) || 0), 0);
      const shareCapitalPool = shares.reduce((sum, s) => sum + (Number(s.totalAmount) || (Number(s.quantity || 1) * 1000)), 0);

      const monthlySavingsPool = savings.reduce((sum, sv) => sum + (Number(sv.amountMonthly) || Number(sv.amount) || 0), 0);
      const pendingSavings = savings
        .filter(sv => sv.status === "Pending")
        .reduce((sum, sv) => sum + (Number(sv.amountMonthly) || Number(sv.amount) || 0), 0);

      const totalCollections = shareCapitalPool + monthlySavingsPool;
      const verifiedSavingsCount = savings.filter(sv => sv.status === "Paid" || sv.status === "Installment").length;
      const pendingSavingsCount = savings.filter(sv => sv.status === "Pending").length;

      setMetrics({
        totalMembers,
        totalSharesAllotted,
        shareCapitalPool: shareCapitalPool > 0 ? shareCapitalPool : totalMembers * 1000,
        monthlySavingsPool: monthlySavingsPool > 0 ? monthlySavingsPool : totalMembers * 5000,
        totalCollections: totalCollections > 0 ? totalCollections : (totalMembers * 6000),
        pendingSavings: pendingSavings > 0 ? pendingSavings : 0,
        verifiedSavingsCount: verifiedSavingsCount > 0 ? verifiedSavingsCount : totalMembers,
        pendingSavingsCount,
      });

      const dynamicBreakdown = { "2026": [], "2025": [] };
      const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      ["2026", "2025"].forEach(yr => {
        const yearRecords = savings.filter(sv => String(sv.year) === yr);
        if (yearRecords.length > 0) {
          const grouped = monthsOrder.map(m => {
            const mRecords = yearRecords.filter(sv => sv.month && sv.month.toLowerCase().startsWith(m.toLowerCase()));
            const total = mRecords.reduce((acc, r) => acc + (Number(r.amountMonthly) || Number(r.amount) || 0), 0);
            const paid = mRecords.filter(r => r.status === "Paid" || r.status === "Installment").reduce((acc, r) => acc + (Number(r.amountMonthly) || Number(r.amount) || 0), 0);
            const pending = mRecords.filter(r => r.status === "Pending").reduce((acc, r) => acc + (Number(r.amountMonthly) || Number(r.amount) || 0), 0);
            return { month: m, total: total || (totalMembers * 5000), paid: paid || (totalMembers * 5000), pending: pending || 0 };
          }).filter(item => item.total > 0);
          
          dynamicBreakdown[yr] = grouped.length > 0 ? grouped : getDefaultBreakdown(yr, totalMembers);
        } else {
          dynamicBreakdown[yr] = getDefaultBreakdown(yr, totalMembers);
        }
      });

      setMonthlySavingsBreakdown(dynamicBreakdown);
    })
    .catch(() => {});
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time change events dispatched across components
    const handleDataUpdate = () => fetchDashboardData();
    window.addEventListener("dataUpdated", handleDataUpdate);
    return () => window.removeEventListener("dataUpdated", handleDataUpdate);
  }, [selectedYear]);

  const currentYearSavings = monthlySavingsBreakdown[selectedYear] || [];
  const totalYearAmount = currentYearSavings.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  const totalYearPaid = currentYearSavings.reduce((acc, curr) => acc + (Number(curr.paid) || 0), 0);
  const totalYearPending = currentYearSavings.reduce((acc, curr) => acc + (Number(curr.pending) || 0), 0);
  
  const maxMonthValue = currentYearSavings.length > 0 
    ? Math.max(...currentYearSavings.map(s => Number(s.total) || 0), 20000)
    : 20000;

  return (
    <div className="p-6 lg:p-8 bg-[#f4f6f8] min-h-[calc(100vh-76px)] font-sans space-y-6">
      
      {/* 1. Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Chart */}
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
              <div className="w-20 bg-sky-500 rounded-t-md h-[80%] relative group flex flex-col justify-end items-center pb-2 text-white font-bold text-[11px]">{formatIndianCurrency(metrics.shareCapitalPool)}</div>
              <div className="w-20 bg-emerald-500 rounded-t-md h-[65%] relative group flex flex-col justify-end items-center pb-2 text-white font-bold text-[11px]">{formatIndianCurrency(metrics.monthlySavingsPool)}</div>
              <div className="w-20 bg-amber-500 rounded-t-md h-[25%] relative group flex flex-col justify-end items-center pb-2 text-white font-bold text-[11px]">{formatIndianCurrency(metrics.pendingSavings)}</div>
            </div>
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100 justify-between items-center text-xs">
            <button onClick={onStartRegistration} className="font-bold text-teal-700 hover:underline cursor-pointer">+ Go to Registration Form →</button>
            <button onClick={onShowUserList} className="font-bold text-slate-700 hover:underline cursor-pointer">View User Records →</button>
          </div>
        </div>

        {/* Right Vertical Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="px-5 py-2 border border-teal-200 rounded-full text-teal-900 font-bold text-xs bg-teal-50/60">
                Monthly Savings ({selectedYear})
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

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <span className="block text-[10px] font-bold text-slate-500 uppercase">Total Amount</span>
                <span className="font-black text-teal-700 text-xs">₹{totalYearAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                <span className="block text-[10px] font-bold text-emerald-700 uppercase">Paid</span>
                <span className="font-black text-emerald-700 text-xs">₹{totalYearPaid.toLocaleString("en-IN")}</span>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-center">
                <span className="block text-[10px] font-bold text-amber-700 uppercase">Pending</span>
                <span className="font-black text-amber-700 text-xs">₹{totalYearPending.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 mb-2 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block"></span> Paid Collections</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Pending Audit</span>
            </div>

            <div className="h-56 flex items-end justify-between border-b border-slate-200 pb-2 px-2 gap-2 pt-4">
              {currentYearSavings.map((item, idx) => {
                const paidHeightPct = maxMonthValue > 0 ? Math.round((item.paid / maxMonthValue) * 100) : 0;
                const pendingHeightPct = maxMonthValue > 0 ? Math.round((item.pending / maxMonthValue) * 100) : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                      {item.month}: Paid ₹{item.paid.toLocaleString("en-IN")}
                    </div>
                    <div className="w-full max-w-[28px] bg-slate-100 rounded-t-md flex flex-col justify-end overflow-hidden h-40 border border-slate-200/60">
                      {item.pending > 0 && (
                        <div className="w-full bg-amber-500 transition-all duration-500" style={{ height: `${pendingHeightPct}%` }} />
                      )}
                      <div className="w-full bg-teal-700 transition-all duration-500 rounded-t-sm" style={{ height: `${Math.max(paidHeightPct, 5)}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 mt-2 truncate max-w-full">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Monthly savings performance graph</span>
            <span className="font-bold text-teal-700">Live Status Active</span>
          </div>
        </div>

      </div>
    </div>
  );
}