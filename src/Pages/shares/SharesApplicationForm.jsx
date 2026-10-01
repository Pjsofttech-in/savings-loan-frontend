// src/Pages/shares/SharesApplicationForm.jsx

import { useState } from "react";
import { FormField, SelectField, FormSection } from "../registration/RegistrationFields";
import { formatIndianCurrency } from "../../utils/formHelpers";

export default function SharesApplicationForm() {
  const [form, setForm] = useState({
    folioNumber: "",
    applicationDate: new Date().toISOString().split('T')[0],
    shareType: "Ordinary Shares",
    numberOfShares: "",
    faceValue: "1000.00",
    paymentStatus: "Complete",
    dueDate: "",
    paymentMode: "Bank Transfer",
    referenceNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const totalShareAmount = (Number(form.numberOfShares) || 0) * (Number(form.faceValue) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.folioNumber) newErrors.folioNumber = "Folio number is required.";
    if (!form.applicationDate) newErrors.applicationDate = "Date is required.";
    if (!form.numberOfShares || Number(form.numberOfShares) <= 0) newErrors.numberOfShares = "Valid number of shares required.";
    
    // Conditional validation for Due Date when Pending
    if (form.paymentStatus === "Pending" && !form.dueDate) {
      newErrors.dueDate = "Due date is required for pending payments.";
    }

    // Conditional validation for Transaction ID (unless payment mode is Cash)
    if (form.paymentMode !== "Cash" && !form.referenceNumber) {
      newErrors.referenceNumber = "Transaction ID / Reference number is required for non-cash payments.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8 font-sans">
      <div className="mb-6 pb-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Financial Workflow</span>
          <h1 className="text-2xl font-extrabold text-[#102a43] m-0">Shares Application Form</h1>
          <p className="text-slate-500 text-xs mt-1">Allocate new shares, track settlement methods, and record member capital.</p>
        </div>
      </div>

      {isSubmitted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm font-bold flex items-center justify-between">
          <span>✓ Shares application submitted and recorded successfully!</span>
          <button onClick={() => setIsSubmitted(false)} className="text-xs underline text-emerald-700">Submit Another</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Allotment Details */}
        <FormSection id="allotment-details" number="1" title="Share Allotment Details" active={true}>
          <div className="mb-5 pb-4 border-b border-slate-200">
            <p className="text-slate-500 text-[13px]">Enter member folio details and share quantity parameters.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField
              id="folio-number"
              label="Folio / Member ID"
              value={form.folioNumber}
              onChange={(val) => updateField("folioNumber", val)}
              error={errors.folioNumber}
              required
              placeholder="e.g. FOLIO-2026-001"
            />

            <FormField
              id="application-date"
              label="Application Date"
              type="date"
              value={form.applicationDate}
              onChange={(val) => updateField("applicationDate", val)}
              error={errors.applicationDate}
              required
            />

            <SelectField
              id="share-type"
              label="Share Category"
              value={form.shareType}
              onChange={(val) => updateField("shareType", val)}
              error={errors.shareType}
              options={["Ordinary Shares", "Preference Shares", "Founder Shares"]}
              required
            />

            <FormField
              id="number-of-shares"
              label="Number of Shares"
              type="number"
              value={form.numberOfShares}
              onChange={(val) => updateField("numberOfShares", val)}
              error={errors.numberOfShares}
              required
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Enter quantity"
            />

            <FormField
              id="face-value"
              label="Face Value Per Share"
              type="number"
              value={form.faceValue}
              onChange={(val) => updateField("faceValue", val)}
              error={errors.faceValue}
              required
              min="1"
              step="0.01"
              inputMode="decimal"
              placeholder="₹ 0.00"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div>
              <span className="text-slate-500 text-[12px] block">Total Payable Amount</span>
              <strong className="text-[#102a43] text-[20px] font-bold">
                {formatIndianCurrency(totalShareAmount)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 text-[12px] block">Shares Requested</span>
              <strong className="text-[#102a43] text-[20px] font-bold">
                {form.numberOfShares || 0}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 text-[12px] block">Category</span>
              <strong className="text-[#102a43] text-[20px] font-bold">
                {form.shareType}
              </strong>
            </div>
          </div>
        </FormSection>

        {/* Section 2: Settlement Information */}
        <FormSection id="settlement-details" number="2" title="Payment Status &amp; Settlement" active={true}>
          <div className="mb-5 pb-4 border-b border-slate-200">
            <p className="text-slate-500 text-[13px]">Configure payment status, due date parameters, and settlement modes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <SelectField
              id="payment-status"
              label="Payment Status"
              value={form.paymentStatus}
              onChange={(val) => updateField("paymentStatus", val)}
              error={errors.paymentStatus}
              options={["Complete", "Pending", "Refunded"]}
              required
            />

            {/* Conditionally rendered Due Date field if Pending is selected */}
            {form.paymentStatus === "Pending" && (
              <FormField
                id="due-date"
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={(val) => updateField("dueDate", val)}
                error={errors.dueDate}
                required
              />
            )}

            <SelectField
              id="payment-mode"
              label="Mode of Payment"
              value={form.paymentMode}
              onChange={(val) => updateField("paymentMode", val)}
              error={errors.paymentMode}
              options={["Cash", "UPI", "Bank Transfer", "Cheque"]}
              required
            />

            {/* Transaction ID required for everything except Cash */}
            {form.paymentMode !== "Cash" && (
              <FormField
                id="reference-number"
                label="Transaction ID / UTR"
                value={form.referenceNumber}
                onChange={(val) => updateField("referenceNumber", val)}
                error={errors.referenceNumber}
                required
                placeholder="Enter Transaction ID"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow-sm transition"
            >
              Submit Shares Application
            </button>
          </div>
        </FormSection>

      </form>
    </div>
  );
}