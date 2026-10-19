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

      {/* Navigation Tabs */}
      <div className="max-w-[1200px] mx-auto px-6 pt-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "profile" ? "bg-teal-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            My Personal Info
          </button>
          <button
            onClick={() => setActiveTab("form")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "form" ? "bg-teal-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            📄 My Registration Form
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
            <h3 className="text-base font-extrabold text-[#102a43] m-0">Registered Information Summary</h3>
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

        {activeTab === "form" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest">Official Document</span>
                <h3 className="text-lg font-extrabold text-[#102a43] m-0">Member Registration Application Form</h3>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                User ID: MEM-{profile?.id || loggedInMemberId}
              </span>
            </div>

            {profile ? (
              <div className="space-y-6 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-[#102a43] uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200">1. Applicant Personal Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Full Name</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Mobile Number</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.mobile}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Email Address</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.email || "N/A"}</strong>
                    </div>
                    <div className="col-span-full">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Residential Address</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.address || "N/A"}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-[#102a43] uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200">2. Membership &amp; Category Parameters</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Member Type</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.memberType || "Standard Member"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Membership Year</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.membershipYear || "2026"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Application Date</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.applicationDate || profile.joiningDate || "N/A"}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-[#102a43] uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200">3. Nominee &amp; Payment Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Nominee Name</span>
                      <strong className="text-slate-900 text-sm font-bold">{profile.nomineeName || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Registration Fee Paid</span>
                      <strong className="text-teal-700 text-sm font-extrabold">₹{profile.registrationFee || 500}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Status</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-block">Complete</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Registration form data not found.</p>
            )}
          </div>
        )}

        {activeTab === "shares" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-[#102a43] mb-4">My Shares Allotment</h3>
            {shares.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-teal-700 text-white font-bold uppercase">
                      <th className="p-3">Share ID</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shares.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-teal-800">SH-{s.id}</td>
                        <td className="p-3">{s.shareType || "Equity"}</td>
                        <td className="p-3 font-bold">{s.numberOfShares}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{s.paymentStatus || "Complete"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No shares allotted yet.</p>
            )}
          </div>
        )}

        {activeTab === "savings" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-extrabold text-[#102a43] mb-4">My Monthly Savings History</h3>
            {savings.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-teal-700 text-white font-bold uppercase">
                      <th className="p-3">Entry ID</th>
                      <th className="p-3">Cycle</th>
                      <th className="p-3">Amount (₹)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {savings.map(sav => (
                      <tr key={sav.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-teal-800">SAV-{sav.id}</td>
                        <td className="p-3">{sav.month} {sav.year}</td>
                        <td className="p-3 font-bold text-teal-700">₹{sav.amountMonthly || sav.amount}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{sav.status || "Paid"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No savings records found.</p>
            )}
          </div>
        )}

      </main>
    </div>
  );
}