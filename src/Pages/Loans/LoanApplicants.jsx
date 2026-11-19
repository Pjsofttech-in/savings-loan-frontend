import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../../services/apiClient";
import { fetchLoans, updateLoanStatus } from "../../services/loanService";
import { fetchShareAllocations } from "../../services/shareService";
import { loanStatus, money } from "./loanUtils";

const PAID_STATUSES = new Set(["Paid", "Complete", "Installment"]);
const PAGE_SIZE = 8;

function memberIdOf(record) {
  return String(record.memberId ?? record.member?.id ?? "");
}

function shareCapitalAmount(share) {
  const quantity = Number(share.numberOfShares || share.quantity) || 1;
  const faceValue = Number(share.faceValue) || 500;
  return Number(share.paymentAmount || share.totalAmount) || quantity * faceValue;
}

function errorText(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

async function fetchApplicantData() {
  const [loanRecords, savingsResponse, shareRecords] = await Promise.all([
    fetchLoans(),
    apiClient.get("/api/savings"),
    fetchShareAllocations(),
  ]);
  if (!Array.isArray(savingsResponse.data)) {
    throw new Error("The savings service returned an invalid records list.");
  }
  return { loanRecords, savingsRecords: savingsResponse.data, shareRecords };
}

export default function LoanApplicants() {
  const [loans, setLoans] = useState([]);
  const [savings, setSavings] = useState([]);
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [applicationFrom, setApplicationFrom] = useState("");
  const [applicationTo, setApplicationTo] = useState("");
  const [page, setPage] = useState(1);

  const loadApplicants = useCallback(async () => {
    setError("");
    try {
      const { loanRecords, savingsRecords, shareRecords } = await fetchApplicantData();
      setLoans(loanRecords);
      setSavings(savingsRecords);
      setShares(shareRecords);
    } catch (loadError) {
      setError(errorText(loadError, "Could not load loan applicant or member asset records."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchApplicantData()
      .then(({ loanRecords, savingsRecords, shareRecords }) => {
        if (!active) return;
        setLoans(loanRecords);
        setSavings(savingsRecords);
        setShares(shareRecords);
      })
      .catch((loadError) => {
        if (active) setError(errorText(loadError, "Could not load loan applicant or member asset records."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    window.addEventListener("dataUpdated", loadApplicants);
    return () => {
      active = false;
      window.removeEventListener("dataUpdated", loadApplicants);
    };
  }, [loadApplicants]);

  const applicants = useMemo(() => {
    const savingsByMember = new Map();
    savings.forEach((saving) => {
      if (!PAID_STATUSES.has(String(saving.status || saving.paymentStatus || "Paid"))) return;
      const memberId = memberIdOf(saving);
      if (!memberId) return;
      savingsByMember.set(memberId, (savingsByMember.get(memberId) || 0) + (Number(saving.amountMonthly || saving.amount) || 0));
    });

    const shareCapitalByMember = new Map();
    shares.forEach((share) => {
      if (!PAID_STATUSES.has(String(share.paymentStatus || share.status || "Complete"))) return;
      const memberId = memberIdOf(share);
      if (!memberId) return;
      shareCapitalByMember.set(memberId, (shareCapitalByMember.get(memberId) || 0) + shareCapitalAmount(share));
    });

    const normalizedQuery = query.trim().toLowerCase();
    return loans
      .filter((loan) => !["Approved", "Active", "Completed"].includes(loanStatus(loan)))
      .map((loan) => {
        const memberId = memberIdOf(loan);
        return {
          ...loan,
          savingsTotal: savingsByMember.get(memberId) || 0,
          shareCapitalTotal: shareCapitalByMember.get(memberId) || 0,
        };
      })
      .filter((loan) => {
        const matchesQuery = !normalizedQuery || [
          loan.loanNo,
          loan.memberName,
          loan.memberId,
          loan.purpose,
        ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
        const matchesStatus = statusFilter === "All" || loanStatus(loan) === statusFilter;
        const applicationDate = String(loan.applicationDate || "");
        const matchesFrom = !applicationFrom || applicationDate >= applicationFrom;
        const matchesTo = !applicationTo || applicationDate <= applicationTo;
        return matchesQuery && matchesStatus && matchesFrom && matchesTo;
      })
      .sort((a, b) => String(b.applicationDate || "").localeCompare(String(a.applicationDate || "")));
  }, [loans, savings, shares, query, statusFilter, applicationFrom, applicationTo]);

  const totalPages = Math.max(1, Math.ceil(applicants.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageApplicants = applicants.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDecision = async (loan, status) => {
    setError("");
    setNotice("");
    try {
      await updateLoanStatus(loan.id, status);
      setNotice(`${loan.loanNo || `Application ${loan.id}`} marked ${status.toLowerCase()}.`);
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (actionError) {
      setError(errorText(actionError, "Could not update the application status."));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-3 font-sans">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Search applicant, member or purpose…"
            aria-label="Search loan applicants"
            className="h-10 rounded-lg border border-slate-300 px-3 text-xs"
          />
          <select
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
            aria-label="Filter applicants by status"
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs"
          >
            <option>All</option><option>Pending</option><option>Rejected</option>
          </select>
          <input type="date" value={applicationFrom} onChange={(event) => { setApplicationFrom(event.target.value); setPage(1); }} aria-label="Applications from date" title="Applications from date" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs" />
          <input type="date" value={applicationTo} onChange={(event) => { setApplicationTo(event.target.value); setPage(1); }} aria-label="Applications to date" title="Applications to date" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs" />
          <button type="button" onClick={() => { setQuery(""); setStatusFilter("All"); setApplicationFrom(""); setApplicationTo(""); setPage(1); }} className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-700">Clear filters</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
            <thead className="bg-teal-700 text-white">
              <tr>
                <th className="p-3">Applicant</th><th className="p-3">Applied</th><th className="p-3">Requested loan</th>
                <th className="p-3">Paid savings</th><th className="p-3">Share capital</th><th className="p-3">Total assets</th>
                <th className="p-3">Status</th><th className="p-3">Admin decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading applicant and member asset records…</td></tr>
              ) : pageApplicants.length ? pageApplicants.map((loan) => {
                const status = loanStatus(loan);
                return (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <strong className="block text-teal-800">{loan.memberName || `Member ${loan.memberId}`}</strong>
                      <span className="text-[10px] text-slate-500">{loan.loanNo || `Application ${loan.id}`} · Member #{loan.memberId}</span>
                      {loan.purpose && <span className="block max-w-52 truncate text-[10px] text-slate-500" title={loan.purpose}>{loan.purpose}</span>}
                    </td>
                    <td className="p-3">{loan.applicationDate || "—"}</td>
                    <td className="p-3 font-bold">{money(loan.amount)}</td>
                    <td className="p-3">{money(loan.savingsTotal)}</td>
                    <td className="p-3">{money(loan.shareCapitalTotal)}</td>
                    <td className="p-3 font-bold text-teal-800">{money(loan.savingsTotal + loan.shareCapitalTotal)}</td>
                    <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === "Rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{status}</span></td>
                    <td className="p-3">
                      {status === "Pending" ? (
                        <div className="flex min-w-32 flex-wrap gap-1.5">
                          <button type="button" onClick={() => handleDecision(loan, "Approved")} className="rounded-md bg-emerald-700 px-2 py-1.5 text-[10px] font-bold text-white">Approve</button>
                          <button type="button" onClick={() => handleDecision(loan, "Rejected")} className="rounded-md bg-red-700 px-2 py-1.5 text-[10px] font-bold text-white">Reject</button>
                        </div>
                      ) : <span className="text-[10px] text-slate-500">Decision recorded</span>}
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="8" className="p-8 text-center text-slate-500">No loan applicants match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs">
          <span className="font-semibold text-slate-600">Showing {pageApplicants.length} of {applicants.length} applicants</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
            <span className="font-bold">Page {currentPage} of {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
