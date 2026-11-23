// src/Pages/registration/List.jsx
import { useState, useEffect, useRef } from "react";
import { fetchMembers } from "../../services/memberService";
import { fetchShareAllocations } from "../../services/shareService";
import { fetchLoans } from "../../services/loanService";
import apiClient from "../../services/apiClient";
import { getRegistrationSettings } from "../../services/settingsService";
import { loanStatus, outstandingAmount } from "../Loans/loanUtils";

const PAID_STATUSES = new Set(["Paid", "Complete", "Installment"]);

function memberIdOf(record) {
  return record?.memberId ?? record?.member?.id;
}

function formatCurrency(value) {
  return `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const titleCase = (value) => typeof value === "string"
  ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  : value;

export default function List({ onEditMember, view = "registration" }) {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  
  // Selected Member for Full Profile Modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [profileSavings, setProfileSavings] = useState([]);
  const [profileShares, setProfileShares] = useState([]);
  const [profileLoans, setProfileLoans] = useState([]);
  const [profileDocumentUrl, setProfileDocumentUrl] = useState("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("All");
  const [filterMemberStatus, setFilterMemberStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterBank, setFilterBank] = useState("All");
  const [filterTimeframe, setFilterTimeframe] = useState("All");

  const latestRequest = useRef(0);

  const buildRecords = (memberRecords, shareRecords, savingsRecords, loanRecords) => {
    const membersList = Array.isArray(memberRecords) ? memberRecords : [];
    const sharesList = Array.isArray(shareRecords) ? shareRecords : [];
    const savingsList = Array.isArray(savingsRecords) ? savingsRecords : [];
    const loansList = Array.isArray(loanRecords) ? loanRecords : [];

    const sharesByMemberId = new Map();
    const totalsByMemberId = new Map();
    const totalsForMember = (memberId) => {
      const key = String(memberId);
      if (!totalsByMemberId.has(key)) {
        totalsByMemberId.set(key, { monthlySavings: 0, capital: 0, loanBalance: 0, pendingLoan: 0 });
      }
      return totalsByMemberId.get(key);
    };

    sharesList.forEach((share) => {
      const memberId = memberIdOf(share);
      if (memberId === undefined || memberId === null) return;
      if (!sharesByMemberId.has(String(memberId))) sharesByMemberId.set(String(memberId), share);
      if (!PAID_STATUSES.has(String(share.paymentStatus || share.status || "Complete"))) return;
      const quantity = Number(share.numberOfShares || share.quantity) || 1;
      const faceValue = Number(share.faceValue) || 500;
      totalsForMember(memberId).capital += Number(share.paymentAmount || share.totalAmount) || quantity * faceValue;
    });

    savingsList.forEach((saving) => {
      const memberId = memberIdOf(saving);
      if (memberId === undefined || memberId === null) return;
      if (!PAID_STATUSES.has(String(saving.status || saving.paymentStatus || "Paid"))) return;
      totalsForMember(memberId).monthlySavings += Number(saving.amountMonthly || saving.amount) || 0;
    });

    loansList.forEach((loan) => {
      const memberId = memberIdOf(loan);
      if (memberId === undefined || memberId === null) return;
      const totals = totalsForMember(memberId);
      const status = loanStatus(loan);
      if (["Approved", "Active"].includes(status)) totals.loanBalance += outstandingAmount(loan);
      if (status === "Pending") totals.pendingLoan += Number(loan.amount) || 0;
    });

    return membersList.map((member) => {
      const share = sharesByMemberId.get(String(member.id)) || {};
      const totals = totalsByMemberId.get(String(member.id)) || {
        monthlySavings: 0,
        capital: 0,
        loanBalance: 0,
        pendingLoan: 0,
      };
      const settings = getRegistrationSettings();
      const memberCategory = share.shareType || member.memberType || "General";
      const feeStructure = (settings.memberTypesWithFee || []).find(
        (type) => String(type.name).toLowerCase() === String(memberCategory).toLowerCase(),
      );
      const shareAmount = feeStructure
        ? Number(feeStructure.regFee) || 0
        : Number(member.registrationFee ?? share.faceValue ?? share.paymentAmount) || 500;
      const monthlyAmount = feeStructure
        ? Number(feeStructure.monthlyFee) || 0
        : Number(member.monthlyFee ?? share.monthlySaving) || 0;
      const totalMemberFee = shareAmount;
      const netAmount = totalMemberFee + totals.monthlySavings + totals.capital - totals.loanBalance;
      const status = share.paymentStatus || member.paymentStatus || "Complete";
      const memberStatus = member.status || "Active";
      const category = memberCategory;
      const bank = share.destinationBank || member.destinationBank || "SBI";

      return {
        id: member.id,
        user: member.fullName || member.user || "Member",
        memberId: member.id || "-",
        shareAmount,
        memberFee: shareAmount,
        totalMemberFee,
        monthlyAmount,
        monthlyFee: monthlyAmount,
        totalSaving: shareAmount + monthlyAmount,
        monthlySavings: totals.monthlySavings,
        capital: totals.capital,
        loanBalance: totals.loanBalance,
        pendingLoan: totals.pendingLoan,
        netAmount,
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
        const [memberRecords, shareRecords, savingsResponse, loanRecords] = await Promise.all([
          fetchMembers(),
          fetchShareAllocations(),
          apiClient.get("/api/savings"),
          fetchLoans(),
        ]);
        if (!Array.isArray(savingsResponse.data)) {
          throw new Error("The savings service returned an invalid records list.");
        }
        if (!isMounted || requestId !== latestRequest.current) return;
        setRecords(buildRecords(memberRecords, shareRecords, savingsResponse.data, loanRecords));
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

  useEffect(() => {
    if (!selectedMember) return undefined;

    let isMounted = true;
    let documentUrl = "";

    Promise.resolve().then(() => {
      if (!isMounted) return;
      setProfileSavings([]);
      setProfileShares([]);
      setProfileLoans([]);
      setProfileDocumentUrl("");
    });

    Promise.all([
      apiClient.get(`/api/savings?memberId=${selectedMember.id}`).catch(() => ({ data: [] })),
      apiClient.get(`/api/shares?memberId=${selectedMember.id}`).catch(() => ({ data: [] })),
      apiClient.get(`/api/loans?memberId=${selectedMember.id}`).catch(() => ({ data: [] })),
    ]).then(([savingsResponse, sharesResponse, loansResponse]) => {
      if (!isMounted) return;
      const savings = Array.isArray(savingsResponse.data) ? savingsResponse.data : [];
      const shares = Array.isArray(sharesResponse.data) ? sharesResponse.data : [];
      const loans = Array.isArray(loansResponse.data) ? loansResponse.data : [];
      const memberId = String(selectedMember.id);
      const belongsToMember = (item) => String(item.memberId ?? item.member?.id ?? "") === memberId;
      setProfileSavings(savings.filter(belongsToMember));
      setProfileShares(shares.filter(belongsToMember));
      setProfileLoans(loans.filter(belongsToMember));
    });

    apiClient.get(`/api/members/${selectedMember.id}/document`, { responseType: "blob" })
      .then((response) => {
        if (!isMounted) return;
        documentUrl = URL.createObjectURL(response.data);
        setProfileDocumentUrl(documentUrl);
      })
      .catch(() => {
        if (isMounted) setProfileDocumentUrl("");
      });

    return () => {
      isMounted = false;
      if (documentUrl) URL.revokeObjectURL(documentUrl);
    };
  }, [selectedMember]);

  const handleEditClick = (record) => {
    if (typeof onEditMember === "function") {
      const raw = record.rawMember || {};
      const share = record.share || {};
      const storedAddress = raw.address || record.address || "";
      const addressWithoutPincode = storedAddress.includes(" - ")
        ? storedAddress.split(" - ")[0].trim()
        : storedAddress;
      const storedPincode = raw.pincode || (storedAddress.match(/-\s*(\d{6})\s*$/)?.[1] || "");
      const addressParts = addressWithoutPincode.split(/\s*,\s*/);
      const dob = raw.dob || raw.birthDate;

      onEditMember({
        ...raw,
        id: record.id,
        fullName: raw.fullName || record.user || "",
        fatherName: raw.fatherName || "",
        dob: typeof dob === "string" ? dob.slice(0, 10) : dob || "",
        gender: raw.gender || "",
        occupation: raw.occupation || "",
        memberType: raw.memberType || record.category || "Standard",
        membershipYear: raw.membershipYear || raw.year || "2026",
        mobile: raw.mobile || record.mobile || "",
        email: raw.email || "",
        nomineeName: raw.nomineeName || "",
        nomineeRelationship: raw.nomineeRelationship || raw.nomineeRelation || "",
        nomineeMobile: raw.nomineeMobile || "",

        street: raw.street || addressParts[0] || "",
        pincode: storedPincode,
        district: raw.district || addressParts[addressParts.length >= 3 ? addressParts.length - 2 : 0] || "",
        taluka: raw.taluka || addressParts[addressParts.length >= 4 ? addressParts.length - 3 : 0] || "",
        state: raw.state || addressParts[addressParts.length >= 2 ? addressParts.length - 1 : 0] || "",
        city: raw.city || "",
        address: raw.address || record.address || "",

        witnessName: raw.witnessName || raw.witness1Name || "",
        witnessMemberNo: raw.witnessMemberNo || raw.witness1MemberNo || "",
        witnessPhone: raw.witnessPhone || raw.witness1Phone || "",
        witnessEmail: raw.witnessEmail || raw.witness1Email || "",
        witnessIdProofType: raw.witnessIdProofType || raw.witness1IdProofType || raw.witness1IdType || "",

        witness2Name: raw.witness2Name || "",
        witness2MemberNo: raw.witness2MemberNo || "",
        witness2Phone: raw.witness2Phone || "",
        witness2Email: raw.witness2Email || "",
        witness2IdProofType: raw.witness2IdProofType || "",

        registrationFee: raw.registrationFee ?? record.shareAmount ?? 500,
        paymentStatus: raw.paymentStatus || record.paymentStatus || "Complete",
        paymentMode: raw.paymentMode || record.paymentMethod || "Cash",
        destinationBank: raw.destinationBank || record.bank || "SBI (Current Account - 123456789)",
        sourceBank: raw.sourceBank || share.sourceBank || "",
        transactionId: raw.transactionId || share.referenceNumber || "",
      });
    }
  };

  const filteredRecords = records.filter((item) => {
    if (view === "financial" && filterPaymentStatus !== "All" && item.paymentStatus !== filterPaymentStatus) return false;
    if (filterMemberStatus !== "All" && item.memberStatus !== filterMemberStatus) return false;
    if (filterCategory !== "All" && item.category !== filterCategory) return false;
    if (view === "financial" && filterBank !== "All" && item.bank !== filterBank) return false;

    if (filterTimeframe !== "All") {
      const recordDate = new Date(item.date);
      if (Number.isNaN(recordDate.getTime())) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cutoff = new Date(today);

      if (filterTimeframe === "Today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (filterTimeframe === "7 Days" || filterTimeframe === "1 Week") {
        cutoff.setDate(cutoff.getDate() - 7);
      } else if (filterTimeframe === "1 Month") {
        cutoff.setMonth(cutoff.getMonth() - 1);
      } else if (filterTimeframe === "1 Year") {
        cutoff.setFullYear(cutoff.getFullYear() - 1);
      }

      recordDate.setHours(0, 0, 0, 0);
      if (recordDate < cutoff || recordDate > new Date()) return false;
    }

    if (searchQuery.trim() && !item.user.toLowerCase().includes(searchQuery.toLowerCase()) && !String(item.memberId).toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const summaryTotals = records.reduce((totals, record) => ({
    totalMemberFee: totals.totalMemberFee + (Number(record.totalMemberFee) || 0),
    monthlySavings: totals.monthlySavings + (Number(record.monthlySavings) || 0),
    capital: totals.capital + (Number(record.capital) || 0),
    loanBalance: totals.loanBalance + (Number(record.loanBalance) || 0),
    pendingLoan: totals.pendingLoan + (Number(record.pendingLoan) || 0),
    netAmount: totals.netAmount + (Number(record.netAmount) || 0),
  }), {
    totalMemberFee: 0,
    monthlySavings: 0,
    capital: 0,
    loanBalance: 0,
    pendingLoan: 0,
    netAmount: 0,
  });

  const rawM = selectedMember ? (selectedMember.rawMember || selectedMember) : null;

  return (
    <div className="p-1 lg:p-2 max-w-[1450px] mx-auto bg-white rounded-xl border border-slate-200 shadow-sm font-sans text-xs">
      
      {/* Header & Advanced Filters */}
      <div className="mb-2 pb-2 border-b border-slate-200 space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            
            
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-0">
          <select
            value={filterTimeframe}
            onChange={(e) => setFilterTimeframe(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="7 Days">7 Days</option>
            <option value="1 Week">1 Week</option>
            <option value="1 Month">1 Month</option>
            <option value="1 Year">1 Year</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">Categories</option>
            <option value="Standard">Standard</option>
            <option value="Lifetime">Lifetime</option>
            <option value="Founder">Founder</option>
            <option value="Honorary">Honorary</option>
          </select>

          <select
            value={filterMemberStatus}
            onChange={(e) => setFilterMemberStatus(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
          >
            <option value="All">Member Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {view === "financial" && (
            <>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="h-9 px-3 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 outline-none shadow-2xs"
              >
                <option value="All">Banks</option>
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
                <option value="All">Payment Statuses</option>
                <option value="Complete">Complete</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </>
          )}
        </div>
      </div>

      {view === "financial" && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {[
            ["Total Member Fee", summaryTotals.totalMemberFee, "text-emerald-700"],
            ["Monthly Savings", summaryTotals.monthlySavings, "text-teal-700"],
            ["Capital", summaryTotals.capital, "text-sky-700"],
            ["Loan Balance", summaryTotals.loanBalance, "text-amber-700"],
            ["Pending Loan", summaryTotals.pendingLoan, "text-orange-700"],
            ["Net Amount", summaryTotals.netAmount, "text-indigo-700"],
          ].map(([label, amount, color]) => (
            <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold shadow-2xs">
              <span className="text-slate-500">{label}:</span>
              <span className={`text-sm font-extrabold ${color}`}>{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      )}

      {view === "registration" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-center font-bold uppercase tracking-wider text-slate-700">
                <th className="border-r border-slate-200 px-3 py-3">Member ID</th>
                <th className="border-r border-slate-200 px-3 py-3">User Name</th>
                <th className="border-r border-slate-200 px-3 py-3">Category</th>
                <th className="border-r border-slate-200 px-3 py-3">Member Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-center text-slate-700">
              {filteredRecords.length > 0 ? filteredRecords.map((record, index) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedMember(record)}
                  className={`cursor-pointer transition hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-3 py-3.5 font-mono font-bold text-slate-600">MEM-{record.memberId}</td>
                  <td className="px-3 py-3.5 font-bold text-[#102a43]">{titleCase(record.user)}</td>
                  <td className="px-3 py-3.5 font-medium text-slate-600">{titleCase(record.category)}</td>
                  <td className="px-3 py-3.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${record.memberStatus === "Active" ? "text-teal-700" : "text-slate-500"}`}>
                      {titleCase(record.memberStatus)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedMember(record); }}
                      className="cursor-pointer rounded-md bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-10 text-center font-medium text-slate-400">
                    {loadingRecords ? "Loading member records..." : recordsError || "No member records found matching your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-center font-bold uppercase tracking-wider text-slate-700">
                <th className="border-r border-slate-200 px-3 py-3">Member ID</th>
                <th className="border-r border-slate-200 px-3 py-3">User Name</th>
                <th className="border-r border-slate-200 px-3 py-3">Bank</th>
                <th className="border-r border-slate-200 px-3 py-3">Member Fee</th>
                <th className="border-r border-slate-200 px-3 py-3">Monthly Fee</th>
                <th className="border-r border-slate-200 px-3 py-3">Monthly Savings</th>
                <th className="border-r border-slate-200 px-3 py-3">Capital</th>
                <th className="border-r border-slate-200 px-3 py-3">Loan Balance</th>
                <th className="border-r border-slate-200 px-3 py-3">Pending Loan</th>
                <th className="border-r border-slate-200 px-3 py-3">Net Amount</th>
                <th className="border-r border-slate-200 px-3 py-3">Payment Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-center text-slate-700">
              {filteredRecords.length > 0 ? filteredRecords.map((record, index) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedMember(record)}
                  className={`cursor-pointer transition hover:bg-slate-50 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-3 py-3.5 font-mono font-bold text-slate-600">MEM-{record.memberId}</td>
                  <td className="px-3 py-3.5 font-bold text-[#102a43]">{titleCase(record.user)}</td>
                  <td className="px-3 py-3.5 font-semibold text-slate-700">{titleCase(record.bank)}</td>
                  <td className="px-3 py-3.5 font-bold text-teal-700">{formatCurrency(record.memberFee)}</td>
                  <td className="px-3 py-3.5 font-bold text-slate-800">{formatCurrency(record.monthlyFee)}</td>
                  <td className="px-3 py-3.5">{formatCurrency(record.monthlySavings)}</td>
                  <td className="px-3 py-3.5">{formatCurrency(record.capital)}</td>
                  <td className="px-3 py-3.5">{formatCurrency(record.loanBalance)}</td>
                  <td className="px-3 py-3.5">{formatCurrency(record.pendingLoan)}</td>
                  <td className="px-3 py-3.5 font-bold text-indigo-700">{formatCurrency(record.netAmount)}</td>
                  <td className="px-3 py-3.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      record.paymentStatus === "Complete" || record.paymentStatus === "Paid" ? "text-emerald-700" : "text-amber-600"
                    }`}>
                      {titleCase(record.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedMember(record); }}
                      className="cursor-pointer rounded-md bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100"
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="12" className="py-10 text-center font-medium text-slate-400">
                    {loadingRecords ? "Loading financial records..." : recordsError || "No financial records found matching your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
                    { id: "savings", label: "Monthly saving" },
                    { id: "share", label: "Share allocation" },
                    { id: "loan", label: "Loan" }
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
                    <p className="text-xs font-bold text-slate-600 mt-2">Relation: <span className="text-slate-900">{rawM?.nomineeRelationship || rawM?.nomineeRelation || "Not Provided"}</span></p>
                    <p className="text-xs font-bold text-slate-600 mt-2">Mobile: <span className="text-slate-900">{rawM?.nomineeMobile || "Not Provided"}</span></p>
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
                  <h3 className="text-base font-black text-[#5b51d8]">Uploaded documents</h3>
                  {profileDocumentUrl ? (
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-700">{rawM?.documentType || "Member ID Proof"}</span>
                        <button type="button" onClick={() => window.open(profileDocumentUrl, "_blank", "noopener,noreferrer")} className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold">Preview document</button>
                      </div>
                      <iframe src={profileDocumentUrl} title="Member document preview" className="w-full h-[520px] rounded-xl border border-slate-200 bg-white" />
                    </div>
                  ) : (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs text-xs font-bold text-slate-600">No uploaded document available.</div>
                  )}
                </div>
              )}

              {/* Tab 6: Monthly Savings */}
              {activeTab === "savings" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Monthly saving</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Date</th><th className="p-3">Month</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
                      <tbody>{profileSavings.map((saving) => <tr key={saving.id} className="border-t border-slate-200"><td className="p-3">{saving.date || saving.createdAt || "-"}</td><td className="p-3">{saving.month || "-"}</td><td className="p-3 font-bold">₹{Number(saving.amountMonthly || saving.amount || 0).toLocaleString("en-IN")}</td><td className="p-3">{saving.status || saving.paymentStatus || "-"}</td></tr>)}</tbody>
                    </table>
                  </div>
                  {!profileSavings.length && <p className="text-xs text-slate-500">No monthly savings found.</p>}
                </div>
              )}

              {/* Tab 7: Share Allocation */}
              {activeTab === "share" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Share allocation</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Date</th><th className="p-3">Share No</th><th className="p-3">No. of Share</th><th className="p-3">Amount</th><th className="p-3">Total Amount</th></tr></thead>
                      <tbody>{profileShares.map((share) => { const quantity = Number(share.numberOfShares || share.quantity || 0); const amount = Number(share.paymentAmount || share.faceValue || 0); return <tr key={share.id} className="border-t border-slate-200"><td className="p-3">{share.applicationDate || share.date || share.joiningDate || "-"}</td><td className="p-3">{share.shareRange || share.startShareNo || "-"}</td><td className="p-3">{quantity}</td><td className="p-3">₹{amount.toLocaleString("en-IN")}</td><td className="p-3 font-bold">₹{(amount * quantity).toLocaleString("en-IN")}</td></tr>; })}</tbody>
                    </table>
                  </div>
                  {!profileShares.length && <p className="text-xs text-slate-500">No share allocation found.</p>}
                </div>
              )}

              {/* Tab 8: Loans */}
              {activeTab === "loan" && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#5b51d8]">Loan</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Date</th><th className="p-3">Loan No</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
                      <tbody>{profileLoans.map((loan) => <tr key={loan.id} className="border-t border-slate-200"><td className="p-3">{loan.applicationDate || loan.date || "-"}</td><td className="p-3">{loan.loanNo || loan.id || "-"}</td><td className="p-3 font-bold">₹{Number(loan.amount || loan.loanAmount || 0).toLocaleString("en-IN")}</td><td className="p-3">{loan.status || "-"}</td></tr>)}</tbody>
                    </table>
                  </div>
                  {!profileLoans.length && <p className="text-xs text-slate-500">No loan records found.</p>}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>   
  );
}