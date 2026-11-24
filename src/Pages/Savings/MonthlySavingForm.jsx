// src/Pages/savings/MonthlySavingForm.jsx
import { useState } from "react";
import { FormField, SelectField, FormSection } from "../registration/RegistrationFields";
import apiClient from "../../services/apiClient";

const PAYMENT_STATUS_OPTIONS = ["Complete", "Pending", "Failed", "Partially Paid"];
const PAYMENT_MODES = ["Cash", "UPI / Online", "Bank Transfer", "Cheque"];

export default function MonthlySavingForm() {
  const [form, setForm] = useState({
    memberId: "",
    numberOfMembers: "1",
    year: "2026",
    month: "October",
    amountMonthly: "",
    paymentStatus: PAYMENT_STATUS_OPTIONS[0],
    paymentMode: PAYMENT_MODES[0],
    sourceBank: "",
    transactionId: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [submitError, setSubmitError] = useState("");

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const numberOfMembers = Number(form.numberOfMembers);
    const amountMonthly = Number(form.amountMonthly);
    if (!form.memberId.trim()) newErrors.memberId = "Member ID is required.";
    if (!Number.isInteger(numberOfMembers) || numberOfMembers <= 0) newErrors.numberOfMembers = "Enter a positive whole number.";
    if (!Number.isFinite(amountMonthly) || amountMonthly <= 0) newErrors.amountMonthly = "Enter an amount greater than zero.";
    if (!form.paymentStatus) newErrors.paymentStatus = "Payment status is required.";
    if (!form.paymentMode) newErrors.paymentMode = "Payment mode is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await apiClient.post("/api/savings", {
        memberId: form.memberId.trim(),
        numberOfMembers,
        year: form.year,
        month: form.month,
        amountMonthly,
        paymentStatus: form.paymentStatus,
        paymentMode: form.paymentMode,
        sourceBank: form.sourceBank.trim(),
        transactionId: form.transactionId.trim(),
      });
      setSavingId(response.data.id);
      setIsSubmitted(true);
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (error) {
      const message = error.response?.data?.message
        || (typeof error.response?.data === "string" ? error.response.data : "")
        || error.message
        || "Could not save this monthly saving.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto font-sans space-y-3">
      {isSubmitted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm font-bold flex items-center justify-between">
          <span>✓ Monthly saving saved successfully. Reference ID: SAV-{savingId}</span>
          <button type="button" onClick={() => { setIsSubmitted(false); setForm((previous) => ({ ...previous, memberId: "", amountMonthly: "", sourceBank: "", transactionId: "" })); }} className="text-xs underline text-emerald-700 cursor-pointer">Register Another Entry</button>
        </div>
      )}
      {submitError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          Monthly saving was not saved: {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection id="saving-info" number="1" title="Saving Contribution Details" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <FormField
              id="member-id"
              label="Member ID *"
              value={form.memberId}
              onChange={(val) => updateField("memberId", val)}
              error={errors.memberId}
              placeholder="e.g. MEM-1001"
              required
            />
            <FormField
              id="no-of-members"
              label="No. of Members *"
              type="number"
              value={form.numberOfMembers}
              onChange={(val) => updateField("numberOfMembers", val)}
              error={errors.numberOfMembers}
              placeholder="1"
              required
            />
            <SelectField
              id="year"
              label="Year *"
              value={form.year}
              onChange={(val) => updateField("year", val)}
              options={["2024", "2025", "2026", "2027"]}
              required
            />
            <SelectField
              id="month"
              label="Month *"
              value={form.month}
              onChange={(val) => updateField("month", val)}
              options={["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]}
              required
            />
            <FormField
              id="amount-monthly"
              label="Amount Monthly (₹) *"
              type="number"
              value={form.amountMonthly}
              onChange={(val) => updateField("amountMonthly", val)}
              error={errors.amountMonthly}
              placeholder="e.g. 5000"
              required
            />
            <SelectField
              id="payment-status"
              label="Payment Status *"
              value={form.paymentStatus}
              onChange={(val) => updateField("paymentStatus", val)}
              options={PAYMENT_STATUS_OPTIONS}
              required
            />
            <SelectField
              id="payment-mode"
              label="Payment Mode *"
              value={form.paymentMode}
              onChange={(val) => updateField("paymentMode", val)}
              options={PAYMENT_MODES}
              required
            />
            <FormField
              id="source-bank"
              label="Payment Bank (Source)"
              value={form.sourceBank}
              onChange={(val) => updateField("sourceBank", val)}
              placeholder="e.g. SBI / HDFC / GPay"
            />
            <FormField
              id="transaction-id"
              label="Transaction ID / UTR"
              value={form.transactionId}
              onChange={(val) => updateField("transactionId", val)}
              placeholder="Enter UTR / Ref No."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Processing..." : "Register Monthly Saving"}
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}
