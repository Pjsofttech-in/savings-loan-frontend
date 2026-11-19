import { useEffect, useMemo, useState } from "react";
import apiClient from "../../services/apiClient";
import { createLoan } from "../../services/loanService";
import { localDateString, money } from "./loanUtils";

function firstDueDate() {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  return localDateString(date);
}

export default function LoanForm({ onSuccess }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    memberId: "",
    amount: "",
    termMonths: "12",
    annualInterestRate: "0",
    applicationDate: localDateString(new Date()),
    dueDate: firstDueDate(),
    purpose: "",
  });
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    apiClient.get("/api/members")
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error("The member service returned an invalid list.");
        if (active) setMembers(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.message || loadError.message || "Could not load members.");
      })
      .finally(() => { if (active) setLoadingMembers(false); });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => {
    const principal = Number(form.amount) || 0;
    const months = Number(form.termMonths) || 0;
    const rate = Number(form.annualInterestRate) || 0;
    const payable = principal + principal * rate / 100 * months / 12;
    return { payable, installment: months > 0 ? payable / months : 0 };
  }, [form.amount, form.termMonths, form.annualInterestRate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const loan = await createLoan({
        ...form,
        memberId: Number(form.memberId),
        amount: Number(form.amount),
        termMonths: Number(form.termMonths),
        annualInterestRate: Number(form.annualInterestRate),
      });
      setSuccess(`Application ${loan.loanNo} was saved and is awaiting approval.`);
      window.dispatchEvent(new Event("dataUpdated"));
      if (onSuccess) onSuccess();
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || "Could not save the loan application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 font-sans">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-xs font-bold text-slate-700">
              Member *
              <select required value={form.memberId} onChange={(event) => setForm((current) => ({ ...current, memberId: event.target.value }))} disabled={loadingMembers} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800">
                <option value="">{loadingMembers ? "Loading members…" : "Select member"}</option>
                {members.map((member) => <option key={member.id} value={member.id}>{member.fullName || `Member ${member.id}`} · {member.loginId || member.id}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Loan principal (₹) *
              <input required type="number" min="1" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-800" />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Repayment term (months) *
              <input required type="number" min="1" max="600" step="1" value={form.termMonths} onChange={(event) => setForm((current) => ({ ...current, termMonths: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-800" />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Annual simple interest (%)
              <input required type="number" min="0" max="100" step="0.01" value={form.annualInterestRate} onChange={(event) => setForm((current) => ({ ...current, annualInterestRate: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-800" />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Application date *
              <input required type="date" value={form.applicationDate} onChange={(event) => setForm((current) => ({ ...current, applicationDate: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-800" />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              First installment due *
              <input required type="date" min={form.applicationDate} value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-800" />
            </label>
            <label className="block text-xs font-bold text-slate-700 sm:col-span-2 lg:col-span-3">
              Purpose / notes
              <textarea maxLength="500" value={form.purpose} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value }))} rows="3" className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800" />
            </label>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 p-4 text-xs">
          <div><span className="block text-teal-800">Estimated total repayment</span><strong className="text-base font-black text-[#102a43]">{money(totals.payable)}</strong></div>
          <div><span className="block text-teal-800">Estimated monthly installment</span><strong className="text-base font-black text-[#102a43]">{money(totals.installment)}</strong></div>
          <p className="m-0 max-w-sm text-[10px] leading-4 text-slate-600">Estimate uses simple interest. The rate is 0% by default; confirm the loan terms with the member before approval.</p>
        </div>
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button type="submit" disabled={submitting || loadingMembers || !members.length} className="rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Saving application…" : "Submit loan application"}
          </button>
        </div>
      </form>
    </div>
  );
}
