import { useEffect, useMemo, useState } from "react";
import { fetchLoans } from "../../services/loanService";
import { getRegistrationSettings } from "../../services/settingsService";
import { daysBetweenDates, isLoanOverdue, loanStatus, money, outstandingAmount } from "./loanUtils";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function LoanDashboard({ onStartLoan, onShowApplicants, onShowList }) {
  const [loans, setLoans] = useState([]);
  const [settings, setSettings] = useState(() => getRegistrationSettings().loanSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchLoans()
      .then((records) => { if (active) setLoans(records); })
      .catch((loadError) => { if (active) setError(loadError.response?.data?.message || loadError.message || "Could not load loan records."); })
      .finally(() => { if (active) setLoading(false); });
    const refreshSettings = () => setSettings(getRegistrationSettings().loanSettings);
    window.addEventListener("settingsUpdated", refreshSettings);
    return () => {
      active = false;
      window.removeEventListener("settingsUpdated", refreshSettings);
    };
  }, []);

  const metrics = useMemo(() => {
    const activeLoans = loans.filter((loan) => ["Approved", "Active"].includes(loanStatus(loan)));
    const reminders = loans.filter((loan) =>
      (Number(loan.penaltyDue) > 0)
        || (isLoanOverdue(loan) && daysBetweenDates(loan.dueDate) >= Number(settings.reminderAfterDays || 7)),
    );
    return {
      applications: loans.length,
      active: activeLoans.length,
      outstanding: activeLoans.reduce((sum, loan) => sum + outstandingAmount(loan), 0),
      penalties: activeLoans.reduce((sum, loan) => sum + (Number(loan.penaltyDue) || 0), 0),
      reminders,
    };
  }, [loans, settings]);

  const monthlyTotals = useMemo(() => {
    const thisYear = new Date().getFullYear();
    return MONTH_LABELS.map((label, month) => ({
      label,
      amount: loans.reduce((sum, loan) => {
        const date = new Date(`${loan.applicationDate || ""}T00:00:00`);
        return date.getFullYear() === thisYear && date.getMonth() === month
          ? sum + (Number(loan.amount) || 0)
          : sum;
      }, 0),
    }));
  }, [loans]);
  const maxMonthlyAmount = Math.max(...monthlyTotals.map((item) => item.amount), 1);
  const recentLoans = [...loans].sort((a, b) => String(b.applicationDate || "").localeCompare(String(a.applicationDate || ""))).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 text-[11px] font-extrabold uppercase tracking-widest text-teal-700">Loan Management</p>
          <h1 className="m-0 text-xl font-black text-[#102a43]">Loan Portfolio</h1>
          <p className="m-0 mt-1 text-xs text-slate-500">Review applicants separately from approved loans and repayment records.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onShowApplicants} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700">Review applicants</button>
          <button type="button" onClick={onShowList} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700">View loan records</button>
          <button type="button" onClick={onStartLoan} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800">+ Loan Form</button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loan portfolio summary">
        {[
          ["Applications", metrics.applications, "bg-sky-50 border-sky-200 text-sky-800"],
          ["Active loans", metrics.active, "bg-emerald-50 border-emerald-200 text-emerald-800"],
          ["Principal outstanding", money(metrics.outstanding), "bg-teal-50 border-teal-200 text-teal-800"],
          ["Assessed penalty", money(metrics.penalties), "bg-amber-50 border-amber-200 text-amber-800"],
        ].map(([label, value, style]) => (
          <div key={label} className={`rounded-xl border p-4 shadow-sm ${style}`}>
            <p className="m-0 text-[10px] font-extrabold uppercase tracking-wider opacity-80">{label}</p>
            <p className="m-0 mt-2 text-2xl font-black">{loading ? "…" : value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-teal-700">Disbursement trend</p>
              <h2 className="m-0 text-sm font-extrabold text-[#102a43]">Monthly applications · {new Date().getFullYear()}</h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">Loan amount</span>
          </div>
          <div className="flex h-48 items-end justify-between gap-2 overflow-x-auto border-b border-slate-200 px-2">
            {monthlyTotals.map((item) => (
              <div key={item.label} className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-1">
                <span className="max-w-12 truncate text-[9px] font-semibold text-slate-500">{item.amount ? money(item.amount) : ""}</span>
                <div
                  className="w-full max-w-8 rounded-t-md bg-teal-600"
                  title={`${item.label}: ${money(item.amount)}`}
                  style={{ height: `${item.amount ? Math.max(8, item.amount / maxMonthlyAmount * 100) : 3}%` }}
                />
                <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-amber-700">Payment follow-up</p>
              <h2 className="m-0 text-sm font-extrabold text-[#102a43]">Overdue reminders</h2>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">{metrics.reminders.length}</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            Reminders appear {settings.reminderAfterDays || 7}+ days after the installment due date. Penalties follow the Loan Settings policy.
          </p>
          <div className="mt-3 space-y-2">
            {metrics.reminders.slice(0, 3).map((loan) => (
              <div key={loan.id} className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs">
                <span className="min-w-0 truncate font-bold text-slate-800">{loan.memberName || `Member ${loan.memberId}`} · {loan.loanNo}</span>
                <span className="shrink-0 font-extrabold text-amber-800">{loan.dueDate ? `${daysBetweenDates(loan.dueDate)}d` : "Penalty due"}</span>
              </div>
            ))}
            {!loading && metrics.reminders.length === 0 && <p className="m-0 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No loans currently need an overdue reminder.</p>}
          </div>
          <button type="button" onClick={onShowList} className="mt-3 text-xs font-bold text-teal-700 underline">Open repayment records</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <button type="button" onClick={onShowList} className="text-xs font-bold text-teal-700">All records →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead className="bg-teal-700 text-white"><tr><th className="p-3">Loan ID</th><th className="p-3">Member</th><th className="p-3">Applied</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {recentLoans.map((loan) => (
                <tr key={loan.id}>
                  <td className="p-3 font-bold text-teal-800">{loan.loanNo}</td>
                  <td className="p-3">{loan.memberName || `Member ${loan.memberId}`}</td>
                  <td className="p-3">{loan.applicationDate || "—"}</td>
                  <td className="p-3 font-bold">{money(loan.amount)}</td>
                  <td className="p-3">{loanStatus(loan)}</td>
                </tr>
              ))}
              {!loading && recentLoans.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">No loan applications yet.</td></tr>}
              {loading && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading loan records…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
