// src/Pages/user/UserPortal.jsx
import { useState, useEffect } from "react";
import apiClient from "../services/apiClient";

export default function UserPortal({ loggedInMemberId, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [shares, setShares] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    Promise.all([
      apiClient.get(`/api/members/${loggedInMemberId}`).catch(() => ({ data: null })),
      apiClient.get(`/api/shares?memberId=${loggedInMemberId}`).catch(() => ({ data: [] })),
      apiClient.get(`/api/savings?memberId=${loggedInMemberId}`).catch(() => ({ data: [] }))
    ])
    .then(([profileRes, sharesRes, savingsRes]) => {
      setProfile(profileRes.data);
      setShares(Array.isArray(sharesRes.data) ? sharesRes.data : []);
      setSavings(Array.isArray(savingsRes.data) ? savingsRes.data : []);
    })
    .finally(() => setLoading(false));
  }, [loggedInMemberId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-sans">Loading your portal...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest">Member Portal</span>
          <h1 className="text-lg font-extrabold text-[#102a43] m-0">Welcome, {profile?.fullName || "Member"}</h1>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition cursor-pointer"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "profile" ? "bg-teal-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            My Personal Info
          </button>
          <button
            onClick={() => setActiveTab("shares")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "shares" ? "bg-teal-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            My Shares
          </button>
          <button
            onClick={() => setActiveTab("savings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "savings" ? "bg-teal-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            My Savings
          </button>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto p-6 space-y-6">
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-extrabold text-[#102a43] m-0">Registered Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Full Name</span>
                <strong className="text-[#102a43] text-sm font-extrabold">{profile?.fullName || "N/A"}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Mobile</span>
                <strong className="text-slate-800 text-sm font-extrabold">{profile?.mobile || "N/A"}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Email</span>
                <strong className="text-slate-800 text-sm font-extrabold">{profile?.email || "N/A"}</strong>
              </div>
            </div>
          </div>
        )}
        {activeTab === "shares" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-[#102a43] mb-4">My Shares</h3>
            <p className="text-xs text-slate-500">{shares.length} shares allotted.</p>
          </div>
        )}
        {activeTab === "savings" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-[#102a43] mb-4">My Savings</h3>
            <p className="text-xs text-slate-500">{savings.length} savings entries recorded.</p>
          </div>
        )}
      </main>
    </div>
  );
}