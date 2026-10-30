// src/Pages/registration/List.jsx
import { useState, useEffect, useRef } from "react";
import { fetchMembers } from "../../services/memberService";
import { fetchShareAllocations } from "../../services/shareService";

export default function List({ onEditMember }) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  
  // Selected Member for Full Profile Modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");
  const [filterMemberStatus, setFilterMemberStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterBank, setFilterBank] = useState("All");

  const latestRequest = useRef(0);

  const buildRecords = (memberRecords, shareRecords) => {
    const membersList = Array.isArray(memberRecords) ? memberRecords : [];
    const sharesList = Array.isArray(shareRecords) ? shareRecords : [];

    const sharesByMemberId = new Map();
    sharesList.forEach((share) => {
      if (share && share.memberId && !sharesByMemberId.has(String(share.memberId))) {
        sharesByMemberId.set(String(share.memberId), share);
      }
    });

    return membersList.map((member) => {
      const share = sharesByMemberId.get(String(member.id)) || {};
      const hasAmount = share.paymentAmount !== undefined && share.paymentAmount !== null;
      const shareAmount = hasAmount ? Number(share.paymentAmount) : Number(member.registrationFee) || 500;
      const monthlyAmount = Number(share.monthlySaving || share.monthlyFee || member.monthlyFee) || 1000;
      const status = share.paymentStatus || member.paymentStatus || "Complete";
      const memberStatus = member.status || "Active";
      const category = share.shareType || member.memberType || "Standard";
      const bank = share.destinationBank || member.destinationBank || "SBI";

      return {
        id: member.id,
        user: member.fullName || member.user || "Member",
        memberId: member.id || "-",
        shareAmount,
        monthlyAmount,
        mobile: member.mobile || "",
        address: member.address || member.street || "",
        category,
        bank,
        memberStatus,
        date: member.applicationDate || member.joiningDate || share.applicationDate || "2026-10-20",
        paymentMethod: share.paymentMethod || member.paymentMode || "Cash",
        paymentStatus: status,
        amount: `₹${shareAmount}`,
        rawMember: member,
        share,
      };
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const requestId = ++latestRequest.current;
      setRecordsError("");
      try {
        const [memberRecords, shareRecords] = await Promise.all([
          fetchMembers(),
          fetchShareAllocations().catch(() => []),
        ]);
        if (!isMounted || requestId !== latestRequest.current) return;
        setRecords(buildRecords(memberRecords, shareRecords));
      } catch (error) {
        if (isMounted && requestId === latestRequest.current) {
          setRecordsError(error.message || "Failed to load records.");
        }
      } finally {
        if (isMounted && requestId === latestRequest.current) setLoadingRecords(false);
      }
    };

    loadData();
    window.addEventListener("dataUpdated", loadData);

    return () => {
      isMounted = false;
      window.removeEventListener("dataUpdated", loadData);
    };
  }, []);

  const handleEditClick = (record) => {
    if (typeof onEditMember === "function") {
      const raw = record.rawMember || {};
      const share = record.share || {};
      
      // Passing raw details as-is so nothing gets overridden or lost
      onEditMember({
        ...raw,
        id: record.id,
        fullName: raw.fullName || record.user || "",
        fatherName: raw.fatherName || "",
        dob: raw.dob || "",
        gender: raw.gender || "",
        occupation: raw.occupation || "",
        memberType: raw.memberType || record.category || "Standard",
        year: raw.year || "2026",
        mobile: raw.mobile || record.mobile || "",
        email: raw.email || "",
        nomineeName: raw.nomineeName || "",
        nomineeRelation: raw.nomineeRelation || "",
        nomineeMobile: raw.nomineeMobile || "",
        
        // Address fields
        pincode: raw.pincode || "",
        district: raw.district || "",
        taluka: raw.taluka || "",
        state: raw.state || "",
        city: raw.city || "",
        address: raw.address || record.address || "",
        
        // Witness 1 fields
        witness1Name: raw.witness1Name || "",
        witness1MemberNo: raw.witness1MemberNo || "",
        witness1Phone: raw.witness1Phone || "",
        witness1Email: raw.witness1Email || "",
        witness1IdType: raw.witness1IdType || "Aadhaar Card",

        // Witness 2 fields
        witness2Name: raw.witness2Name || "",
        witness2MemberNo: raw.witness2MemberNo || "",
        witness2Phone: raw.witness2Phone || "",
        witness2Email: raw.witness2Email || "",
        witness2IdType: raw.witness2IdType || "Aadhaar Card",

        // Payment / Financial fields
        registrationFee: raw.registrationFee || record.shareAmount || 500,
        paymentStatus: raw.paymentStatus || record.paymentStatus || "Complete",
        paymentMode: raw.paymentMode || record.paymentMethod || "Cash",
        destinationBank: raw.destinationBank || record.bank || "SBI (Current Account - 123456789)",
        sourceBank: raw.sourceBank || share.sourceBank || "",
        transactionId: raw.transactionId || share.referenceNumber || "",
      });
    }
  };

  const filteredRecords = records.filter((item) => {
    if (filterPaymentStatus !== "All" && item.paymentStatus !== filterPaymentStatus) return false;
    if (filterMemberStatus !== "All" && item.memberStatus !== filterMemberStatus) return false;
    if (filterCategory !== "All" && item.category !== filterCategory) return false;
    if (filterBank !== "All" && item.bank !== filterBank) return false;
    if (searchQuery.trim() && !item.user.toLowerCase().includes(searchQuery.toLowerCase()) && !String(item.memberId).toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPaid = records
    .filter((record) => record.paymentStatus === "Complete" || record.paymentStatus === "Paid")
    .reduce((total, record) => total + (Number(String(record.amount).replace(/[^0-9.-]+/g, "")) || 0), 0);
  
  const totalPending = records
    .filter((record) => record.paymentStatus === "Pending")
    .reduce((total, record) => total + (Number(String(record.amount).replace(/[^0-9.-]+/g, "")) || 0), 0);

  const totalMonthly = filteredRecords.reduce((total, record) => total + (Number(record.monthlyAmount) || 0), 0);
  const totalYearly = totalMonthly * 12;

  const rawM = selectedMember ? (selectedMember.rawMember || selectedMember) : null;

  return (
    <div className="p-6 max-w-[1400px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans text-xs">
      
      {/* Header & Advanced Filters */}
      <div className="mb-5 pb-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[#102a43] text-base font-bold m-0 uppercase tracking-wide">Member &amp; Transaction Directory</h2>
            <p className="text-slate-500 text-[11px] mt-0.5">Review registered members, manage details, or inspect financial records.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs text-slate-800 outline-none focus:border-teal-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Categories</option>
            <option value="Standard">Standard</option>
            <option value="Lifetime">Lifetime</option>
            <option value="Founder">Founder</option>
            <option value="Honorary">Honorary</option>
          </select>

          <select
            value={filterBank}
            onChange={(e) => setFilterBank(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Banks</option>
            <option value="SBI">SBI</option>
            <option value="HDFC Bank">HDFC Bank</option>
            <option value="ICICI Bank">ICICI Bank</option>
            <option value="Axis Bank">Axis Bank</option>
          </select>

          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Payment Statuses</option>
            <option value="Complete">Complete</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>

          <select
            value={filterMemberStatus}
            onChange={(e) => setFilterMemberStatus(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Member Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Collected:</span>
          <span className="text-sm font-extrabold text-emerald-700">₹{totalPaid}</span>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Pending:</span>
          <span className="text-sm font-extrabold text-amber-600">₹{totalPending}</span>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Monthly:</span>
          <span className="text-sm font-extrabold text-teal-700">₹{totalMonthly}</span>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2">
          <span className="text-slate-500 uppercase font-bold">Total Yearly:</span>
          <span className="text-sm font-extrabold text-sky-700">₹{totalYearly}</span>
        </div>
      </div>

      {/* Professional Clean Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-center">
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Member ID</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">User Name</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Category</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Bank</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Share Amount</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Monthly Amount</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Member Status</th>
              <th className="py-3 px-3 border-r border-slate-200 font-bold">Payment Status</th>
              <th className="py-3 px-3 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-center text-slate-700">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <tr 
                  key={record.id} 
                  onClick={() => setSelectedMember(record)}
                  className={`hover:bg-slate-50 cursor-pointer transition ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-600">MEM-{record.memberId}</td>
                  <td className="py-3.5 px-3 font-bold text-[#102a43]">{record.user}</td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">{record.category}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700">{record.bank}</td>
                  <td className="py-3.5 px-3 font-bold text-teal-700">₹{record.shareAmount}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-800">₹{record.monthlyAmount}</td>
                  
                  <td className="py-3.5 px-3">
                    <span className={`font-bold text-xs uppercase tracking-wider ${
                      record.memberStatus === "Active" ? "text-teal-700" : "text-slate-500"
                    }`}>
                      {record.memberStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className={`font-bold text-xs uppercase tracking-wider ${
                      record.paymentStatus === "Complete" || record.paymentStatus === "Paid"
                        ? "text-emerald-700"
                        : "text-amber-600"
                    }`}>
                      {record.paymentStatus}
                    </span>
                  </td>

                  {/* Table Actions: Only View button */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedMember(record); }}
                      className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md font-bold text-[11px] transition cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-10 text-center text-slate-400 font-medium">
                  {loadingRecords ? "Loading member records..." : recordsError || "No member records found matching your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Professional Member Profile Modal (Left Purple Sidebar Reference Style) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col lg:flex-row max-h-[90vh]">
            
            {/* Left Purple Sidebar */}
            <div className="w-full lg:w-80 bg-[#5b51d8] text-white p-6 flex flex-col justify-between relative">
              <div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="text-white/80 hover:text-white font-bold text-sm mb-6 flex items-center gap-1 cursor-pointer"
                >
                  ← Back
                </button>

                <div className="flex flex-col items-center text-center mt-2">
                  <div className="w-20 h-20 rounded-full bg-[#4a3fc0] border-2 border-white/30 flex items-center justify-center text-3xl font-black shadow-inner">
                    👤
                  </div>
                  <h3 className="text-lg font-black mt-3">{selectedMember.user}</h3>
                  <p className="text-white/80 text-xs mt-0.5">{rawM?.email || "member@example.com"}</p>
                  <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded mt-2">Member ID: MEM-{selectedMember.memberId}</span>
                </div>

                <div className="mt-6 text-center">
                  <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider shadow-sm">
                    {selectedMember.memberStatus}
                  </span>
                </div>

                {/* Sidebar Navigation Tabs */}
                <div className="mt-8 space-y-1.5">
                  {[
                    { id: "personal", label: "Personal information" },
                    { id: "address", label: "Address information" },
                    { id: "nominee", label: "Nominee details" },
                    { id: "membership", label: "Membership" },
                    { id: "documents", label: "Documents" },
                    { id: "share", label: "Share history" }
                  ].map((tab, idx) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition cursor-pointer ${
                        activeTab === tab.id ? "bg-white text-[#5b51d8] shadow-md" : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        activeTab === tab.id ? "bg-[#5b51d8] text-white" : "bg-white/20 text-white"
                      }`}>{idx + 1}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/20 text-[10px] text-white/70 text-center">
                Cooperative Banking &amp; Savings System
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-[#f8fafc]">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Profile</span>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">{selectedMember.category} · 2026</h4>
                </div>
                
                {/* Modal Header Actions: Edit Profile & Close */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rec = selectedMember;
                      setSelectedMember(null);
                      handleEditClick(rec);
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button 
                    onClick={() => setSelectedMember(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Tab 1: Personal Information */}
              {activeTab === "personal" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Personal information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{selectedMember.user}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Father / Spouse Name</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{rawM?.fatherName || "N/A"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{rawM?.dob || "N/A"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{rawM?.gender || "Male"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupation</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{rawM?.occupation || "Member"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{selectedMember.mobile || "N/A"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs md:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{rawM?.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Address Information */}
              {activeTab === "address" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Address information</h3>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</span>
                      <p className="text-sm font-black text-slate-800 mt-1">{selectedMember.address || "Pune, Maharashtra"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Nominee Details */}
              {activeTab === "nominee" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Nominee details</h3>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-bold text-slate-600">Nominee Name: <span className="text-slate-900">{rawM?.nomineeName || "Not Provided"}</span></p>
                    <p className="text-xs font-bold text-slate-600 mt-2">Relation: <span className="text-slate-900">{rawM?.nomineeRelation || "N/A"}</span></p>
                  </div>
                </div>
              )}

              {/* Tab 4: Membership */}
              {activeTab === "membership" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Membership details</h3>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <p className="text-xs font-bold text-slate-600">Share Amount: <span className="text-teal-700 font-black">₹{selectedMember.shareAmount}</span></p>
                    <p className="text-xs font-bold text-slate-600">Monthly Saving: <span className="text-slate-900 font-black">₹{selectedMember.monthlyAmount}</span></p>
                    <p className="text-xs font-bold text-slate-600">Bank / Branch: <span className="text-slate-900 font-semibold">{selectedMember.bank}</span></p>
                    <p className="text-xs font-bold text-slate-600">Joining Date: <span className="text-slate-900">{selectedMember.date}</span></p>
                  </div>
                </div>
              )}

              {/* Tab 5: Documents */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Uploaded Documents</h3>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-bold text-slate-600">ID Proof &amp; Signature verified successfully.</p>
                  </div>
                </div>
              )}

              {/* Tab 6: Share History */}
              {activeTab === "share" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Share history</h3>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <p className="text-xs font-bold text-slate-600">Payment Status: <span className="text-emerald-700 font-bold">{selectedMember.paymentStatus}</span></p>
                    <p className="text-xs font-bold text-slate-600 mt-2">Payment Method: <span className="text-slate-900 font-bold">{selectedMember.paymentMethod}</span></p>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>   
  );
}