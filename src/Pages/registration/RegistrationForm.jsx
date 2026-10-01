// src/Pages/registration/RegistrationForm.jsx
import { useState } from "react";
import { FormField, SelectField, FormSection } from "./RegistrationFields";

export default function RegistrationForm() {
  const [form, setForm] = useState({
    personal: {
      fullName: "",
      fatherName: "",
      dob: "",
      gender: "",
      occupation: "",
      mobile: "",
      email: "",
    },
    address: {
      street: "",
      country: "India",
      state: "",
      district: "",
      taluka: "",
      city: "",
      pincode: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const updateField = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Automatic Pincode lookup fetching District and Taluka without manual typing
  const handlePincodeChange = async (pincodeValue) => {
    updateField("address", "pincode", pincodeValue);

    if (pincodeValue && pincodeValue.length === 6) {
      setLoadingLocation(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincodeValue}`);
        const data = await response.json();

        if (data && data[0]?.Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          
          // Automatically populate district, state, and taluka/block
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.personal.fullName) newErrors.fullName = "Full name is required.";
    if (!form.personal.mobile) newErrors.mobile = "Mobile number is required.";
    if (!form.address.pincode) newErrors.pincode = "Pincode is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8 font-sans">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Member Onboarding</span>
        <h1 className="text-2xl font-extrabold text-[#102a43] m-0">Member Registration Form</h1>
        <p className="text-slate-500 text-xs mt-1">Enter personal information and residential address (District &amp; Taluka auto-fetch via Pincode).</p>
      </div>

      {isSubmitted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm font-bold flex items-center justify-between">
          <span>✓ Member registration submitted and saved successfully!</span>
          <button onClick={() => setIsSubmitted(false)} className="text-xs underline text-emerald-700">Register Another</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Personal Details */}
        <FormSection id="personal-details" number="1" title="Member Personal Details" active={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField
              id="full-name"
              label="Full Name *"
              value={form.personal.fullName}
              onChange={(val) => updateField("personal", "fullName", val)}
              error={errors.fullName}
              placeholder="Enter full name"
            />
            <FormField
              id="father-name"
              label="Father's / Spouse's Name"
              value={form.personal.fatherName}
              onChange={(val) => updateField("personal", "fatherName", val)}
              placeholder="Enter father's name"
            />
            <FormField
              id="dob"
              label="Date of Birth"
              type="date"
              value={form.personal.dob}
              onChange={(val) => updateField("personal", "dob", val)}
            />
            <SelectField
              id="gender"
              label="Gender"
              value={form.personal.gender}
              onChange={(val) => updateField("personal", "gender", val)}
              options={["Male", "Female", "Other"]}
            />
            <FormField
              id="occupation"
              label="Occupation"
              value={form.personal.occupation}
              onChange={(val) => updateField("personal", "occupation", val)}
              placeholder="e.g. Software Engineer"
            />
            <FormField
              id="mobile"
              label="Mobile Number *"
              value={form.personal.mobile}
              onChange={(val) => updateField("personal", "mobile", val)}
              error={errors.mobile}
              placeholder="10-digit mobile number"
            />
            <FormField
              id="email"
              label="Email Address"
              type="email"
              value={form.personal.email}
              onChange={(val) => updateField("personal", "email", val)}
              placeholder="example@email.com"
            />
          </div>
        </FormSection>

        {/* Section 2: Residential Address with Auto-Fetch Pincode */}
        <FormSection id="residential-address" number="2" title="Residential Address" active={true}>
          <div className="mb-4 pb-2 border-b border-slate-200">
            <p className="text-slate-500 text-xs">Enter your 6-digit Pincode below to automatically fetch your District and Taluka.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <FormField
              id="pincode"
              label="Pincode *"
              maxLength="6"
              value={form.address.pincode}
              onChange={(val) => handlePincodeChange(val)}
              error={errors.pincode}
              placeholder="Enter 6-digit PIN"
            />

            <FormField
              id="district"
              label="District (Auto-fetched)"
              value={form.address.district}
              onChange={(val) => updateField("address", "district", val)}
              placeholder={loadingLocation ? "Fetching..." : "Auto-filled by Pincode"}
            />

            <FormField
              id="taluka"
              label="Taluka / Block (Auto-fetched)"
              value={form.address.taluka}
              onChange={(val) => updateField("address", "taluka", val)}
              placeholder={loadingLocation ? "Fetching..." : "Auto-filled by Pincode"}
            />

            <FormField
              id="state"
              label="State (Auto-fetched)"
              value={form.address.state}
              onChange={(val) => updateField("address", "state", val)}
              placeholder="Auto-filled by Pincode"
            />

            <FormField
              id="city"
              label="City / Town"
              value={form.address.city}
              onChange={(val) => updateField("address", "city", val)}
              placeholder="Enter city"
            />
          </div>

          <div className="mt-4">
            <FormField
              id="street"
              label="Street Address / Area"
              value={form.address.street}
              onChange={(val) => updateField("address", "street", val)}
              placeholder="Enter complete street address"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              Submit Registration Form
            </button>
          </div>
        </FormSection>

      </form>
    </div>
  );
}