// src/Pages/registration/RegistrationSections.jsx

import {
  ID_OPTIONS,
  YES_NO_OPTIONS,
  PAYMENT_METHODS,
  MEMBER_STATUS_OPTIONS,
} from "../../constants/formOptions";

import {
  FormField,
  SelectField,
  RadioField,
  FormSection,
} from "./RegistrationFields";

import { formatIndianCurrency } from "../../utils/formHelpers";

/* =========================================================
   COMMON FILE FIELD
========================================================= */

function FileField({
  id,
  label,
  file,
  onChange,
  error,
  required = false,
  accept = ".pdf,application/pdf",
}) {
  const errorId = `${id}-error`;

  return (
    <div className="relative min-w-0 mb-0 flex flex-col pt-1.5">
      <label htmlFor={id} className="text-slate-700 text-[12px] font-bold block mb-1">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>

      <input
        id={id}
        name={id}
        type="file"
        accept={accept}
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] || null;
          onChange(selectedFile);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full h-[42px] px-3 py-2 border border-dashed border-slate-300 rounded-md bg-[#f8fbfc] text-slate-900 text-[12px] outline-none transition file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
      />

      {file && (
        <p className="text-[12px] text-slate-600 mt-1">
          Selected: <strong className="text-slate-900">{file.name}</strong>
        </p>
      )}

      {error && (
        <p className="text-red-600 text-[11px] mt-1" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   MEMBER DETAILS
========================================================= */

export function MemberDetails({
  data,
  errors,
  updateField,
  active,
}) {
  return (
    <FormSection
      id="member-details"
      number="1"
      title="Member Details"
      active={active}
    >
      <div className="mb-5 pb-4 border-b border-slate-200">
        <p className="text-slate-500 text-[13px]">
          Enter the member's personal and identification information.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

        <FormField
          id="member-full-name"
          label="Full Name"
          value={data.fullName}
          onChange={(value) =>
            updateField("memberDetails", "fullName", value)
          }
          error={errors.fullName}
          required
          placeholder="Enter full name"
        />

        <FormField
          id="member-guardian-name"
          label="Father's / Spouse's Name"
          value={data.guardianName}
          onChange={(value) =>
            updateField("memberDetails", "guardianName", value)
          }
          error={errors.guardianName}
          required
          placeholder="Enter father's / spouse's name"
        />

        <FormField
          id="member-date-of-birth"
          label="Date of Birth"
          type="date"
          value={data.dateOfBirth}
          onChange={(value) =>
            updateField("memberDetails", "dateOfBirth", value)
          }
          error={errors.dateOfBirth}
          required
        />

        <SelectField
          id="member-gender"
          label="Gender"
          value={data.gender}
          onChange={(value) =>
            updateField("memberDetails", "gender", value)
          }
          error={errors.gender}
          options={["Male", "Female", "Other"]}
          required
        />

        <FormField
          id="member-occupation"
          label="Occupation"
          value={data.occupation}
          onChange={(value) =>
            updateField("memberDetails", "occupation", value)
          }
          error={errors.occupation}
          required
          placeholder="e.g. Software Engineer"
        />

        <FormField
          id="member-mobile"
          label="Mobile Number"
          type="tel"
          value={data.mobile}
          onChange={(value) =>
            updateField("memberDetails", "mobile", value)
          }
          error={errors.mobile}
          required
          placeholder="10-digit mobile number"
          inputMode="numeric"
        />

        <FormField
          id="member-email"
          label="Email Address"
          type="email"
          value={data.email}
          onChange={(value) =>
            updateField("memberDetails", "email", value)
          }
          error={errors.email}
          placeholder="example@email.com"
        />

        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 flex flex-col pt-1.5">
          <label htmlFor="member-address" className="text-slate-700 text-[12px] font-bold block mb-1">
            Residential Address
            <span className="text-red-600"> *</span>
          </label>

          <textarea
            id="member-address"
            name="member-address"
            value={data.address}
            onChange={(event) =>
              updateField(
                "memberDetails",
                "address",
                event.target.value
              )
            }
            placeholder="Enter complete residential address"
            rows={3}
            required
            aria-invalid={Boolean(errors.address)}
            className="w-full p-3 border border-slate-300 rounded-md bg-white text-slate-900 text-[13px] outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />

          {errors.address && (
            <p className="text-red-600 text-[11px] mt-1">
              {errors.address}
            </p>
          )}
        </div>

        <FormField
          id="member-country"
          label="Country"
          value={data.country}
          onChange={(value) =>
            updateField("memberDetails", "country", value)
          }
          error={errors.country}
          required
          placeholder="Enter country"
        />

        <FormField
          id="member-state"
          label="State"
          value={data.state}
          onChange={(value) =>
            updateField("memberDetails", "state", value)
          }
          error={errors.state}
          required
          placeholder="Enter state"
        />

        <FormField
          id="member-district"
          label="District"
          value={data.district}
          onChange={(value) =>
            updateField("memberDetails", "district", value)
          }
          error={errors.district}
          required
          placeholder="Enter district"
        />

        <FormField
          id="member-taluka"
          label="Taluka"
          value={data.taluka}
          onChange={(value) =>
            updateField("memberDetails", "taluka", value)
          }
          error={errors.taluka}
          required
          placeholder="Enter taluka"
        />

        <FormField
          id="member-city"
          label="City"
          value={data.city}
          onChange={(value) =>
            updateField("memberDetails", "city", value)
          }
          error={errors.city}
          required
          placeholder="Enter city"
        />

        <FormField
          id="member-pincode"
          label="Pincode"
          value={data.pincode}
          onChange={(value) =>
            updateField("memberDetails", "pincode", value)
          }
          error={errors.pincode}
          required
          placeholder="Enter pincode"
          inputMode="numeric"
        />

        <FormField
          id="member-landmark"
          label="Landmark"
          value={data.landmark}
          onChange={(value) =>
            updateField("memberDetails", "landmark", value)
          }
          error={errors.landmark}
          placeholder="Nearby landmark"
        />

      </div>

      {/* ID PROOF */}

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-slate-800 text-[15px] font-bold mb-4">Identity Verification</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

          <SelectField
            id="member-identity-type"
            label="ID Proof Type"
            value={data.identityType}
            onChange={(value) =>
              updateField(
                "memberDetails",
                "identityType",
                value
              )
            }
            error={errors.identityType}
            options={ID_OPTIONS}
            required
          />

          <FormField
            id="member-identity-number"
            label="ID Proof Number"
            value={data.identityNumber}
            onChange={(value) =>
              updateField(
                "memberDetails",
                "identityNumber",
                value
              )
            }
            error={errors.identityNumber}
            required
            placeholder="Enter ID number"
          />

          <RadioField
            id="member-identity-attached"
            label="Identity document attached?"
            value={data.identityAttached}
            onChange={(value) =>
              updateField(
                "memberDetails",
                "identityAttached",
                value
              )
            }
            options={YES_NO_OPTIONS}
            error={errors.identityAttached}
            required
          />

          <FileField
            id="member-identity-proof"
            label="Identity Proof PDF"
            file={data.identityProof}
            onChange={(file) =>
              updateField(
                "memberDetails",
                "identityProof",
                file
              )
            }
            error={errors.identityProof}
            required
          />

          <FileField
            id="member-address-proof"
            label="Address Proof PDF"
            file={data.addressProof}
            onChange={(file) =>
              updateField(
                "memberDetails",
                "addressProof",
                file
              )
            }
            error={errors.addressProof}
            required
          />

        </div>
      </div>
    </FormSection>
  );
}

/* =========================================================
   MEMBERSHIP DETAILS
========================================================= */

export function MembershipDetails({
  data,
  errors,
  updateField,
  totalShareValue,
  active,
}) {
  return (
    <FormSection
      id="membership-details"
      number="2"
      title="Membership Details"
      active={active}
    >
      <div className="mb-5 pb-4 border-b border-slate-200">
        <p className="text-slate-500 text-[13px]">
          Enter the membership, share and monthly saving details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

        <FormField
          id="registration-number"
          label="Registration Number"
          value={data.registrationNumber}
          onChange={(value) =>
            updateField(
              "membershipDetails",
              "registrationNumber",
              value
            )
          }
          error={errors.registrationNumber}
          required
          placeholder="e.g. PM-2026-001"
        />

        <FormField
          id="joining-date"
          label="Date of Joining"
          type="date"
          value={data.joiningDate}
          onChange={(value) =>
            updateField(
              "membershipDetails",
              "joiningDate",
              value
            )
          }
          error={errors.joiningDate}
          required
        />

        <SelectField
          id="member-status"
          label="Member Status"
          value={data.status}
          onChange={(value) =>
            updateField(
              "membershipDetails",
              "status",
              value
            )
          }
          error={errors.status}
          options={MEMBER_STATUS_OPTIONS}
          required
        />

        <FormField
          id="number-of-shares"
          label="Number of Shares"
          type="number"
          value={data.shares}
          onChange={(value) =>
            updateField(
              "membershipDetails",
              "shares",
              value
            )
          }
          error={errors.shares}
          required
          min="1"
          step="1"
          inputMode="numeric"
          placeholder="Enter number of shares"
        />

        <FormField
          id="share-value"
          label="Value Per Share"
          type="number"
          value={data.shareValue}
          onChange={(value) =>
            updateField(
              "membershipDetails",
              "shareValue",
              value
            )
          }
          error={errors.shareValue}
          required
          min="1"
          step="0.01"
          inputMode="decimal"
          placeholder="₹ 0.00"
        />

        <FormField
          id="monthly-saving"
          label="Monthly Saving Amount"
          type="number"
          value={data.monthlySaving}
          onChange={(value) =>
            updateField(
              "membershipDetails",
              "monthlySaving",
              value
            )
          }
          error={errors.monthlySaving}
          required
          min="1"
          step="0.01"
          inputMode="decimal"
          placeholder="₹ 0.00"
        />

      </div>

      {/* SHARE SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
        <div>
          <span className="text-slate-500 text-[12px] block">Total Share Value</span>
          <strong className="text-[#102a43] text-[20px] font-bold">
            {formatIndianCurrency(totalShareValue)}
          </strong>
        </div>

        <div>
          <span className="text-slate-500 text-[12px] block">Shares</span>
          <strong className="text-[#102a43] text-[20px] font-bold">
            {data.shares || 0}
          </strong>
        </div>

        <div>
          <span className="text-slate-500 text-[12px] block">Monthly Saving</span>
          <strong className="text-[#102a43] text-[20px] font-bold">
            {formatIndianCurrency(data.monthlySaving)}
          </strong>
        </div>
      </div>

    </FormSection>
  );
}

/* =========================================================
   NOMINEE DETAILS
========================================================= */

export function NomineeDetails({
  data,
  errors,
  updateField,
  active,
}) {
  return (
    <FormSection
      id="nominee-details"
      number="3"
      title="Nominee Details"
      active={active}
    >
      <div className="mb-5 pb-4 border-b border-slate-200">
        <p className="text-slate-500 text-[13px]">
          Enter the details of the person nominated by the member.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

        <FormField
          id="nominee-name"
          label="Nominee Full Name"
          value={data.name}
          onChange={(value) =>
            updateField(
              "nomineeDetails",
              "name",
              value
            )
          }
          error={errors.name}
          required
          placeholder="Enter nominee name"
        />

        <FormField
          id="nominee-relationship"
          label="Relationship with Member"
          value={data.relationship}
          onChange={(value) =>
            updateField(
              "nomineeDetails",
              "relationship",
              value
            )
          }
          error={errors.relationship}
          required
          placeholder="e.g. Father, Mother, Spouse"
        />

        <FormField
          id="nominee-mobile"
          label="Nominee Mobile Number"
          type="tel"
          value={data.mobile}
          onChange={(value) =>
            updateField(
              "nomineeDetails",
              "mobile",
              value
            )
          }
          error={errors.mobile}
          required
          placeholder="10-digit mobile number"
          inputMode="numeric"
        />

      </div>
    </FormSection>
  );
}

/* =========================================================
   MEMBER DECLARATION
========================================================= */

export function MemberDeclaration({
  data,
  errors,
  updateField,
  active,
}) {
  return (
    <FormSection
      id="member-declaration"
      number="4"
      title="Member Declaration"
      active={active}
    >
      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-slate-800 text-[15px] font-bold mb-2">Declaration</h3>
        <p className="text-slate-600 text-[13px] leading-relaxed">
          I hereby declare that the information provided in this
          registration form is true and correct to the best of my
          knowledge. I agree to follow the rules and regulations
          of the Private Members Savings &amp; Loan Group.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">

        <FormField
          id="declaration-member-name"
          label="Member Name"
          value={data.memberName}
          onChange={(value) =>
            updateField(
              "declaration",
              "memberName",
              value
            )
          }
          error={errors.memberName}
          required
          placeholder="Enter member name"
        />

        <FormField
          id="declaration-date"
          label="Declaration Date"
          type="date"
          value={data.date}
          onChange={(value) =>
            updateField(
              "declaration",
              "date",
              value
            )
          }
          error={errors.date}
          required
        />

      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(data.agreed)}
            onChange={(event) =>
              updateField(
                "declaration",
                "agreed",
                event.target.checked
              )
            }
            className="w-4 h-4 accent-teal-600 rounded"
          />
          <span className="text-slate-800 text-[13px] font-bold">
            I have read and agree to the above declaration.
            <strong className="text-red-600"> *</strong>
          </span>
        </label>

        {errors.agreed && (
          <p className="text-red-600 text-[11px] mt-1">
            {errors.agreed}
          </p>
        )}
      </div>

    </FormSection>
  );
}

/* =========================================================
   WITNESS DETAILS
========================================================= */

function WitnessCard({
  number,
  data,
  errors,
  updateField,
}) {
  const section = `witness${number}`;

  return (
    <div className="p-4 mb-6 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
        <span className="grid place-items-center w-7 h-7 rounded-full bg-teal-700 text-white text-xs font-bold">{number}</span>
        <div>
          <h3 className="text-slate-800 text-[15px] font-bold m-0">Witness {number}</h3>
          <p className="text-slate-500 text-[12px] m-0">Provide the witness identification details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

        <FormField
          id={`witness-${number}-name`}
          label="Full Name"
          value={data.fullName}
          onChange={(value) =>
            updateField(
              section,
              "fullName",
              value
            )
          }
          error={errors.fullName}
          required
          placeholder="Enter witness full name"
        />

        <FormField
          id={`witness-${number}-mobile`}
          label="Mobile Number"
          type="tel"
          value={data.mobile}
          onChange={(value) =>
            updateField(
              section,
              "mobile",
              value
            )
          }
          error={errors.mobile}
          required
          placeholder="10-digit mobile number"
          inputMode="numeric"
        />

        <SelectField
          id={`witness-${number}-id-type`}
          label="ID Proof Type"
          value={data.idType}
          onChange={(value) =>
            updateField(
              section,
              "idType",
              value
            )
          }
          error={errors.idType}
          options={ID_OPTIONS}
          required
        />

        <FormField
          id={`witness-${number}-id-number`}
          label="ID Proof Number"
          value={data.idNumber}
          onChange={(value) =>
            updateField(
              section,
              "idNumber",
              value
            )
          }
          error={errors.idNumber}
          required
          placeholder="Enter ID number"
        />

        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 flex flex-col pt-1.5">
          <label htmlFor={`witness-${number}-address`} className="text-slate-700 text-[12px] font-bold block mb-1">
            Address
            <span className="text-red-600"> *</span>
          </label>

          <textarea
            id={`witness-${number}-address`}
            value={data.address}
            onChange={(event) =>
              updateField(
                section,
                "address",
                event.target.value
              )
            }
            rows={3}
            placeholder="Enter witness address"
            required
            className="w-full p-3 border border-slate-300 rounded-md bg-white text-slate-900 text-[13px] outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />

          {errors.address && (
            <p className="text-red-600 text-[11px] mt-1">
              {errors.address}
            </p>
          )}
        </div>

        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5">
          <FileField
            id={`witness-${number}-address-proof`}
            label="Address Proof PDF"
            file={data.addressProof}
            onChange={(file) =>
              updateField(
                section,
                "addressProof",
                file
              )
            }
            error={errors.addressProof}
            required
          />
        </div>

      </div>

    </div>
  );
}

export function WitnessDetails({
  form,
  errors,
  updateField,
  active,
}) {
  return (
    <FormSection
      id="witness-details"
      number="5"
      title="Witness Details"
      active={active}
    >
      <div className="mb-5 pb-4 border-b border-slate-200">
        <p className="text-slate-500 text-[13px]">
          Add the required information for both witnesses.
        </p>
      </div>

      <WitnessCard
        number={1}
        data={form.witness1}
        errors={errors.witness1 || {}}
        updateField={updateField}
      />

      <WitnessCard
        number={2}
        data={form.witness2}
        errors={errors.witness2 || {}}
        updateField={updateField}
      />

    </FormSection>
  );
}

/* =========================================================
   PAYMENT DETAILS
========================================================= */

export function PaymentDetails({
  data,
  errors,
  updateField,
  active,
}) {
  return (
    <FormSection
      id="payment-details"
      number="6"
      title="Payment Details"
      active={active}
    >
      <div className="mb-5 pb-4 border-b border-slate-200">
        <p className="text-slate-500 text-[13px]">
          Select the payment method that will be used for the
          member's registration/payment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">

        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 relative flex flex-col justify-center p-3 border border-slate-300 rounded-md bg-white">
          <span className="text-slate-700 text-[12px] font-bold block mb-2" id="payment-method-label">
            Payment Method <span className="text-red-600">*</span>
          </span>
          <div className="flex flex-wrap items-center gap-6" role="radiogroup" aria-labelledby="payment-method-label">
            {PAYMENT_METHODS.map((option) => (
              <label className="inline-flex items-center gap-2 text-[13px] text-slate-900 cursor-pointer select-none" key={option}>
                <input
                  type="radio"
                  name="payment-method"
                  value={option}
                  checked={data.paymentMethod === option}
                  onChange={(event) =>
                    updateField(
                      "paymentDetails",
                      "paymentMethod",
                      event.target.value
                    )
                  }
                  required
                  className="w-4 h-4 accent-teal-600 cursor-pointer m-0"
                />
                <span className="font-medium">{option}</span>
              </label>
            ))}
          </div>
          {errors.paymentMethod && (
            <p className="text-red-600 text-[11px] mt-1.5" id="payment-method-error">
              {errors.paymentMethod}
            </p>
          )}
        </div>

      </div>

      <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-lg">
        <div>
          <span className="text-slate-500 text-[12px] block">Payment status</span>
          <strong className="text-teal-900 text-[16px] font-bold">Ready for processing</strong>
        </div>
      </div>

    </FormSection>
  );
}