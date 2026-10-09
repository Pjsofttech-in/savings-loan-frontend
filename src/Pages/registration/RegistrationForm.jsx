// src/Pages/registration/RegistrationForm.jsx
import { useState } from "react";
import { FormField, SelectField, FormSection } from "./RegistrationFields";
import { completeMemberRegistration } from "../../services/paymentService";
import { getRegistrationSettings } from "../../services/settingsService";

const OCCUPATIONS = [
  "Farmer", "Student", "Unemployed", "Business Man", "Govt. Employee", "Private Employee"
];

const NOMINEE_RELATIONS = [
  "Father", "Mother", "Brother", "Sister", "Son", "Daughter", "Husband", "Wife", "Grandfather", "Grandmother", "Grandson", "Granddaughter", "Uncle", "Aunt"
];

export default function RegistrationForm() {
  const [registrationSettings] = useState(getRegistrationSettings);
  const [form, setForm] = useState({
    personal: {
      fullName: "", fatherName: "", dob: "", gender: "", occupation: OCCUPATIONS[0],
      memberType: registrationSettings.memberTypes[0] || "", membershipYear: registrationSettings.years[0] || "",
      mobile: "", email: "", password: "", nomineeName: "", nomineeRelationship: NOMINEE_RELATIONS[0], nomineeMobile: "",
    },
    address: { street: "", country: "India", state: "", district: "", taluka: "", city: "", pincode: "" },
  });

  const [documentType, setDocumentType] = useState("Aadhaar Card");
  const [documentFile, setDocumentFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const documentOptions = ["Aadhaar Card", "PAN Card", "Driving License", "Voter ID Card", "Passport", "Other Government ID"];

  const updateField = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      if (errors.document) setErrors((prev) => ({ ...prev, document: null }));
    }
  };

  const handlePincodeChange = async (pincodeValue) => {
    updateField("address", "pincode", pincodeValue);
    if (pincodeValue && pincodeValue.length === 6) {
      setLoadingLocation(true);
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
        console.error("Error fetching location data from pincode:", error);
      } finally {
        setLoadingLocation(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.personal.fullName) newErrors.fullName = "Full name is required.";
    if (!form.personal.mobile) newErrors.mobile = "Mobile number is required.";
    if (!form.address.pincode) newErrors.pincode = "Pincode is required.";
    if (!form.personal.nomineeName) newErrors.nomineeName = "Nominee name is required.";
    if (!form.personal.nomineeRelationship) newErrors.nomineeRelationship = "Nominee relationship is required.";
    if (!form.personal.nomineeMobile) newErrors.nomineeMobile = "Nominee mobile number is required.";
    if (form.personal.password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (!documentFile) newErrors.document = "Verification document file is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmissionError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("fullName", form.personal.fullName);
      formData.append("fatherName", form.personal.fatherName);
      formData.append("dob", form.personal.dob);
      formData.append("gender", form.personal.gender);
      formData.append("email", form.personal.email);
      formData.append("mobile", form.personal.mobile);
      formData.append("occupation", form.personal.occupation);
      formData.append("memberType", form.personal.memberType);
      formData.append("membershipYear", form.personal.membershipYear);
      formData.append("city", form.address.city);
      formData.append("joiningDate", new Date().toISOString().slice(0, 10));
      formData.append(
        "address",
        [form.address.street, form.address.city, form.address.taluka, form.address.district, form.address.state, form.address.pincode].filter(Boolean).join(", ")
      );
      formData.append("password", form.personal.password);
      formData.append("nomineeName", form.personal.nomineeName);
      formData.append("nomineeRelationship", form.personal.nomineeRelationship);
      formData.append("nomineeMobile", form.personal.nomineeMobile);
      formData.append("documentType", documentType);
      
      if (documentFile) formData.append("document", documentFile);

      await completeMemberRegistration(formData);
      setIsSubmitted(true);

      // Dispatch live update event so dashboard charts instantly reflect change on submit
      window.dispatchEvent(new Event("dataUpdated"));
    } catch (error) {
      setSubmissionError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-form-content max-w-[1400px] mx-auto font-sans">
      {isSubmitted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm font-bold flex items-center justify-between">
          <span>✓ Member registration completed successfully! Dashboard metrics updated.</span>
          <button onClick={() => setIsSubmitted(false)} className="text-xs underline text-emerald-700">Register Another</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormSection id="personal-details" number="1" title="Member Personal Details" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField id="full-name" label="Full Name *" value={form.personal.fullName} onChange={(val) => updateField("personal", "fullName", val)} error={errors.fullName} placeholder="Enter full name" required />
            <FormField id="father-name" label="Father's / Spouse's Name" value={form.personal.fatherName} onChange={(val) => updateField("personal", "fatherName", val)} placeholder="Enter father's name" />
            <FormField id="dob" label="Date of Birth" type="date" value={form.personal.dob} onChange={(val) => updateField("personal", "dob", val)} />
            <SelectField id="gender" label="Gender" value={form.personal.gender} onChange={(val) => updateField("personal", "gender", val)} options={["Male", "Female", "Other"]} />
            <SelectField id="occupation" label="Occupation *" value={form.personal.occupation} onChange={(val) => updateField("personal", "occupation", val)} options={OCCUPATIONS} required />
            <SelectField id="member-type" label="Type of Member" value={form.personal.memberType} onChange={(val) => updateField("personal", "memberType", val)} options={registrationSettings.memberTypes} required />
            <SelectField id="membership-year" label="Membership Year" value={form.personal.membershipYear} onChange={(val) => updateField("personal", "membershipYear", val)} options={registrationSettings.years} required />
            <FormField id="mobile" label="Mobile Number *" value={form.personal.mobile} onChange={(val) => updateField("personal", "mobile", val)} error={errors.mobile} placeholder="10-digit mobile" pattern="[0-9]{10}" required />
            <FormField id="email" label="Email Address" type="email" value={form.personal.email} onChange={(val) => updateField("personal", "email", val)} placeholder="example@email.com" />
            <FormField id="nominee-name" label="Nominee Full Name" value={form.personal.nomineeName} onChange={(val) => updateField("personal", "nomineeName", val)} error={errors.nomineeName} placeholder="Enter nominee name" required />
            <SelectField id="nominee-relationship" label="Nominee Relationship *" value={form.personal.nomineeRelationship} onChange={(val) => updateField("personal", "nomineeRelationship", val)} options={NOMINEE_RELATIONS} required />
            <FormField id="nominee-mobile" label="Nominee Mobile Number" type="tel" value={form.personal.nomineeMobile} onChange={(val) => updateField("personal", "nomineeMobile", val)} error={errors.nomineeMobile} placeholder="10-digit mobile" pattern="[0-9]{10}" required />
            <FormField id="member-password" label="Account Password" type="password" value={form.personal.password} onChange={(val) => updateField("personal", "password", val)} error={errors.password} placeholder="At least 8 chars" minLength={8} required />
          </div>
        </FormSection>

        <FormSection id="residential-address" number="2" title="Residential Address & Document Verification" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField id="pincode" label="Pincode *" maxLength="6" value={form.address.pincode} onChange={(val) => handlePincodeChange(val)} error={errors.pincode} placeholder="Enter 6-digit PIN" />
            <FormField id="district" label="District (Auto-fetched)" value={form.address.district} onChange={(val) => updateField("address", "district", val)} placeholder={loadingLocation ? "Fetching..." : "Auto-filled"} />
            <FormField id="taluka" label="Taluka / Block (Auto-fetched)" value={form.address.taluka} onChange={(val) => updateField("address", "taluka", val)} placeholder={loadingLocation ? "Fetching..." : "Auto-filled"} />
            <FormField id="state" label="State (Auto-fetched)" value={form.address.state} onChange={(val) => updateField("address", "state", val)} placeholder="Auto-filled" />
            <FormField id="city" label="City / Town" value={form.address.city} onChange={(val) => updateField("address", "city", val)} placeholder="Enter city" />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField id="street" label="Street Address / Area" value={form.address.street} onChange={(val) => updateField("address", "street", val)} placeholder="Complete street address" />
            <SelectField id="document-type" label="ID Proof Type *" value={documentType} onChange={(val) => setDocumentType(val)} options={documentOptions} required />
            <div>
              <label htmlFor="verification-doc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Upload {documentType} Document *</label>
              <input id="verification-doc" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 border border-slate-300 rounded-xl p-1 bg-white cursor-pointer" />
              {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document}</p>}
            </div>
          </div>

          {submissionError && (
            <div role="alert" className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md p-3">{submissionError}</div>
          )}

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
            <button type="submit" disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer">
              {isSubmitting ? "Submitting Registration..." : "Submit Registration"}
            </button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}