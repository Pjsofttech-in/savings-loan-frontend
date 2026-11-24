// src/Components/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { formatIndianCurrency } from "../utils/formHelpers";
import apiClient from "../services/apiClient";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTHS_LIST = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CURRENT_YEAR = new Date().getFullYear();

function parseRecordDate(record) {
  const value = record.paymentDate || record.applicationDate || record.date || record.createdAt;
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function getRecordYear(record) {
  const year = record.year || parseRecordDate(record)?.getFullYear();
  return year ? String(year) : "";
}

function getRecordMonth(record) {
  const month = String(record.month || "").toLowerCase();
  const monthIndex = month
    ? MONTHS_LIST.findIndex((name) => name.toLowerCase().startsWith(month.slice(0, 3)))
    : -1;
  return monthIndex >= 0 ? monthIndex : parseRecordDate(record)?.getMonth() ?? -1;
}

function getRecordAmount(record) {
  return Number(record.amountMonthly) || Number(record.amount) || 0;
}

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
  
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [chartPeriod, setChartPeriod] = useState("month");
  const [sharesData, setSharesData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);
  const [dataError, setDataError] = useState("");

  const fetchDashboardData = useCallback(() => {
    Promise.all([
      apiClient.get('/api/members'),
      apiClient.get('/api/shares'),
      apiClient.get('/api/savings')
    ]).then(([membersRes, sharesRes, savingsRes]) => {
      setDataError("");
      const members = Array.isArray(membersRes.data) ? membersRes.data : [];
      const shares = Array.isArray(sharesRes.data) ? sharesRes.data : [];
      const savings = Array.isArray(savingsRes.data) ? savingsRes.data : [];
      setSharesData(shares);
      setSavingsData(savings);

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
        shareCapitalPool,
        monthlySavingsPool,
        totalCollections,
        pendingSavings,
        verifiedSavingsCount,
        pendingSavingsCount,
      });

    }).catch((error) => {
      setDataError(error.response?.data?.message || error.message || "Unable to load dashboard data.");
    });
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time change events dispatched across components
    const handleDataUpdate = () => fetchDashboardData();
    window.addEventListener("dataUpdated", handleDataUpdate);
    return () => window.removeEventListener("dataUpdated", handleDataUpdate);
  }, [fetchDashboardData]);

  const yearOptions = [...new Set([
    String(CURRENT_YEAR),
    String(CURRENT_YEAR - 1),
    selectedYear,
    ...sharesData.map(getRecordYear),
    ...savingsData.map(getRecordYear),
  ].filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  const monthIndex = Number(selectedMonth);
  const chartCategories = chartPeriod === "year"
    ? yearOptions.slice().sort((a, b) => Number(a) - Number(b)).map((year) => ({ key: year, label: year }))
    : chartPeriod === "day"
      ? Array.from(
        { length: new Date(Number(selectedYear), monthIndex + 1, 0).getDate() },
        (_, index) => ({ key: String(index + 1), label: String(index + 1) }),
      )
      : MONTHS_LIST.map((month, index) => ({ key: String(index), label: month.slice(0, 3) }));

  const recordsForSelectedView = (records) => records.filter((record) => {
    if (chartPeriod === "year") return true;
    if (getRecordYear(record) !== selectedYear) return false;
    if (chartPeriod === "month") return true;
    const date = parseRecordDate(record);
    return date?.getMonth() === monthIndex;
  });
  const getCategoryKey = (record) => {
    if (chartPeriod === "year") return getRecordYear(record);
    if (chartPeriod === "day") return String(parseRecordDate(record)?.getDate() || "");
    return String(getRecordMonth(record));
  };
  const sharesInView = recordsForSelectedView(sharesData);
  const savingsInView = recordsForSelectedView(savingsData);
  const chartData = chartCategories.map(({ key, label }) => {
    const shares = sharesInView.filter((record) => getCategoryKey(record) === key);
    const savings = savingsInView.filter((record) => getCategoryKey(record) === key);
    const total = savings.reduce((sum, record) => sum + getRecordAmount(record), 0);
    const paid = savings
      .filter((record) => record.status === "Paid" || record.status === "Installment")
      .reduce((sum, record) => sum + getRecordAmount(record), 0);
    const pending = savings
      .filter((record) => record.status === "Pending")
      .reduce((sum, record) => sum + getRecordAmount(record), 0);
    return {
      label,
      shareCapital: shares.reduce(
        (sum, record) => sum + (Number(record.totalAmount) || (Number(record.quantity || 1) * 1000)),
        0,
      ),
      monthlySavings: total,
      total,
      paid,
      pending,
    };
  });
  const totalYearAmount = chartData.reduce((sum, item) => sum + item.total, 0);
  const totalYearPaid = chartData.reduce((sum, item) => sum + item.paid, 0);
  const totalYearPending = chartData.reduce((sum, item) => sum + item.pending, 0);
  const selectedChartTitle = chartPeriod === "year"
    ? "Year-wise"
    : chartPeriod === "day"
      ? `${MONTHS_LIST[monthIndex]} ${selectedYear}`
      : `Month-wise (${selectedYear})`;
  const formatCurrency = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

  return (
    <div className="p-2 lg:p-3 max-w-[1450px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans text-xs">
      {dataError && (
        <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Dashboard data could not be loaded: {dataError}
        </div>
      )}

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
      <div className="grid grid-cols-1 gap-6">
        
        {/* Left Chart */}
        <div className="dashboard-chart-panel dashboard-chart-panel--capital w-full bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-[#102a43]">
                Capital Pool &amp; Monthly Savings Comparison
              </h2>
              <p className="mt-1 text-xs text-slate-500">{selectedChartTitle} view</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select aria-label="Dashboard chart period" value={chartPeriod} onChange={(event) => setChartPeriod(event.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition-colors duration-200 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20">
                <option value="year">Year-wise</option>
                <option value="month">Month-wise</option>
                <option value="day">Day-wise</option>
              </select>
              <select aria-label="Dashboard chart year" value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition-colors duration-200 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20">
                {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              {chartPeriod === "day" && (
                <select aria-label="Dashboard chart month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 transition-colors duration-200 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20">
                  {MONTHS_LIST.map((month, index) => <option key={month} value={String(index)}>{month}</option>)}
                </select>
              )}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-700">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span> Share Capital</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Monthly Savings</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Pending Dues</span>
          </div>
          <div className="h-[320px] w-full" role="img" aria-label="Capital pool and monthly savings by selected time period">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={chartPeriod === "day" ? 0 : "preserveStartEnd"} angle={chartPeriod === "day" ? -45 : 0} textAnchor={chartPeriod === "day" ? "end" : "middle"} height={chartPeriod === "day" ? 55 : 30} />
                <YAxis width={88} tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                <Tooltip formatter={(value) => [formatCurrency(value)]} labelFormatter={(label) => chartPeriod === "day" ? `${MONTHS_LIST[monthIndex]} ${label}, ${selectedYear}` : chartPeriod === "month" ? `${label} ${selectedYear}` : label} />
                <Bar dataKey="shareCapital" name="Share Capital" fill="#0ea5e9" radius={[4, 4, 0, 0]} animationBegin={0} animationDuration={700} animationEasing="ease-out" />
                <Bar dataKey="monthlySavings" name="Monthly Savings" fill="#10b981" radius={[4, 4, 0, 0]} animationBegin={100} animationDuration={700} animationEasing="ease-out" />
                <Bar dataKey="pending" name="Pending Dues" fill="#f59e0b" radius={[4, 4, 0, 0]} animationBegin={200} animationDuration={700} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100 justify-between items-center text-xs">
            <button onClick={onStartRegistration} className="font-bold text-teal-700 hover:underline cursor-pointer">+ Go to Registration Form →</button>
            <button onClick={onShowUserList} className="font-bold text-slate-700 hover:underline cursor-pointer">View User Records →</button>
          </div>
        </div>

        {/* Right Vertical Chart */}
        <div className="dashboard-chart-panel dashboard-chart-panel--savings w-full bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="px-5 py-2 border border-teal-200 rounded-full text-teal-900 font-bold text-xs bg-teal-50/60">
                Monthly Savings ({selectedChartTitle})
              </span>
              <span className="text-xs text-slate-500">{totalYearAmount.toLocaleString("en-IN")} total savings amount</span>
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

            <div className="h-[320px] w-full" role="img" aria-label="Monthly savings performance by selected time period">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={chartPeriod === "day" ? 0 : "preserveStartEnd"} angle={chartPeriod === "day" ? -45 : 0} textAnchor={chartPeriod === "day" ? "end" : "middle"} height={chartPeriod === "day" ? 55 : 30} />
                  <YAxis width={88} tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value)]} labelFormatter={(label) => chartPeriod === "day" ? `${MONTHS_LIST[monthIndex]} ${label}, ${selectedYear}` : chartPeriod === "month" ? `${label} ${selectedYear}` : label} />
                  <Bar dataKey="paid" name="Paid Collections" fill="#0f766e" radius={[4, 4, 0, 0]} animationBegin={0} animationDuration={700} animationEasing="ease-out" />
                  <Bar dataKey="pending" name="Pending Audit" fill="#f59e0b" radius={[4, 4, 0, 0]} animationBegin={130} animationDuration={700} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
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
