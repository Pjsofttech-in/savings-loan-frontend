import { useEffect, useMemo, useState } from "react";
import {
  deleteLoan,
  fetchLoanPayments,
  fetchLoans,
  recordLoanPayment,
  updateLoanStatus,
} from "../../services/loanService";
import { getRegistrationSettings } from "../../services/settingsService";
import { daysBetweenDates, isLoanOverdue, loanStatus, localDateString, money, outstandingAmount } from "./loanUtils";

const PAGE_SIZE = 8;
const PAYMENT_MODES = ["Cash", "UPI / Online", "Bank Transfer", "Cheque"];

function errorText(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export default function LoanList({ onStartLoan }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState(() => getRegistrationSettings().loanSettings);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoanId, setPaymentsLoanId] = useState(null);
  const loadingPayments = Boolean(selectedLoan && paymentsLoanId !== selectedLoan.id);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    penaltyAmount: "",
    paymentDate: localDateString(new Date()),
    paymentMode: PAYMENT_MODES[0],
    reference: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const loadLoans = async () => {
    setLoading(true);
    setError("");
    try {
      setLoans(await fetchLoans());
    } catch (loadError) {
      setError(errorText(loadError, "Could not load loan records."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchLoans()
      .then((records) => { if (active) setLoans(records); })
      .catch((loadError) => { if (active) setError(errorText(loadError, "Could not load loan records.")); })
      .finally(() => { if (active) setLoading(false); });
    const refreshSettings = () => setSettings(getRegistrationSettings().loanSettings);
    window.addEventListener("settingsUpdated", refreshSettings);
    return () => {
      active = false;
      window.removeEventListener("settingsUpdated", refreshSettings);
    };
  }, []);

  useEffect(() => {
    if (!selectedLoan) return undefined;
    let active = true;
    fetchLoanPayments(selectedLoan.id)
      .then((history) => {
        if (active) {
          setPayments(history);
          setPaymentsLoanId(selectedLoan.id);
        }
      })
      .catch((loadError) => {
        if (active) {
          setPayments([]);
          setPaymentsLoanId(selectedLoan.id);
          setError(errorText(loadError, "Could not load payment history."));
        }
      })
    return () => { active = false; };
  }, [selectedLoan]);

  const filteredLoans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return loans.filter((loan) => {
      const status = loanStatus(loan);
      const matchesQuery = !normalizedQuery || [
        loan.loanNo,
        loan.memberName,
        loan.memberId,
        loan.purpose,
      ].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const overdue = isLoanOverdue(loan);
      const overdueDays = daysBetweenDates(loan.dueDate);
      const matchesDue = dueFilter === "All"
        || (dueFilter === "Overdue" && overdue)
        || (dueFilter === "Reminder due" && (Number(loan.penaltyDue) > 0
          || (overdue && overdueDays >= Number(settings.reminderAfterDays || 7))))
        || (dueFilter === "Upcoming" && !overdue && ["Approved", "Active"].includes(status) && outstandingAmount(loan) > 0);
      return matchesQuery && matchesStatus && matchesDue;
    });
  }, [loans, query, statusFilter, dueFilter, settings]);

  const totalPages = Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageLoans = filteredLoans.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalOutstanding = filteredLoans.reduce((sum, loan) => sum + outstandingAmount(loan), 0);
  const totalPenalty = filteredLoans.reduce((sum, loan) => sum + (Number(loan.penaltyDue) || 0), 0);

  const handleStatus = async (loan, status) => {
    setError("");
    setNotice("");
    try {
      await updateLoanStatus(loan.id, status);
      setNotice(`${loan.loanNo} marked ${status.toLowerCase()}.`);
      await loadLoans();
    } catch (actionError) {
      setError(errorText(actionError, "Could not update loan status."));
    }
  };

  const handleDelete = async (loan) => {
    if (!window.confirm(`Delete ${loan.loanNo} and its payment history?`)) return;
    setError("");
    try {
      await deleteLoan(loan.id);
      setNotice(`${loan.loanNo} deleted.`);
      await loadLoans();
    } catch (actionError) {
      setError(errorText(actionError, "Could not delete the loan."));
    }
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    if (!selectedLoan) return;
    setError("");
    setNotice("");
    setSavingPayment(true);
    try {
      const updatedLoan = await recordLoanPayment(selectedLoan.id, {
        ...paymentForm,
        amount: Number(paymentForm.amount) || 0,
        penaltyAmount: Number(paymentForm.penaltyAmount) || 0,
      });
      setSelectedLoan(updatedLoan);
      setPaymentForm((current) => ({
        ...current,
        amount: Math.max(0, Number(updatedLoan.installmentAmount) - Number(updatedLoan.currentInstallmentPaid || 0)).toFixed(2),
        penaltyAmount: Number(updatedLoan.penaltyDue || 0).toFixed(2),
      }));
      setNotice("Payment recorded successfully.");
      await loadLoans();
      const history = await fetchLoanPayments(updatedLoan.id);
      setPayments(history);
    } catch (paymentError) {
      setError(errorText(paymentError, "Could not record this payment."));
    } finally {
      setSavingPayment(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-3 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-[10px] font-extrabold uppercase tracking-widest text-teal-700">Loan Management</p>
          <h1 className="m-0 text-xl font-black text-[#102a43]">Loan Records</h1>
          <p className="m-0 mt-1 text-xs text-slate-500">Search applications, manage approvals, record repayments and follow up on overdue installments.</p>
        </div>
        {onStartLoan && <button type="button" onClick={onStartLoan} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800">+ New loan</button>}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</p>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs">
          <span className="text-slate-500">Filtered principal outstanding</span>
          <strong className="ml-2 text-sm text-teal-800">{money(totalOutstanding)}</strong>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs">
          <span className="text-slate-500">Assessed penalty due</span>
          <strong className="ml-2 text-sm text-amber-800">{money(totalPenalty)}</strong>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h2 className="mb-2 text-[11px] font-black uppercase tracking-wider text-[#102a43]">Loan Filters</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search loan, member or purpose…" aria-label="Search loans" className="h-10 rounded-lg border border-slate-300 px-3 text-xs" />
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by loan status" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs">
            <option>All</option><option>Pending</option><option>Approved</option><option>Active</option><option>Rejected</option><option>Completed</option>
          </select>
          <select value={dueFilter} onChange={(event) => { setDueFilter(event.target.value); setPage(1); }} aria-label="Filter by due date" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs">
            <option>All</option><option>Upcoming</option><option>Overdue</option><option>Reminder due</option>
          </select>
          <button type="button" onClick={() => { setQuery(""); setStatusFilter("All"); setDueFilter("All"); setPage(1); }} className="h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-700">Clear filters</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-xs">
            <thead className="bg-teal-700 text-white">
              <tr><th className="p-3">Loan / Member</th><th className="p-3">Application</th><th className="p-3">Due date</th><th className="p-3">Installment</th><th className="p-3">Outstanding</th><th className="p-3">Penalty due</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading loan records…</td></tr>
              ) : pageLoans.length ? pageLoans.map((loan) => {
                const status = loanStatus(loan);
                const overdue = isLoanOverdue(loan);
                const overdueDays = daysBetweenDates(loan.dueDate);
                const hasPenaltyDue = Number(loan.penaltyDue) > 0;
                const reminderDue = hasPenaltyDue || (overdue && overdueDays >= Number(settings.reminderAfterDays || 7));
                return (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <strong className="block text-teal-800">{loan.loanNo || `LOAN-${loan.id}`}</strong>
                      <span>{loan.memberName || `Member ${loan.memberId}`}</span>
                      {loan.purpose && <span className="block max-w-52 truncate text-[10px] text-slate-500" title={loan.purpose}>{loan.purpose}</span>}
                    </td>
                    <td className="p-3">{loan.applicationDate || "—"}</td>
                    <td className="p-3">
                      {loan.dueDate || "—"}
                      {(overdue || hasPenaltyDue) && <span className={`mt-1 block font-bold ${reminderDue ? "text-red-700" : "text-amber-700"}`}>{hasPenaltyDue && !overdue ? "Penalty due" : reminderDue ? "Reminder due" : `${overdueDays} days overdue`}</span>}
                    </td>
                    <td className="p-3">{money(loan.installmentAmount)}<span className="block text-[10px] text-slate-500">{loan.installmentsPaid || 0}/{loan.termMonths || 1} paid</span></td>
                    <td className="p-3 font-bold">{money(outstandingAmount(loan))}</td>
                    <td className="p-3 font-bold text-amber-800">{money(loan.penaltyDue)}</td>
                    <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === "Completed" ? "bg-emerald-100 text-emerald-800" : status === "Rejected" ? "bg-red-100 text-red-800" : status === "Pending" ? "bg-slate-100 text-slate-700" : overdue ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-800"}`}>{status}</span></td>
                    <td className="p-3">
                      <div className="flex min-w-48 flex-wrap gap-1.5">
                        {status === "Pending" && <>
                          <button type="button" onClick={() => handleStatus(loan, "Approved")} className="rounded-md bg-emerald-700 px-2 py-1.5 text-[10px] font-bold text-white">Approve</button>
                          <button type="button" onClick={() => handleStatus(loan, "Rejected")} className="rounded-md bg-red-700 px-2 py-1.5 text-[10px] font-bold text-white">Reject</button>
                        </>}
                        {["Approved", "Active"].includes(status) && <button type="button" onClick={() => {
                          setError("");
                          setNotice("");
                          setPaymentForm((current) => ({
                            ...current,
                            amount: Math.max(0, Number(loan.installmentAmount) - Number(loan.currentInstallmentPaid || 0)).toFixed(2),
                            penaltyAmount: Number(loan.penaltyDue || 0).toFixed(2),
                          }));
                          setSelectedLoan(loan);
                        }} className="rounded-md bg-teal-700 px-2 py-1.5 text-[10px] font-bold text-white">Record payment</button>}
                        <button type="button" onClick={() => handleDelete(loan)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="8" className="p-8 text-center text-slate-500">No loans match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs">
          <span className="font-semibold text-slate-600">Showing {pageLoans.length} of {filteredLoans.length} loans</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
            <span className="font-bold">Page {currentPage} of {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
          </div>
        </div>
      </section>

      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingPayment) setSelectedLoan(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="loan-payment-heading" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div><p className="m-0 text-[10px] font-extrabold uppercase tracking-widest text-teal-700">Repayment</p><h2 id="loan-payment-heading" className="m-0 text-base font-black text-[#102a43]">{selectedLoan.loanNo} · {selectedLoan.memberName || `Member ${selectedLoan.memberId}`}</h2></div>
              <button type="button" onClick={() => setSelectedLoan(null)} aria-label="Close payment dialog" className="h-8 w-8 rounded-full bg-slate-100 font-bold text-slate-600">×</button>
            </div>
            {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-4">
              <div><span className="block text-slate-500">Outstanding</span><strong>{money(outstandingAmount(selectedLoan))}</strong></div>
              <div><span className="block text-slate-500">Current installment due</span><strong>{money(Math.max(0, Number(selectedLoan.installmentAmount) - Number(selectedLoan.currentInstallmentPaid || 0)))}</strong></div>
              <div><span className="block text-slate-500">Assessed penalty</span><strong className="text-amber-800">{money(selectedLoan.penaltyDue)}</strong></div>
              <div><span className="block text-slate-500">Loan balance</span><strong>{money(outstandingAmount(selectedLoan) + (Number(selectedLoan.penaltyDue) || 0))}</strong></div>
            </div>
            {Number(selectedLoan.penaltyDue) > 0 && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
                Penalty is calculated daily using the configured {settings.penaltyBasis === "monthlySavings" ? "monthly savings contribution" : settings.penaltyBasis === "sharePrice" ? "share price total" : "installment"} basis at {settings.dailyPenaltyRatePercent}% per day.
              </p>
            )}
            <form onSubmit={handlePayment} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">Principal payment (₹)
                  <input type="number" min="0" max={outstandingAmount(selectedLoan)} step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" />
                </label>
                <label className="text-xs font-bold text-slate-700">Penalty payment (₹)
                  <input type="number" min="0" max={Number(selectedLoan.penaltyDue) || 0} step="0.01" value={paymentForm.penaltyAmount} onChange={(event) => setPaymentForm((current) => ({ ...current, penaltyAmount: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" />
                </label>
                <label className="text-xs font-bold text-slate-700">Payment date
                  <input required type="date" value={paymentForm.paymentDate} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentDate: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" />
                </label>
                <label className="text-xs font-bold text-slate-700">Payment method
                  <select value={paymentForm.paymentMode} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentMode: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal">
                    {PAYMENT_MODES.map((mode) => <option key={mode}>{mode}</option>)}
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Reference / transaction ID
                  <input maxLength="100" value={paymentForm.reference} onChange={(event) => setPaymentForm((current) => ({ ...current, reference: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-normal" />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button type="button" onClick={() => setSelectedLoan(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">Close</button>
                <button type="submit" disabled={savingPayment} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">{savingPayment ? "Saving…" : "Save payment"}</button>
              </div>
            </form>
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-extrabold text-[#102a43]">Payment history</h3>
              {loadingPayments ? <p className="text-xs text-slate-500">Loading payment history…</p> : payments.length ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[460px] text-left text-xs">
                    <thead className="bg-slate-100"><tr><th className="p-2">Date</th><th className="p-2">Principal</th><th className="p-2">Penalty</th><th className="p-2">Mode / reference</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment.id}><td className="p-2">{payment.paymentDate}</td><td className="p-2">{money(payment.amount)}</td><td className="p-2">{money(payment.penaltyAmount)}</td><td className="p-2">{payment.paymentMode}{payment.reference ? ` · ${payment.reference}` : ""}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <p className="text-xs text-slate-500">No repayments have been recorded.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
