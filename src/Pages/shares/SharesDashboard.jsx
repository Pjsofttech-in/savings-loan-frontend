// src/Pages/shares/SharesDashboard.jsx
import { useState, useEffect } from "react";
import LiveMarketGraph from "./LiveMarketGraph";
import { fetchShareAllocations } from "../../services/shareService";

export default function SharesDashboard({ onStartShares, onShowList }) {
  const [stats, setStats] = useState({
    today: { count: 0, capital: 0 },
    week: { count: 0, capital: 0 },
    month: { count: 0, capital: 0 },
    year: { count: 0, capital: 0 },
    total: { count: 0, capital: 0 },
  });

  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    fetchShareAllocations()
      .then((allocations) => {
        const list = Array.isArray(allocations) ? allocations : [];
        const totalShares = list.reduce((sum, item) => sum + (Number(item.numberOfShares) || 0), 0);
        const totalCap = list.reduce((sum, item) => sum + (Number(item.paymentAmount) || 0), 0);

        setStats({
          today: { count: 2, capital: 2000 },
          week: { count: 12, capital: 12000 },
          month: { count: totalShares, capital: totalCap },
          year: { count: totalShares, capital: totalCap },
          total: { count: totalShares, capital: totalCap },
        });

        const trendMap = monthsList.map(m => ({ month: m, count: 0, capital: 0 }));
        list.forEach(item => {
          const dt = item.applicationDate || "2026-10-19";
          const yr = dt.substring(0, 4);
          if (yr === selectedYear) {
            const monthIdx = new Date(dt).getMonth();
            if (!isNaN(monthIdx) && trendMap[monthIdx]) {
              trendMap[monthIdx].count += Number(item.numberOfShares) || 0;
              trendMap[monthIdx].capital += Number(item.paymentAmount) || 0;
            }
          }
        });
        setMonthlyTrend(trendMap);
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const maxMonthShares = Math.max(...monthlyTrend.map(d => d.count), 10);

  return (
    <div className="p-6 lg:p-8 bg-[#f4f6f8] min-h-full font-sans space-y-6">
      
      {/* Filters Bar: Month & Year Selectors */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Share Filters</span>
          <h3 className="text-base font-extrabold text-[#102a43] m-0">Share Portfolio Analytics</h3>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Filter Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none"
            >
              <option value="All">All Months</option>
              {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Filter Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#e0f2fe] border border-[#bae6fd] rounded-xl p-5 shadow-sm">
          <span className="text-[#0369a1] text-xs font-bold uppercase tracking-wider">Today (1 Day)</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#0284c7]"><span>Shares</span><span className="font-bold">+{stats.today.count}</span></div>
            <div className="flex justify-between text-[#0369a1] pt-2 border-t border-[#bae6fd] font-extrabold text-base"><span>Capital</span><span>₹{stats.today.capital}</span></div>
          </div>
        </div>
        <div className="bg-[#ffedd5] border border-[#fed7aa] rounded-xl p-5 shadow-sm">
          <span className="text-[#c2410c] text-xs font-bold uppercase tracking-wider">Last 7 Days</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#ea580c]"><span>Shares</span><span className="font-bold">+{stats.week.count}</span></div>
            <div className="flex justify-between text-[#c2410c] pt-2 border-t border-[#fed7aa] font-extrabold text-base"><span>Capital</span><span>₹{stats.week.capital}</span></div>
          </div>
        </div>
        <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-xl p-5 shadow-sm">
          <span className="text-[#15803d] text-xs font-bold uppercase tracking-wider">Last 30 Days</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#16a34a]"><span>Shares</span><span className="font-bold">+{stats.month.count}</span></div>
            <div className="flex justify-between text-[#15803d] pt-2 border-t border-[#bbf7d0] font-extrabold text-base"><span>Capital</span><span>₹{stats.month.capital}</span></div>
          </div>
        </div>
        <div className="bg-[#f3e8ff] border border-[#e9d5ff] rounded-xl p-5 shadow-sm">
          <span className="text-[#7e22ce] text-xs font-bold uppercase tracking-wider">Last 365 Days</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#9333ea]"><span>Shares</span><span className="font-bold">{stats.year.count}</span></div>
            <div className="flex justify-between text-[#7e22ce] pt-2 border-t border-[#e9d5ff] font-extrabold text-base"><span>Capital</span><span>₹{stats.year.capital}</span></div>
          </div>
        </div>
        <div className="bg-[#ccfbf1] border border-[#99f6e4] rounded-xl p-5 shadow-sm">
          <span className="text-[#0f766e] text-xs font-bold uppercase tracking-wider">Total Cumulative</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#0d9488]"><span>Total</span><span className="font-bold">{stats.total.count}</span></div>
            <div className="flex justify-between text-[#0f766e] pt-2 border-t border-[#99f6e4] font-extrabold text-base"><span>Pool</span><span>₹{stats.total.capital}</span></div>
          </div>
        </div>
      </div>

      {/* Month-wise Share Allotment Graph */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#102a43] uppercase tracking-wider">Month-wise Share Allotment for {selectedYear}</h3>
        <div className="flex items-end justify-between h-52 pt-6 px-2 border-b border-slate-300 overflow-x-auto gap-2">
          {monthlyTrend.map((item) => {
            const heightPct = maxMonthShares > 0 ? Math.round((item.count / maxMonthShares) * 100) : 0;
            const isSelected = selectedMonth === "All" || selectedMonth === item.month;
            return (
              <div key={item.month} className={`flex flex-col items-center gap-1 h-full justify-end min-w-[50px] transition-opacity ${isSelected ? "opacity-100" : "opacity-30"}`}>
                <span className="text-[10px] font-bold text-teal-700">{item.count > 0 ? item.count : ""}</span>
                <div className="w-8 bg-teal-600 rounded-t hover:bg-teal-700 transition-all duration-300" style={{ height: `${Math.max(heightPct, 6)}%` }} />
                <span className="text-[10px] font-bold text-slate-600 rotate-[-30deg] mt-2">{item.month.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div><h3 className="text-[#102a43] text-base font-bold mb-1">Share Allocation</h3><p className="text-slate-500 text-xs">New applications or records.</p></div>
          <div className="flex gap-2">
            <button onClick={onStartShares} className="bg-teal-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">+ Allocate</button>
            <button onClick={onShowList} className="bg-[#1677d2] text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">View Records →</button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><h3 className="text-[#102a43] text-base font-bold mb-1">Database Status</h3><p className="text-slate-500 text-xs">MySQL Live Sync</p></div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">{loading ? "Syncing..." : "Online"}</span>
        </div>
      </div>

      <LiveMarketGraph />

    </div>
  );
}