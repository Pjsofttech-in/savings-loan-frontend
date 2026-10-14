// src/Pages/shares/SharesApplicationForm.jsx

import { useState } from "react";
import { FormField, SelectField, FormSection } from "../registration/RegistrationFields";
import { formatIndianCurrency } from "../../utils/formHelpers";
import { getRegistrationSettings } from "../../services/settingsService";
import { fetchMemberById } from "../../services/memberService";
import { createShareAllocation } from "../../services/shareService";

export default function SharesApplicationForm() {
  const [registrationSettings] = useState(getRegistrationSettings);
  
  // Bank account settings from settings service
  const bankAccountSettings = registrationSettings.bankAccount || {
    bankName: "Primary Bank (Not Configured)",
    accountNumber: "-",
    ifscCode: "-",
    branchName: "-",
    accountHolderName: "-",
    accountType: "Current Account"
  };

  const [form, setForm] = useState({
    folioNumber: "",
    applicationDate: new Date().toISOString().split('T')[0],
    shareType: registrationSettings.shareTypes[0] || "",
    numberOfShares: "",
    faceValue: "",
    paymentStatus: "Complete",
    dueDate: "",
    paymentMode: "Bank Transfer",
    referenceNumber: "",
    sourceBank: "", // Added: Payer's bank tracking
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLookingUpMember, setIsLookingUpMember] = useState(false);
  const [memberLookupError, setMemberLookupError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [allocationId, setAllocationId] = useState(null);

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

  const lookupMember = async (memberId) => {
    const normalizedId = memberId.trim();
    setMemberLookupError("");
    if (!normalizedId) {
      setSelectedMember(null);
      return;
    }
    if (!/^\d+$/.test(normalizedId)) {
      setSelectedMember(null);
      setMemberLookupError("Enter a numeric member user ID.");
      return;
    }

    setIsLookingUpMember(true);
    try {
      const member = await fetchMemberById(normalizedId);
      setSelectedMember(member);
      updateField("folioNumber", String(member.id));
    } catch (error) {
      setSelectedMember(null);
      setMemberLookupError(error.message);
    } finally {
      setIsLookingUpMember(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!selectedMember) newErrors.folioNumber = "Enter a valid member user ID.";
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
    if (!form.faceValue || Number(form.faceValue) <= 0) {
      newErrors.faceValue = "Valid face value is required.";
    }
    if (!form.sourceBank) {
      newErrors.sourceBank = "Payer's bank is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError("");
    try {
      const savedAllocation = await createShareAllocation({
        memberId: selectedMember.id,
        applicationDate: form.applicationDate,
        shareType: form.shareType,
        numberOfShares: Number(form.numberOfShares),
        faceValue: Number(form.faceValue),
        paymentStatus: form.paymentStatus,
        dueDate: form.dueDate || null,
        paymentMode: form.paymentMode,
        referenceNumber: form.referenceNumber,
        sourceBank: form.sourceBank,
        destinationBank: `${bankAccountSettings.bankName} (${bankAccountSettings.accountNumber})`,
      });
      setAllocationId(savedAllocation.id);
      setIsSubmitted(true);
    } catch (error) {
      setSubmissionError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="shares-form-content max-w-[1400px] mx-auto p-6 lg:p-8 font-sans">

      {isSubmitted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm font-bold flex items-center justify-between">
          <span>✓ Share allocation #{allocationId} saved successfully.</span>
          <button onClick={() => setIsSubmitted(false)} className="text-xs underline text-emerald-700 cursor-pointer">Submit Another</button>
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
              label="Member User ID"
              type="number"
              value={form.folioNumber}
              onChange={(val) => {
                updateField("folioNumber", val);
                setSelectedMember(null);
                setMemberLookupError("");
              }}
              onBlur={lookupMember}
              error={errors.folioNumber}
              required
              min="1"
              step="1"
              inputMode="numeric"
              placeholder="Enter generated user ID"
            />

            <FormField
              id="member-name"
              label="Member Name"
              value={selectedMember?.fullName || ""}
              readOnly
              placeholder={isLookingUpMember ? "Loading member..." : "Fetched by user ID"}
            />

            <FormField
              id="member-mobile"
              label="Mobile Number"
              value={selectedMember?.mobile || ""}
              readOnly
              placeholder="Fetched by user ID"
            />

            <FormField
              id="member-email"
              label="Email Address"
              value={selectedMember?.email || ""}
              readOnly
              placeholder="Fetched by user ID"
            />

            <FormField
              id="member-type"
              label="Member Type"
              value={selectedMember?.memberType || ""}
              readOnly
              placeholder="Fetched by user ID"
            />

            <FormField
              id="member-year"
              label="Membership Year"
              value={selectedMember?.membershipYear || ""}
              readOnly
              placeholder="Fetched by user ID"
            />

            {memberLookupError && (
              <p className="col-span-full text-red-600 text-xs" role="alert">{memberLookupError}</p>
            )}

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
              options={registrationSettings.shareTypes}
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

          {/* Bank Routing & Fund Flow Card */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider">🏦 Fund Routing &amp; Bank Tracking</span>
              <span className="text-[10px] font-bold text-slate-500">Linked to Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Receiving Bank (Destination) */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Receiving Bank (Inflow To)</span>
                <strong className="text-xs text-[#102a43] block">{bankAccountSettings.bankName} ({bankAccountSettings.accountType})</strong>
                <span className="text-[11px] font-mono text-teal-700 block mt-0.5">A/c: {bankAccountSettings.accountNumber} | IFSC: {bankAccountSettings.ifscCode}</span>
              </div>

              {/* Source Bank */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-center">
                <label htmlFor="source-bank-input" className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payer's Bank (Source From) *</label>
                <input
                  id="source-bank-input"
                  type="text"
                  value={form.sourceBank}
                  onChange={(e) => updateField("sourceBank", e.target.value)}
                  placeholder="e.g. HDFC / SBI / GPay"
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white"
                  required
                />
                {errors.sourceBank && <p className="text-red-600 text-[10px] mt-1">{errors.sourceBank}</p>}
              </div>

              {/* Status */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-teal-800 uppercase">Routing Verified</span>
                <span className="text-xs font-bold text-teal-900 mt-0.5">Ready for Share Allocation</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
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
            {submissionError && (
              <p className="mr-auto self-center text-red-600 text-xs" role="alert">{submissionError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isLookingUpMember}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow-sm transition"
            >
              {isSubmitting ? "Saving..." : "Submit Shares Application"}
            </button>
          </div>
        </FormSection>

      </form>
    </div>
  );
}