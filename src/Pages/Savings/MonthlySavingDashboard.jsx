// src/Pages/savings/MonthlySavingDashboard.jsx
import { useState } from "react";

export default function MonthlySavingDashboard({ onStartSaving, onShowList }) {
  const [savings] = useState([
    { id: "SAV-501293", memberId: "MEM-1001", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 5000, status: "Verified" },
    { id: "SAV-501294", memberId: "MEM-1004", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 3500, status: "Verified" },
    { id: "SAV-501295", memberId: "MEM-1008", noOfMembers: 4, year: "2026", month: "September", amountMonthly: 20000, status: "Verified" },
    { id: "SAV-501296", memberId: "MEM-1012", noOfMembers: 1, year: "2026", month: "October", amountMonthly: 5000, status: "Pending" },
    { id: "SAV-501297", memberId: "MEM-1015", noOfMembers: 2, year: "2026", month: "August", amountMonthly: 10000, status: "Verified" },
  ]);

  const totalCollected = savings.reduce((acc, curr) => acc + curr.amountMonthly, 0);
  const verifiedCount = savings.filter((s) => s.status === "Verified").length;
  const pendingCount = savings.filter((s) => s.status === "Pending").length;

  const monthBreakdown = savings.reduce((acc, curr) => {
    acc[curr.month] = (acc[curr.month] || 0) + curr.amountMonthly;
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", fontFamily: "sans-serif", display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Explicitly Styled White Header Card (Guaranteed no blue background or hidden text) */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "32px", border: "1px solid #d9e2ec", boxShadow: "0 3px 12px rgba(16, 42, 67, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ color: "#087f8c", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>
            Savings Intelligence &amp; Overview
          </span>
          <h1 style={{ color: "#102a43", fontSize: "28px", fontWeight: "800", margin: "0 0 8px 0" }}>Monthly Saving Dashboard</h1>
          <p style={{ color: "#627d98", fontSize: "13px", margin: "0", maxWidth: "600px", lineHeight: "1.5" }}>
            High-level analytical overview of member savings portfolios, deposit growth trends, and verification compliance status.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={onStartSaving}
            style={{ background: "#087f8c", color: "#ffffff", fontWeight: "700", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", border: "none", cursor: "pointer", boxShadow: "0 2px 5px rgba(8, 127, 140, 0.2)" }}
          >
            + Register New Saving
          </button>
          {onShowList && (
            <button
              onClick={onShowList}
              style={{ background: "#f4f7fa", color: "#102a43", fontWeight: "700", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", border: "1px solid #d9e2ec", cursor: "pointer" }}
            >
              View Full Records Table
            </button>
          )}
        </div>
      </div>

      {/* High-Level Overview Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #d9e2ec" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#627d98", textTransform: "uppercase" }}>Total Portfolio Value</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#087f8c", margin: "0" }}>₹{totalCollected.toLocaleString("en-IN")}</h2>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#087f8c", background: "#edf6f6", padding: "2px 8px", borderRadius: "4px" }}>All-Time</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #d9e2ec" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#627d98", textTransform: "uppercase" }}>Total Registered Units</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#102a43", margin: "0" }}>{savings.length}</h2>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#243b53", background: "#f4f7fa", padding: "2px 8px", borderRadius: "4px" }}>Entries</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #d9e2ec" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#627d98", textTransform: "uppercase" }}>Verified Deposits</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#18794e", margin: "0" }}>{verifiedCount}</h2>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#18794e", background: "#e7f5ed", padding: "2px 8px", borderRadius: "4px" }}>Healthy</span>
          </div>
        </div>

        <div style={{ background: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #d9e2ec" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#627d98", textTransform: "uppercase" }}>Pending Audit</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "8px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#b42318", margin: "0" }}>{pendingCount}</h2>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#b42318", background: "#fff1f0", padding: "2px 8px", borderRadius: "4px" }}>Action Req.</span>
          </div>
        </div>
      </div>

      {/* Analytical Breakdown Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* Month-wise Collection Distribution */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #d9e2ec", gridColumn: "span 2", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#102a43", margin: "0 0 4px 0" }}>Month-wise Deposit Distribution</h3>
            <p style={{ fontSize: "12px", color: "#627d98", margin: "0 0 24px 0" }}>Breakdown of total monthly savings gathered across active cycles.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Object.entries(monthBreakdown).map(([month, amount]) => {
                const percentage = Math.round((amount / totalCollected) * 100);
                return (
                  <div key={month} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "700", color: "#243b53" }}>
                      <span>{month} 2026</span>
                      <span style={{ color: "#087f8c" }}>₹{amount.toLocaleString("en-IN")} ({percentage}%)</span>
                    </div>
                    <div style={{ width: "100%", background: "#f4f7fa", height: "10px", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ background: "#087f8c", height: "100%", borderRadius: "999px", width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #d9e2ec", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#627d98" }}>
            <span>Showing aggregate calendar year data</span>
            {onShowList && (
              <button 
                onClick={onShowList}
                style={{ color: "#087f8c", fontWeight: "700", background: "none", border: "none", cursor: "pointer", padding: "0" }}
              >
                View detailed ledger →
              </button>
            )}
          </div>
        </div>

        {/* Recent System Activity */}
        <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #d9e2ec", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#102a43", margin: "0 0 4px 0" }}>Recent Savings Activity</h3>
            <p style={{ fontSize: "12px", color: "#627d98", margin: "0 0 16px 0" }}>Latest entries recorded in the system.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {savings.slice(0, 4).map((item) => (
                <div key={item.id} style={{ padding: "12px", borderRadius: "10px", background: "#f8f9fa", border: "1px solid #e1e7ef", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#102a43", display: "block" }}>{item.memberId}</span>
                    <span style={{ fontSize: "11px", color: "#627d98" }}>{item.month} ({item.noOfMembers} member{item.noOfMembers > 1 ? 's' : ''})</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#087f8c", display: "block" }}>₹{item.amountMonthly.toLocaleString("en-IN")}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px", display: "inline-block", background: item.status === "Verified" ? "#e7f5ed" : "#fff1f0", color: item.status === "Verified" ? "#18794e" : "#b42318" }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {onShowList && (
            <button
              onClick={onShowList}
              style={{ width: "100%", marginTop: "20px", background: "#f4f7fa", color: "#102a43", fontWeight: "700", padding: "10px", borderRadius: "10px", fontSize: "12px", border: "1px solid #d9e2ec", cursor: "pointer" }}
            >
              Open Complete Records Table
            </button>
          )}
        </div>

      </div>
    </div>
  );
}