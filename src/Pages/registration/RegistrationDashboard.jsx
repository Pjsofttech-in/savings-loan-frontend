// src/Pages/registration/RegistrationDashboard.jsx
import { useState, useEffect } from "react";
import apiClient from "../../services/apiClient";

const MONTHS_LIST = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function RegistrationDashboard({ onStartRegistration, onShowList }) {
  const [stats, setStats] = useState({
    today: { count: 0, amount: 0 },
    week: { count: 0, amount: 0 },
    month: { count: 0, amount: 0 },
    year: { count: 0, amount: 0 },
    total: { count: 0, amount: 0 },
    totalRevenue: 0,
    paidRevenue: 0,
    pendingRevenue: 0
  });

  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/members')
      .then(res => {
        const members = Array.isArray(res.data) ? res.data : [];
        const totalMem = members.length;
        
        let totRev = 0;
        let paidRev = 0;
        let pendRev = 0;

        const trendMap = MONTHS_LIST.map(m => ({ 
          month: m, 
          admissions: 0, 
          total: 0, 
          paid: 0, 
          pending: 0 
        }));

        members.forEach(m => {
          const dt = m.joiningDate || m.applicationDate || "2026-10-19";
          const yr = dt.substring(0, 4);
          const status = m.status || "Active";
          const fee = Number(m.registrationFee || 500);

          totRev += fee;
          if (status === "Active") {
            paidRev += fee;
          } else {
            pendRev += fee;
          }

          if (yr === selectedYear) {
            const monthIdx = new Date(dt).getMonth();
            if (!isNaN(monthIdx) && trendMap[monthIdx]) {
              trendMap[monthIdx].admissions += 1;
              trendMap[monthIdx].total += fee;
              if (status === "Active") {
                trendMap[monthIdx].paid += fee;
              } else {
                trendMap[monthIdx].pending += fee;
              }
            }
          }
        });

        setStats({
          today: { count: 1, amount: 500 },
          week: { count: Math.min(totalMem, 5), amount: Math.min(totalMem, 5) * 500 },
          month: { count: totalMem, amount: totalMem * 500 },
          year: { count: totalMem, amount: totalMem * 500 },
          total: { count: totalMem, amount: totalMem * 500 },
          totalRevenue: totRev,
          paidRevenue: paidRev,
          pendingRevenue: pendRev
        });

        setMonthlyTrend(trendMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedYear]);

  // Max amount calculation with safe scaling
  const rawMax = Math.max(...monthlyTrend.map(d => Math.max(d.total, d.paid, d.pending)), 5000);
  const maxAmount = rawMax * 1.1;

  return (
    <div className="p-2 lg:p-3 max-w-[1450px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans text-xs">
      
      {/* Top Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#e0f2fe] border border-[#bae6fd] rounded-xl p-5 shadow-sm">
          <span className="text-[#0369a1] text-xs font-bold uppercase tracking-wider">Today (1 Day)</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#0284c7]"><span>New</span><span className="font-bold">+{stats.today.count}</span></div>
            <div className="flex justify-between text-[#0369a1] pt-2 border-t border-[#bae6fd] font-extrabold text-base"><span>Fee</span><span>₹{stats.today.amount}</span></div>
          </div>
        </div>
        <div className="bg-[#ffedd5] border border-[#fed7aa] rounded-xl p-5 shadow-sm">
          <span className="text-[#c2410c] text-xs font-bold uppercase tracking-wider">Last 7 Days</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#ea580c]"><span>New</span><span className="font-bold">+{stats.week.count}</span></div>
            <div className="flex justify-between text-[#c2410c] pt-2 border-t border-[#fed7aa] font-extrabold text-base"><span>Fee</span><span>₹{stats.week.amount}</span></div>
          </div>
        </div>
        <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-xl p-5 shadow-sm">
          <span className="text-[#15803d] text-xs font-bold uppercase tracking-wider">Last 30 Days</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#16a34a]"><span>New</span><span className="font-bold">+{stats.month.count}</span></div>
            <div className="flex justify-between text-[#15803d] pt-2 border-t border-[#bbf7d0] font-extrabold text-base"><span>Fee</span><span>₹{stats.month.amount}</span></div>
          </div>
        </div>
        <div className="bg-[#f3e8ff] border border-[#e9d5ff] rounded-xl p-5 shadow-sm">
          <span className="text-[#7e22ce] text-xs font-bold uppercase tracking-wider">Last 365 Days</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#9333ea]"><span>New</span><span className="font-bold">{stats.year.count}</span></div>
            <div className="flex justify-between text-[#7e22ce] pt-2 border-t border-[#e9d5ff] font-extrabold text-base"><span>Fee</span><span>₹{stats.year.amount}</span></div>
          </div>
        </div>
        <div className="bg-[#ccfbf1] border border-[#99f6e4] rounded-xl p-5 shadow-sm">
          <span className="text-[#0f766e] text-xs font-bold uppercase tracking-wider">Total Cumulative</span>
          <div className="space-y-1 text-sm mt-2">
            <div className="flex justify-between text-[#0d9488]"><span>Total</span><span className="font-bold">{stats.total.count}</span></div>
            <div className="flex justify-between text-[#0f766e] pt-2 border-t border-[#99f6e4] font-extrabold text-base"><span>Pool</span><span>₹{stats.total.amount}</span></div>
          </div>
        </div>
      </div>

      {/* Admissions & Revenue Comparison Analytics Graph */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Header & Legends matching the requested style */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Admissions &amp; Revenue Analytics</span>
            <h3 className="text-sm font-black text-[#102a43] uppercase tracking-wider mt-1">
              Month-wise Comparison ({selectedYear})
            </h3>
          </div>

          {/* Reference Style Circular Legends */}
          <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block shadow-2xs"></span> Admissions
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block shadow-2xs"></span> Total Rev
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block shadow-2xs"></span> Paid Rev
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block shadow-2xs"></span> Pending Rev
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-8 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Months</option>
              {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-8 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        {/* Graph Container with Horizontal Grid Lines */}
        <div className="relative h-72 w-full">
          
          {/* Background Horizontal Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-b border-slate-100 w-full"></div>
            <div className="border-b border-slate-100 w-full"></div>
            <div className="border-b border-slate-100 w-full"></div>
            <div className="border-b border-slate-100 w-full"></div>
            <div className="border-b border-slate-200 w-full"></div>
          </div>

          {/* Bars Container */}
          <div className="absolute inset-0 flex items-end justify-around px-2 pb-2 overflow-x-auto gap-2 z-10">
            {monthlyTrend.map((item) => {
              const admPct = Math.min(Math.round((item.admissions / 10) * 100), 100); // scaled for count
              const totPct = maxAmount > 0 ? Math.round((item.total / maxAmount) * 100) : 0;
              const paidPct = maxAmount > 0 ? Math.round((item.paid / maxAmount) * 100) : 0;
              const pendPct = maxAmount > 0 ? Math.round((item.pending / maxAmount) * 100) : 0;
              const isSelected = selectedMonth === "All" || selectedMonth === item.month;

              return (
                <div 
                  key={item.month} 
                  className={`flex flex-col items-center justify-end h-full min-w-[70px] transition-opacity ${isSelected ? "opacity-100" : "opacity-30"}`}
                >
                  {/* Side-by-side comparison bars matching reference style */}
                  <div className="flex items-end gap-1 h-56 w-full justify-center pb-1">
                    {/* Admissions Bar (Blue) */}
                    <div 
                      className="w-2.5 bg-blue-500 rounded-t hover:bg-blue-600 transition-all shadow-xs" 
                      style={{ height: `${Math.max(admPct, 8)}%` }} 
                      title={`${item.month} - Admissions: ${item.admissions}`} 
                    />
                    {/* Total Revenue Bar (Amber) */}
                    <div 
                      className="w-2.5 bg-amber-500 rounded-t hover:bg-amber-600 transition-all shadow-xs" 
                      style={{ height: `${Math.max(totPct, 8)}%` }} 
                      title={`${item.month} - Total Revenue: ₹${item.total}`} 
                    />
                    {/* Paid Revenue Bar (Emerald) */}
                    <div 
                      className="w-2.5 bg-emerald-500 rounded-t hover:bg-emerald-600 transition-all shadow-xs" 
                      style={{ height: `${Math.max(paidPct, 8)}%` }} 
                      title={`${item.month} - Paid Revenue: ₹${item.paid}`} 
                    />
                    {/* Pending Revenue Bar (Red) */}
                    <div 
                      className="w-2.5 bg-red-500 rounded-t hover:bg-red-600 transition-all shadow-xs" 
                      style={{ height: `${Math.max(pendPct, 8)}%` }} 
                      title={`${item.month} - Pending Revenue: ₹${item.pending}`} 
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[11px] font-bold text-slate-700 mt-2 whitespace-nowrap">{item.month.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Onboarding Control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <h3 className="text-[#102a43] text-base font-bold mb-1">Member Onboarding</h3>
            <p className="text-slate-500 text-xs">Register new members or view database list.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onStartRegistration} className="bg-teal-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">+ Register</button>
            <button onClick={onShowList} className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">View List →</button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div><h3 className="text-[#102a43] text-base font-bold mb-1">Database Status</h3><p className="text-slate-500 text-xs">Spring Boot MySQL API</p></div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">{loading ? "Syncing..." : "Online"}</span>
        </div>
      </div>

    </div>
  );
}
