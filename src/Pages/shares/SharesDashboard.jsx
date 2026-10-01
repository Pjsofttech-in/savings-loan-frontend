// src/Pages/shares/SharesDashboard.jsx
import { useState, useEffect } from "react";
import LiveMarketGraph from "./LiveMarketGraph";

export default function SharesDashboard({ onStartShares, onShowList }) {
  const [stats, setStats] = useState({
    totalAllotted: 142,
    totalCapital: 1420000,
  });

  return (
    <div className="p-6 lg:p-8 bg-[#f4f6f8] min-h-full font-sans space-y-6">
      
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card */}
        <div className="bg-[#ffedd5] border border-[#fed7aa] rounded-2xl p-5 shadow-sm">
          <span className="text-[#c2410c] text-xs font-black uppercase tracking-wider">Total Shares Allotted</span>
          <strong className="text-[#c2410c] text-3xl font-black block mt-2 font-serif">{stats.totalAllotted}</strong>
        </div>
        <div className="bg-[#dcfce7] border border-[#bbf7d0] rounded-2xl p-5 shadow-sm">
          <span className="text-[#15803d] text-xs font-black uppercase tracking-wider">Share Capital Pool</span>
          <strong className="text-[#15803d] text-3xl font-black block mt-2 font-serif">₹{stats.totalCapital.toLocaleString('en-IN')}</strong>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <button onClick={onStartShares} className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
            + New Shares Application
          </button>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <button onClick={onShowList} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition">
            View Shares Records →
          </button>
        </div>
      </div>

      {/* Live Market Wave Graph Component */}
      <LiveMarketGraph />

    </div>
  );
}