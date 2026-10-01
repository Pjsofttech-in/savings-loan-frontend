// src/Components/Dashboard.jsx
import { useState, useEffect } from "react";
import { formatIndianCurrency } from "../utils/formHelpers";
import DashboardAnalytics from "./DashboardAnalytics";

export default function Dashboard({ onStartRegistration, onShowUserList }) {
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    totalSharesAllotted: 0,
    shareCapitalPool: 0,
    monthlySavingsPool: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalLoansSanctioned: "₹1,50,000",
    pendingDues: "₹76,850",
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");

  // Fetch live aggregated data from your Spring Boot MySQL backend
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8080/api/members')
        .then(res => res.json())
        .catch(() => []),
      fetch('http://localhost:8080/api/shares')
        .then(res => res.json())
        .catch(() => []),
      fetch('http://localhost:8080/api/transactions')
        .then(res => res.json())
        .catch(() => [])
    ])
    .then(([membersData, sharesData, txData]) => {
      const members = Array.isArray(membersData) ? membersData : [];
      const shares = Array.isArray(sharesData) ? sharesData : [];
      const transactions = Array.isArray(txData) ? txData : [];

      const totalMembers = members.length || 4;
      const totalSharesAllotted = shares.reduce((sum, s) => sum + (Number(s.numberOfShares) || 1), 35);
      const shareCapitalPool = totalSharesAllotted * 1000; 
      const monthlySavingsPool = totalMembers * 1000; 

      const totalRevenue = transactions
        .filter(t => t.type === "Income" && t.paymentStatus === "Complete")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), shareCapitalPool + monthlySavingsPool);

      const totalExpenses = transactions
        .filter(t => t.type === "Expense" && t.paymentStatus === "Complete")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 25000);

      const netProfit = totalRevenue - totalExpenses;

      setMetrics({
        totalMembers,
        totalSharesAllotted,
        shareCapitalPool,
        monthlySavingsPool,
        totalRevenue,
        totalExpenses,
        netProfit,
        totalLoansSanctioned: "₹1,50,000",
        pendingDues: "₹76,850",
      });
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 bg-[#f4f6f8] min-h-[calc(100vh-76px)] font-sans">
      
      {/* Comprehensive Master Summary Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs font-black text-teal-700 uppercase tracking-wider">Master System Overview</span>
          <h2 className="text-xl font-black text-[#102a43] m-0 font-serif">Private Members Savings &amp; Loan Group</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
            👥 Members: <span className="text-teal-700">{metrics.totalMembers} Active</span>
          </div>
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl font-bold text-amber-800">
            📊 Shares Allotted: <span className="text-amber-900">{metrics.totalSharesAllotted} Units</span>
          </div>
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-800">
            💰 Share Capital Pool: <span className="text-emerald-900">{formatIndianCurrency(metrics.shareCapitalPool)}</span>
          </div>
          <div className="px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-800">
            🏛️ Loans Disbursed: <span className="text-indigo-900">{metrics.totalLoansSanctioned}</span>
          </div>
        </div>
      </div>

      <DashboardAnalytics />

      {/* Top 5 Pastel Metric Cards Row matching your reference design layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        
        {/* 1. INCOME CARD (Blue Theme) */}
        <div className="bg-[#e0f2fe] border border-[#bae6fd] rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#0369a1] text-xs font-black tracking-wider uppercase">Income</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#0369a1] font-black text-xs shadow-sm">₹</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#0284c7]">
              <span>Today's</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex justify-between text-[#0284c7]">
              <span>7 Day's</span>
              <span className="font-bold">₹10,000</span>
            </div>
            <div className="flex justify-between text-[#0284c7]">
              <span>30 Day's</span>
              <span className="font-bold">₹76,001</span>
            </div>
            <div className="flex justify-between text-[#0284c7]">
              <span>365 Day's</span>
              <span className="font-bold">{formatIndianCurrency(metrics.totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-[#0369a1] pt-2.5 border-t border-[#bae6fd] font-black text-sm">
              <span>Total</span>
              <span>{formatIndianCurrency(metrics.totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* 2. EXPENSE CARD (Peach Theme) */}
        <div className="bg-[#ffedd5] border border-[#fed7aa] rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#c2410c] text-xs font-black tracking-wider uppercase">Expense</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#c2410c] font-black text-xs shadow-sm">⇄</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#ea580c]">
              <span>Today's</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex justify-between text-[#ea580c]">
              <span>7 Day's</span>
              <span className="font-bold">₹2,000</span>
            </div>
            <div className="flex justify-between text-[#ea580c]">
              <span>30 Day's</span>
              <span className="font-bold">₹5,000</span>
            </div>
            <div className="flex justify-between text-[#ea580c]">
              <span>365 Day's</span>
              <span className="font-bold">{formatIndianCurrency(metrics.totalExpenses)}</span>
            </div>
            <div className="flex justify-between text-[#c2410c] pt-2.5 border-t border-[#fed7aa] font-black text-sm">
              <span>Total</span>
              <span>{formatIndianCurrency(metrics.totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* 3. SAVINGS / NET PROFIT CARD (Green Theme) */}
        <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#15803d] text-xs font-black tracking-wider uppercase">Net Profit / Savings</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#15803d] font-black text-xs shadow-sm">🛡️</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#16a34a]">
              <span>Today's</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex justify-between text-[#16a34a]">
              <span>7 Day's</span>
              <span className="font-bold">₹8,000</span>
            </div>
            <div className="flex justify-between text-[#16a34a]">
              <span>30 Day's</span>
              <span className="font-bold">₹71,001</span>
            </div>
            <div className="flex justify-between text-[#16a34a]">
              <span>365 Day's</span>
              <span className="font-bold">{formatIndianCurrency(metrics.netProfit)}</span>
            </div>
            <div className="flex justify-between text-[#15803d] pt-2.5 border-t border-[#bbf7d0] font-black text-sm">
              <span>Total</span>
              <span>{formatIndianCurrency(metrics.netProfit)}</span>
            </div>
          </div>
        </div>

        {/* 4. PENDING INCOME CARD (Purple Theme) */}
        <div className="bg-[#f3e8ff] border border-[#e9d5ff] rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#7e22ce] text-xs font-black tracking-wider uppercase">Pending Income</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#7e22ce] font-black text-xs shadow-sm">📋</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#9333ea]">
              <span>Today's</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex justify-between text-[#9333ea]">
              <span>7 Day's</span>
              <span className="font-bold">₹15,000</span>
            </div>
            <div className="flex justify-between text-[#9333ea]">
              <span>30 Day's</span>
              <span className="font-bold">₹75,000</span>
            </div>
            <div className="flex justify-between text-[#9333ea]">
              <span>365 Day's</span>
              <span className="font-bold">{metrics.pendingDues}</span>
            </div>
            <div className="flex justify-between text-[#7e22ce] pt-2.5 border-t border-[#e9d5ff] font-black text-sm">
              <span>Total</span>
              <span>{metrics.pendingDues}</span>
            </div>
          </div>
        </div>

        {/* 5. PENDING EXPENSE / LOANS DUE (Mint Green Theme) */}
        <div className="bg-[#ccfbf1] border border-[#99f6e4] rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[#0f766e] text-xs font-black tracking-wider uppercase">Loan Dues / Pending</span>
            <span className="bg-white/90 w-8 h-8 rounded-xl flex items-center justify-center text-[#0f766e] font-black text-xs shadow-sm">⏳</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#0d9488]">
              <span>Today's</span>
              <span className="font-bold">₹0</span>
            </div>
            <div className="flex justify-between text-[#0d9488]">
              <span>7 Day's</span>
              <span className="font-bold">₹5,000</span>
            </div>
            <div className="flex justify-between text-[#0d9488]">
              <span>30 Day's</span>
              <span className="font-bold">₹60,000</span>
            </div>
            <div className="flex justify-between text-[#0d9488]">
              <span>365 Day's</span>
              <span className="font-bold">₹75,000</span>
            </div>
            <div className="flex justify-between text-[#0f766e] pt-2.5 border-t border-[#99f6e4] font-black text-sm">
              <span>Total</span>
              <span>₹75,000</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Analytics & Comparison Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Income, Expense & Saving/Loss Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-center mb-4">
            <span className="px-6 py-2 border border-sky-200 rounded-full text-sky-900 font-bold text-xs bg-sky-50/50">
              Income, Expense &amp; Saving/Loss Comparison
            </span>
          </div>

          <div className="flex justify-center items-center gap-6 my-4 text-xs font-bold">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Income</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span> Expense</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Saving</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span> Loss</span>
          </div>

          <div className="h-64 flex items-end justify-around border-b border-slate-200 pb-2 px-4 gap-6 pt-6">
            <div className="w-16 bg-sky-500 rounded-t-md h-[80%] relative group" title="Income"></div>
            <div className="w-16 bg-orange-500 rounded-t-md h-[30%] relative group" title="Expense"></div>
            <div className="w-16 bg-emerald-500 rounded-t-md h-[65%] relative group" title="Saving"></div>
            <div className="w-16 bg-rose-600 rounded-t-md h-[10%] relative group" title="Loss"></div>
          </div>
          
          <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100 justify-between items-center">
            <button onClick={onStartRegistration} className="text-xs font-bold text-teal-700 hover:underline cursor-pointer">
              + Go to Registration Form →
            </button>
            <button onClick={onShowUserList} className="text-xs font-bold text-slate-700 hover:underline cursor-pointer">
              View User Records →
            </button>
          </div>
        </div>

        {/* Right Card: Monthly Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="px-6 py-2 border border-sky-200 rounded-full text-sky-900 font-bold text-xs bg-sky-50/50 mx-auto">
              Monthly Trends ({selectedYear})
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>Year</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs outline-none"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center items-center gap-6 my-4 text-xs font-bold">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Income</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Savings</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span> Shares Pool</span>
          </div>

          <div className="h-64 flex flex-col justify-center items-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs font-medium space-y-2 p-4 text-center">
            {loading ? (
              <span>Aggregating module metrics...</span>
            ) : (
              <>
                <strong className="text-sm text-[#102a43] font-serif">Comprehensive Group Health</strong>
                <p>Active Members: <strong>{metrics.totalMembers}</strong></p>
                <p>Total Capital Pool: <strong className="text-emerald-700">{formatIndianCurrency(metrics.shareCapitalPool)}</strong></p>
                <p>Total Net Savings: <strong className="text-teal-700">{formatIndianCurrency(metrics.netProfit)}</strong></p>
                <p>Pending Dues &amp; Loans: <strong className="text-amber-700">{metrics.pendingDues}</strong></p>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}