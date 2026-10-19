// src/Pages/registration/RegistrationForm.jsx
import { useState, useEffect } from "react";
import { FormField, SelectField, FormSection } from "./RegistrationFields";
import { completeMemberRegistration } from "../../services/paymentService";
import { getRegistrationSettings } from "../../services/settingsService";

const OCCUPATIONS = [
  "Farmer", "Student", "Unemployed", "Business Man", "Govt. Employee", "Private Employee"
];

const NOMINEE_RELATIONS = [
  "Father", "Mother", "Brother", "Sister", "Son", "Daughter", "Husband", "Wife", "Grandfather", "Grandmother", "Grandson", "Granddaughter", "Uncle", "Aunt"
];

const PAYMENT_STATUS_OPTIONS = ["Complete", "Pending", "Failed", "Partially Paid"];
const PAYMENT_MODES = ["Bank Transfer", "Monthly Fee", "UPI / Online", "Cash", "Cheque"];

const ID_DOCUMENT_OPTIONS = [
  "Aadhaar Card", "PAN Card", "Driving License", "Voter ID Card", "Passport", "Other Government ID"
];

export default function RegistrationForm() {
  const [registrationSettings, setRegistrationSettings] = useState(getRegistrationSettings);
  
  // Dynamic fee states
  const [adminRegistrationFee, setAdminRegistrationFee] = useState(() => {
    const s = getRegistrationSettings();
    return s?.amount || s?.fee || 500;
  });

  const [monthlyContribution, setMonthlyContribution] = useState(() => {
    const s = getRegistrationSettings();
    return s?.monthlyFee || 1000;
  });

  // Dynamic bank accounts list from settings service
  const [bankAccounts, setBankAccounts] = useState(() => {
    const s = getRegistrationSettings();
    if (s?.bankAccounts && s.bankAccounts.length > 0) return s.bankAccounts;
    if (s?.bankAccount) return [s.bankAccount];
    return [
      { id: 1, bankName: "SBI", accountNumber: "123456789", accountType: "Current Account" },
      { id: 2, bankName: "HDFC Bank", accountNumber: "987654321", accountType: "Savings Account" }
    ];
  });

  // Listen for real-time settings updates from the Settings page
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const s = getRegistrationSettings();
      setRegistrationSettings(s);
      if (s?.amount || s?.fee) setAdminRegistrationFee(s.amount || s.fee);
      if (s?.monthlyFee) setMonthlyContribution(s.monthlyFee);
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
    personal: {
      fullName: "", fatherName: "", dob: "", gender: "", occupation: OCCUPATIONS[0],
      memberType: registrationSettings.memberTypes?.[0] || "", membershipYear: registrationSettings.years?.[0] || "",
      mobile: "", email: "", password: "", 
      paymentStatus: PAYMENT_STATUS_OPTIONS[0],
      paymentMode: PAYMENT_MODES[0],
      transactionId: "",
      sourceBank: "", 
      destinationBank: bankAccounts[0]?.bankName || "SBI", 
      nomineeName: "", nomineeRelationship: NOMINEE_RELATIONS[0], nomineeMobile: "",
    },
    address: { street: "", country: "India", state: "", district: "", taluka: "", city: "", pincode: "" },
    witness: {
      witnessName: "",
      witnessMemberNo: "",
      witnessPhone: "",
      witnessEmail: "",
      witnessIdProofType: ID_DOCUMENT_OPTIONS[0],
    }
  });

  const [documentType, setDocumentType] = useState("Aadhaar Card");
  const [documentFile, setDocumentFile] = useState(null);
  const [witnessDocFile, setWitnessDocFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePincodeChange = async (pincodeValue) => {
    updateField("address", "pincode", pincodeValue);
    if (pincodeValue && pincodeValue.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`);
        const data = await response.json();
        if (data && data[0]?.Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          updateField("address", "district", postOffice.District || "");
          updateField("address", "state", postOffice.State || "");
          updateField("address", "taluka", postOffice.Block || postOffice.Taluk || postOffice.Division || "");
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.personal.fullName) newErrors.fullName = "Full name required.";
    if (!form.personal.mobile) newErrors.mobile = "Mobile required.";
    if (!form.address.pincode) newErrors.pincode = "Pincode required.";
    if (!form.personal.nomineeName) newErrors.nomineeName = "Nominee required.";
    if (!form.personal.password || form.personal.password.length < 8) newErrors.password = "Min 8 chars required.";
    if (!documentFile) newErrors.document = "Document required.";
    if (!form.witness.witnessName) newErrors.witnessName = "Witness required.";
    if (!form.witness.witnessMemberNo) newErrors.witnessMemberNo = "Witness ID required.";
    if (!witnessDocFile) newErrors.witnessDoc = "Witness doc required.";
    if (!form.personal.destinationBank) newErrors.destinationBank = "Receiving bank required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmissionError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(form.personal).forEach(([key, val]) => formData.append(key, val));
      Object.entries(form.address).forEach(([key, val]) => formData.append(key, val));
      Object.entries(form.witness).forEach(([key, val]) => formData.append(key, val));

      formData.append("registrationFee", adminRegistrationFee);
      formData.append("monthlyFee", monthlyContribution);
      formData.append("documentType", documentType);
      formData.append("joiningDate", new Date().toISOString().slice(0, 10));
      formData.append("destinationBank", form.personal.destinationBank);
      formData.append("sourceBank", form.personal.sourceBank);

      if (documentFile) formData.append("document", documentFile);
      if (witnessDocFile) formData.append("witnessDocument", witnessDocFile);

      await completeMemberRegistration(formData);
      setIsSubmitted(true);
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (error) {
      setSubmissionError(error.message || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-form-content max-w-[1300px] mx-auto font-sans text-xs">
      {isSubmitted && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-bold flex items-center justify-between">
          <span>✓ Member registration completed successfully!</span>
          <button onClick={() => setIsSubmitted(false)} className="underline text-emerald-700 cursor-pointer">Register Another</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Section 1: Personal Details */}
        <FormSection id="personal-details" number="1" title="Member Personal Details" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <FormField id="full-name" label="Full Name *" value={form.personal.fullName} onChange={(val) => updateField("personal", "fullName", val)} error={errors.fullName} placeholder="Full name" required />
            <FormField id="father-name" label="Father's Name" value={form.personal.fatherName} onChange={(val) => updateField("personal", "fatherName", val)} placeholder="Father's name" />
            <FormField id="dob" label="DOB" type="date" value={form.personal.dob} onChange={(val) => updateField("personal", "dob", val)} />
            <SelectField id="gender" label="Gender" value={form.personal.gender} onChange={(val) => updateField("personal", "gender", val)} options={["Male", "Female", "Other"]} />
            <SelectField id="occupation" label="Occupation *" value={form.personal.occupation} onChange={(val) => updateField("personal", "occupation", val)} options={OCCUPATIONS} required />
            <SelectField id="member-type" label="Member Type" value={form.personal.memberType} onChange={(val) => updateField("personal", "memberType", val)} options={registrationSettings.memberTypes || ["Standard"]} required />
            <SelectField id="membership-year" label="Year" value={form.personal.membershipYear} onChange={(val) => updateField("personal", "membershipYear", val)} options={registrationSettings.years || ["2026"]} required />
            <FormField id="mobile" label="Mobile *" value={form.personal.mobile} onChange={(val) => updateField("personal", "mobile", val)} error={errors.mobile} placeholder="10-digit mobile" required />
            <FormField id="email" label="Email" type="email" value={form.personal.email} onChange={(val) => updateField("personal", "email", val)} placeholder="Email" />
            <FormField id="nominee-name" label="Nominee Name *" value={form.personal.nomineeName} onChange={(val) => updateField("personal", "nomineeName", val)} error={errors.nomineeName} placeholder="Nominee name" required />
            <SelectField id="nominee-relationship" label="Relationship *" value={form.personal.nomineeRelationship} onChange={(val) => updateField("personal", "nomineeRelationship", val)} options={NOMINEE_RELATIONS} required />
            <FormField id="nominee-mobile" label="Nominee Mobile" value={form.personal.nomineeMobile} onChange={(val) => updateField("personal", "nomineeMobile", val)} placeholder="Nominee mobile" required />
            <FormField id="member-password" label="Password *" type="password" value={form.personal.password} onChange={(val) => updateField("personal", "password", val)} error={errors.password} placeholder="Min 8 chars" required />

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-emerald-700 uppercase">Monthly Contribution</span>
              <span className="text-sm font-extrabold text-emerald-900">₹{monthlyContribution}</span>
            </div>
          </div>
        </FormSection>

        {/* Section 2: Address & Document */}
        <FormSection id="residential-address" number="2" title="Address & Document Verification" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <FormField id="pincode" label="Pincode *" maxLength="6" value={form.address.pincode} onChange={(val) => handlePincodeChange(val)} error={errors.pincode} placeholder="PIN" />
            <FormField id="district" label="District" value={form.address.district} onChange={(val) => updateField("address", "district", val)} placeholder="Auto" />
            <FormField id="taluka" label="Taluka" value={form.address.taluka} onChange={(val) => updateField("address", "taluka", val)} placeholder="Auto" />
            <FormField id="state" label="State" value={form.address.state} onChange={(val) => updateField("address", "state", val)} placeholder="Auto" />
            <FormField id="city" label="City" value={form.address.city} onChange={(val) => updateField("address", "city", val)} placeholder="City" />
            <FormField id="street" label="Street" value={form.address.street} onChange={(val) => updateField("address", "street", val)} placeholder="Street" />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <SelectField id="document-type" label="ID Proof Type *" value={documentType} onChange={(val) => setDocumentType(val)} options={ID_DOCUMENT_OPTIONS} required />
            <div>
              <label htmlFor="verification-doc" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Upload {documentType} *</label>
              <input id="verification-doc" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocumentFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 border border-slate-300 rounded-lg p-1 bg-white cursor-pointer" />
              {errors.document && <p className="text-red-500 text-[10px] mt-0.5">{errors.document}</p>}
            </div>
          </div>
        </FormSection>

        {/* Section 3: Witness & Payment Routing (Re-ordered sequence as requested) */}
        <FormSection id="witness-details" number="3" title="Witness Verification & Payment Details" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <FormField id="witness-name" label="Witness Name *" value={form.witness.witnessName} onChange={(val) => updateField("witness", "witnessName", val)} error={errors.witnessName} placeholder="Name" required />
            <FormField id="witness-member-no" label="Witness Member No *" value={form.witness.witnessMemberNo} onChange={(val) => updateField("witness", "witnessMemberNo", val)} error={errors.witnessMemberNo} placeholder="ID" required />
            <FormField id="witness-phone" label="Witness Phone *" value={form.witness.witnessPhone} onChange={(val) => updateField("witness", "witnessPhone", val)} placeholder="Phone" required />
            <FormField id="witness-email" label="Witness Email" type="email" value={form.witness.witnessEmail} onChange={(val) => updateField("witness", "witnessEmail", val)} placeholder="Email" />
            <SelectField id="witness-id-type" label="Witness ID Type *" value={form.witness.witnessIdProofType} onChange={(val) => updateField("witness", "witnessIdProofType", val)} options={ID_DOCUMENT_OPTIONS} required />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div>
              <label htmlFor="witness-doc" className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Upload Witness ID (PDF/Image) *</label>
              <input id="witness-doc" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setWitnessDocFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 border border-slate-300 rounded-lg p-1 bg-white cursor-pointer" />
              {errors.witnessDoc && <p className="text-red-500 text-[10px] mt-0.5">{errors.witnessDoc}</p>}
            </div>
          </div>

          {/* PAYMENT & BANK ROUTING SECTION (Exact Requested Sequence: 1. Fee box, 2. Payment Status, 3. Payment Mode, 4. Receiver Bank) */}
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider">🏦 Fund Routing &amp; Payment Details</span>
              <span className="text-[10px] font-bold text-slate-500">Linked to Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* 1. Registration Fee Box (First) */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col justify-center">
                <span className="text-[9px] font-bold text-blue-700 uppercase">1. Registration Fee</span>
                <span className="text-sm font-extrabold text-blue-900">₹{adminRegistrationFee}</span>
              </div>

              {/* 2. Payment Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">2. Payment Status *</label>
                <select
                  value={form.personal.paymentStatus}
                  onChange={(e) => updateField("personal", "paymentStatus", e.target.value)}
                  className="w-full h-9 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white font-bold text-slate-800"
                  required
                >
                  {PAYMENT_STATUS_OPTIONS.map((status, idx) => (
                    <option key={idx} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* 3. Payment Mode / Method */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">3. Payment Mode *</label>
                <select
                  value={form.personal.paymentMode}
                  onChange={(e) => updateField("personal", "paymentMode", e.target.value)}
                  className="w-full h-9 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white font-bold text-slate-800"
                  required
                >
                  {PAYMENT_MODES.map((mode, idx) => (
                    <option key={idx} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              {/* 4. Receiver Bank Account (Destination Bank) */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">4. Receiver Bank *</label>
                <select
                  value={form.personal.destinationBank}
                  onChange={(e) => updateField("personal", "destinationBank", e.target.value)}
                  className="w-full h-9 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white font-bold text-slate-800"
                  required
                >
                  <option value="">-- Choose Bank --</option>
                  {bankAccounts.map((acc, idx) => (
                    <option key={acc.id || idx} value={acc.bankName || acc}>
                      {acc.bankName ? `${acc.bankName} (${acc.accountType || "Account"} - ${acc.accountNumber})` : acc}
                    </option>
                  ))}
                </select>
                {errors.destinationBank && <p className="text-red-500 text-[10px] mt-0.5">{errors.destinationBank}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Payer's Bank (Source From)</label>
                <input
                  type="text"
                  value={form.personal.sourceBank}
                  onChange={(e) => updateField("personal", "sourceBank", e.target.value)}
                  placeholder="e.g. HDFC / SBI / GPay / PhonePe"
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction ID / UTR</label>
                <input
                  type="text"
                  value={form.personal.transactionId}
                  onChange={(e) => updateField("personal", "transactionId", e.target.value)}
                  placeholder="Enter Bank UTR / Transaction Reference"
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs outline-none focus:border-teal-600 bg-white"
                />
              </div>
            </div>
          </div>

          {submissionError && (
            <div role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-2">{submissionError}</div>
          )}

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-200">
            <button type="submit" disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm">
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}