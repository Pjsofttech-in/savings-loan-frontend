import { FormField, FormSection, SelectField } from "../registration/RegistrationFields";
import { PAYMENT_METHODS } from "../../constants/formOptions";
import { formatIndianCurrency } from "../../utils/formHelpers";
import { SHARE_PRICE } from "./sharesConstants";

function ApplicantDetails({ data, errors, updateField, active }) {
  const field = (name, label, props = {}) => (
    <FormField
      id={`shares-${name}`}
      label={label}
      value={data[name]}
      onChange={(value) => updateField("applicant", name, value)}
      error={errors[name]}
      {...props}
    />
  );

  return (
    <FormSection id="shares-applicant" number="01" title="Applicant details" active={active}>
      <div className="field-grid">
        {field("registrationNumber", "Member Registration No.", { required: true })}
        {field("fullName", "Member Name", { required: true })}
        {field("mobile", "Mobile Number", { type: "tel", inputMode: "numeric", required: true })}
        <FormField
          id="shares-address"
          label="Member Address"
          value={data.address}
          onChange={(value) => updateField("applicant", "address", value)}
          error={errors.address}
          className="span-two"
          required
        >
          <textarea id="shares-address" value={data.address} onChange={(event) => updateField("applicant", "address", event.target.value)} required />
        </FormField>
        {field("applicationDate", "Application Date", { type: "date", required: true })}
      </div>
    </FormSection>
  );
}

function ShareDetails({ data, errors, updateField, totalShareValue, active }) {
  const field = (name, label, props = {}) => (
    <FormField
      id={`shares-${name}`}
      label={label}
      value={data[name]}
      onChange={(value) => updateField("shares", name, value)}
      error={errors[name]}
      {...props}
    />
  );

  return (
    <FormSection id="shares-details" number="02" title="Share application details" active={active}>
      <div className="field-grid">
        {field("numberOfShares", "Number of Shares", { type: "number", min: "1", step: "1", required: true })}
        <div className="field fixed-share-value">
          <label htmlFor="shares-share-value">Value per Share</label>
          <input id="shares-share-value" type="text" value={formatIndianCurrency(SHARE_PRICE)} readOnly aria-describedby="shares-share-value-help" />
          <small id="shares-share-value-help">Fixed share price for first-time applicants.</small>
        </div>
        {field("monthlySaving", "Monthly Saving Amount", { type: "number", min: "0.01", step: "0.01", inputMode: "decimal", className: "currency-field", required: true })}
        <SelectField
          id="shares-payment-method"
          label="Payment method"
          value={data.paymentMethod}
          onChange={(value) => updateField("shares", "paymentMethod", value)}
          error={errors.paymentMethod}
          options={PAYMENT_METHODS}
          required
        />
      </div>
      <div className="calculation">
        <span>Total share value</span>
        <strong>{formatIndianCurrency(totalShareValue)}</strong>
        <small>{data.numberOfShares || 0} shares x {formatIndianCurrency(SHARE_PRICE)}</small>
      </div>
    </FormSection>
  );
}

function ShareDeclaration({ data, errors, updateField, active }) {
  return (
    <FormSection id="shares-declaration" number="03" title="Applicant declaration" active={active}>
      <div className="declaration-copy">
        I request the allotment of the shares specified above and confirm that the information provided is complete and correct. I agree to follow the rules of the Private Members Savings &amp; Loan Group.
      </div>
      <div className="field-grid">
        <FormField
          id="shares-declaration-name"
          label="Applicant Name"
          value={data.name}
          onChange={(value) => updateField("declaration", "name", value)}
          error={errors.name}
          required
        />
        <FormField
          id="shares-declaration-date"
          label="Declaration Date"
          value={data.date}
          onChange={(value) => updateField("declaration", "date", value)}
          error={errors.date}
          type="date"
          required
        />
      </div>
      <label className="checkbox-field" htmlFor="shares-declaration-agreed">
        <input
          id="shares-declaration-agreed"
          type="checkbox"
          checked={data.agreed}
          onChange={(event) => updateField("declaration", "agreed", event.target.checked)}
        />
        <span>I confirm the details above are correct.</span>
      </label>
      {errors.agreed && <p className="field-error">{errors.agreed}</p>}
    </FormSection>
  );
}

export { ApplicantDetails, ShareDetails, ShareDeclaration };
