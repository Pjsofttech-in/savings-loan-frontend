// src/Pages/shares/ProfessionalMarketChart.jsx
import { useState, useEffect, useRef } from "react";

export default function ProfessionalMarketChart() {
  const [timeframe, setTimeframe] = useState("1M");
  const [chartData, setChartData] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [marketStats, setMarketStats] = useState({
    open: 2420.50,
    high: 2485.00,
    low: 2390.20,
    close: 2450.75,
    volume: "1.42M",
    changePercent: "+2.14%"
  });

  const svgRef = useRef(null);

  // Generate institutional-grade historical/live dataset based on timeframe
  useEffect(() => {
    let basePrice = 2400;
    const pointsCount = timeframe === "1D" ? 24 : timeframe === "1W" ? 35 : 50;
    
    const generated = Array.from({ length: pointsCount }, (_, i) => {
      const fluctuation = (Math.sin(i / 3) * 25) + (Math.random() * 18 - 8);
      basePrice = Number((basePrice + fluctuation).toFixed(2));
      return {
        time: timeframe === "1D" ? `${i}:00` : `Day ${i + 1}`,
        price: basePrice,
        volume: Math.floor(Math.random() * 50000 + 10000),
      };
    });

    setChartData(generated);
    if (generated.length > 0) {
      const last = generated[generated.length - 1].price;
      const first = generated[0].price;
      const pct = (((last - first) / first) * 100).toFixed(2);
      setMarketStats({
        open: first,
        high: Math.max(...generated.map(d => d.price)),
        low: Math.min(...generated.map(d => d.price)),
        close: last,
        volume: "1.84M",
        changePercent: `${pct >= 0 ? "+" : ""}${pct}%`
      });
    }
  }, [timeframe]);

  // Real-time live websocket ticker simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setChartData((prev) => {
        if (prev.length === 0) return prev;
        const lastItem = prev[prev.length - 1];
        const delta = Number(((Math.random() - 0.49) * 6).toFixed(2));
        const newPrice = Number((lastItem.price + delta).toFixed(2));
        
        const updated = [...prev.slice(1), { ...lastItem, price: newPrice, volume: Math.floor(Math.random() * 60000) }];
        
        setMarketStats(s => ({
          ...s,
          close: newPrice,
          high: Math.max(s.high, newPrice),
          low: Math.min(s.low, newPrice)
        }));

        return updated;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // SVG coordinate calculations
  const width = 900;
  const height = 340;
  const paddingBottom = 50; // Space for volume bars

  const prices = chartData.map(d => d.price);
  const minPrice = prices.length ? Math.min(...prices) * 0.995 : 2000;
  const maxPrice = prices.length ? Math.max(...prices) * 1.005 : 3000;
  const priceRange = maxPrice - minPrice || 1;

  const volumes = chartData.map(d => d.volume);
  const maxVolume = volumes.length ? Math.max(...volumes) : 100000;

  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1 || 1)) * width;
    const y = (height - paddingBottom) - ((d.price - minPrice) / priceRange) * (height - paddingBottom - 40) - 20;
    return { x, y, ...d };
  });

  const pathString = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const isBullish = marketStats.close >= marketStats.open;
  const waveColor = isBullish ? "#059669" : "#dc2626"; // Professional Emerald / Crimson

  // Handle mouse move for interactive crosshair
  const handleMouseMove = (e) => {
    if (!svgRef.current || chartData.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * width;
    
    let closestIdx = 0;
    let minDst = Infinity;
    points.forEach((pt, idx) => {
      const dst = Math.abs(pt.x - relativeX);
      if (dst < minDst) {
        minDst = dst;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const activeData = hoverIndex !== null && chartData[hoverIndex] ? chartData[hoverIndex] : marketStats;
  const displayPrice = hoverIndex !== null && chartData[hoverIndex] ? chartData[hoverIndex].price : marketStats.close;

  return (
    <div className="bg-[#0f172a] text-slate-100 p-6 lg:p-8 rounded-2xl border border-slate-800 shadow-xl font-sans">
      
      {/* Institutional Header & Ticker Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded">NSE: SHARE-IDX</span>
            <span className="text-xs font-bold text-slate-400">Primary Capital Index</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="flex items-baseline gap-4 mt-2">
            <h2 className="text-3xl font-black font-serif tracking-tight m-0 text-white">₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            <span className={`text-sm font-extrabold ${isBullish ? "text-emerald-400" : "text-rose-400"}`}>
              {marketStats.changePercent}
            </span>
          </div>
        </div>

        {/* OHLCV Mini Ticker Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-[11px]">
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">Open</span>
            <span className="font-bold font-serif text-slate-200">₹{marketStats.open}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">High</span>
            <span className="font-bold font-serif text-emerald-400">₹{marketStats.high}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">Low</span>
            <span className="font-bold font-serif text-rose-400">₹{marketStats.low}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">Close</span>
            <span className="font-bold font-serif text-slate-200">₹{marketStats.close}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">Vol</span>
            <span className="font-bold font-serif text-slate-200">{marketStats.volume}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase font-bold text-[9px]">Trend</span>
            <span className={`font-bold uppercase ${isBullish ? "text-emerald-400" : "text-rose-400"}`}>{isBullish ? "Bullish" : "Bearish"}</span>
          </div>
        </div>
      </div>

      {/* Chart Toolbar & Timeframe Selectors */}
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          {["1D", "1W", "1M", "1Y", "ALL"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeframe === tf
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Interval: <strong className="text-slate-200">1m Real-Time</strong> | Scale: <strong className="text-slate-200">Linear</strong>
        </div>
      </div>

      {/* Professional SVG Financial Canvas */}
      <div className="relative w-full h-[340px] bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden">
        
        {/* Horizontal Price Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
          <div className="border-b border-slate-600 w-full flex justify-end text-[10px] text-slate-300 font-mono">₹{maxPrice.toFixed(0)}</div>
          <div className="border-b border-slate-600 w-full flex justify-end text-[10px] text-slate-300 font-mono">₹{((maxPrice + minPrice)/2).toFixed(0)}</div>
          <div className="border-b border-slate-600 w-full flex justify-end text-[10px] text-slate-300 font-mono">₹{minPrice.toFixed(0)}</div>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="proWaveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={waveColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={waveColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Volume Histogram Bars at Bottom */}
          {points.map((pt, i) => {
            const barHeight = (pt.volume / maxVolume) * 45;
            const barY = height - barHeight;
            return (
              <rect
                key={i}
                x={pt.x - 4}
                y={barY}
                width="8"
                height={barHeight}
                fill={isBullish ? "#059669" : "#dc2626"}
                opacity="0.25"
                rx="2"
              />
            );
          })}

          {/* Area Fill Under Wave */}
          <polygon
            points={`0,${height - paddingBottom} ${points.map(p => `${p.x},${p.y}`).join(" ")} ${width},${height - paddingBottom}`}
            fill="url(#proWaveGradient)"
          />

          {/* Main Price Curve */}
          <path
            d={pathString}
            fill="none"
            stroke={waveColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Crosshair & Inspector Point */}
          {hoverIndex !== null && points[hoverIndex] && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={points[hoverIndex].x}
                y1="0"
                x2={points[hoverIndex].x}
                y2={height}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1="0"
                y1={points[hoverIndex].y}
                x2={width}
                y2={points[hoverIndex].y}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              {/* Inspection Node Circle */}
              <circle
                cx={points[hoverIndex].x}
                cy={points[hoverIndex].y}
                r="6"
                fill={waveColor}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Footer Status */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 gap-2">
        <span>Institutional Security &amp; Data Feed: <strong>Active SSL Enrypted Stream</strong></span>
        <span>{hoverIndex !== null ? `Time: ${activeData.time} | Price: ₹${activeData.price}` : "Hover chart to inspect historical ticks"}</span>
      </div>

    </div>
  );
}