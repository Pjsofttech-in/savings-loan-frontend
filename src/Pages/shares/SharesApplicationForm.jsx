// src/Pages/shares/SharesApplicationForm.jsx

import { useState, useEffect } from "react";
import { FormField, SelectField, FormSection } from "../registration/RegistrationFields";
import { formatIndianCurrency } from "../../utils/formHelpers";
import { getRegistrationSettings } from "../../services/settingsService";
import { fetchMemberById } from "../../services/memberService";
import { createShareAllocation } from "../../services/shareService";

export default function SharesApplicationForm() {
  const [registrationSettings, setRegistrationSettings] = useState(getRegistrationSettings);
  
  // Dynamic bank accounts list from settings service
  const [bankAccounts, setBankAccounts] = useState(() => {
    const s = getRegistrationSettings();
    if (s?.bankAccounts && s.bankAccounts.length > 0) return s.bankAccounts;
    if (s?.bankAccount) return [s.bankAccount];
    return [
      { id: 1, bankName: "SBI", accountNumber: "123456789", accountType: "Current Account", ifsc: "SBIN0003455" },
      { id: 2, bankName: "HDFC Bank", accountNumber: "987654321", accountType: "Savings Account", ifsc: "HDFC0001234" }
    ];
  });

  // Listen for real-time settings updates from the Settings page
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const s = getRegistrationSettings();
      setRegistrationSettings(s);
      if (s?.bankAccounts && s.bankAccounts.length > 0) {
        setBankAccounts(s.bankAccounts);
      } else if (s?.bankAccount) {
        setBankAccounts([s.bankAccount]);
      }
    };

    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () => window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

  const [form, setForm] = useState({
    folioNumber: "",
    applicationDate: new Date().toISOString().split('T')[0],
    shareType: registrationSettings.shareTypes?.[0] || "Equity",
    numberOfShares: "",
    faceValue: "",
    paymentStatus: "Complete",
    dueDate: "",
    paymentMode: "Bank Transfer",
    referenceNumber: "",
    sourceBank: "", 
    destinationBank: bankAccounts[0]?.bankName || "SBI", // Receiver Bank
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
    
    if (form.paymentStatus === "Pending" && !form.dueDate) {
      newErrors.dueDate = "Due date is required for pending payments.";
    }

    if (form.paymentMode !== "Cash" && !form.referenceNumber) {
      newErrors.referenceNumber = "Transaction ID / Reference number is required for non-cash payments.";
    }
    if (!form.faceValue || Number(form.faceValue) <= 0) {
      newErrors.faceValue = "Valid face value is required.";
    }
    if (!form.sourceBank) {
      newErrors.sourceBank = "Payer's bank is required.";
    }
    if (!form.destinationBank) {
      newErrors.destinationBank = "Receiving bank is required.";
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
        destinationBank: form.destinationBank,
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
              options={registrationSettings.shareTypes || ["Equity"]}
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

        {/* Section 2: Settlement Information & Exact Sequence */}
        <FormSection id="settlement-details" number="2" title="Payment Status &amp; Settlement" active={true}>
          <div className="mb-5 pb-4 border-b border-slate-200">
            <p className="text-slate-500 text-[13px]">Configure payment status, due date parameters, and settlement modes.</p>
          </div>

          {/* PAYMENT & BANK ROUTING SECTION (Sequence: 1. Fee Box, 2. Payment Status, 3. Payment Mode, 4. Receiver Bank) */}
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider">🏦 Fund Routing &amp; Payment Details</span>
              <span className="text-[10px] font-bold text-slate-500">Linked to Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* 1. Total Share Amount / Fee Box (First) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col justify-center">
                <span className="text-[9px] font-bold text-blue-700 uppercase">1. Total Share Amount</span>
                <span className="text-sm font-extrabold text-blue-900">{formatIndianCurrency(totalShareAmount)}</span>
              </div>

              {/* 2. Payment Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">2. Payment Status *</label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => updateField("paymentStatus", e.target.value)}
                  className="w-full h-9 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white font-bold text-slate-800"
                  required
                >
                  <option value="Complete">Complete</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              {/* 3. Payment Mode */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">3. Payment Mode *</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => updateField("paymentMode", e.target.value)}
                  className="w-full h-9 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white font-bold text-slate-800"
                  required
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* 4. Receiver Bank Account (Destination Bank) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">4. Receiver Bank *</label>
                <select
                  value={form.destinationBank}
                  onChange={(e) => updateField("destinationBank", e.target.value)}
                  className="w-full h-9 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white font-bold text-slate-800"
                  required
                >
                  <option value="">-- Choose Bank --</option>
                  {bankAccounts.map((acc, idx) => (
                    <option key={acc.id || idx} value={acc.bankName ? `${acc.bankName} (${acc.accountType || "Account"} - ${acc.accountNumber})` : acc}>
                      {acc.bankName ? `${acc.bankName} (${acc.accountType || "Account"} - ${acc.accountNumber})` : acc}
                    </option>
                  ))}
                </select>
                {errors.destinationBank && <p className="text-red-600 text-[10px] mt-1">{errors.destinationBank}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {form.paymentStatus === "Pending" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => updateField("dueDate", e.target.value)}
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white"
                    required
                  />
                  {errors.dueDate && <p className="text-red-600 text-[10px] mt-1">{errors.dueDate}</p>}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payer's Bank (Source From) *</label>
                <input
                  type="text"
                  value={form.sourceBank}
                  onChange={(e) => updateField("sourceBank", e.target.value)}
                  placeholder="e.g. HDFC / SBI / GPay"
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white"
                  required
                />
                {errors.sourceBank && <p className="text-red-600 text-[10px] mt-1">{errors.sourceBank}</p>}
              </div>

              {form.paymentMode !== "Cash" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction ID / UTR *</label>
                  <input
                    type="text"
                    value={form.referenceNumber}
                    onChange={(e) => updateField("referenceNumber", e.target.value)}
                    placeholder="Enter Transaction ID"
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white"
                    required
                  />
                  {errors.referenceNumber && <p className="text-red-600 text-[10px] mt-1">{errors.referenceNumber}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            {submissionError && (
              <p className="mr-auto self-center text-red-600 text-xs" role="alert">{submissionError}</p>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isLookingUpMember}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow-sm transition cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Submit Shares Application"}
            </button>
          </div>
        </FormSection>

      </form>
    </div>
  );
}
