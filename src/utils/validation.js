const mobilePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateMemberForm(form) {
  const errors = {};
  const required = (section, fields) =>
    fields.forEach(([field, label]) => {
      if (!String(form[section][field] ?? "").trim())
        errors[`${section}.${field}`] = `${label} is required.`;
    });
  const validateMobile = (section, field, label = "Mobile number") => {
    const value = form[section][field];
    if (value && !mobilePattern.test(value))
      errors[`${section}.${field}`] =
        `Enter a valid 10-digit Indian mobile number for ${label.toLowerCase()}.`;
  };

  required("memberDetails", [
    ["fullName", "Full name"],
    ["guardianName", "Father's / spouse's name"],
    ["dateOfBirth", "Date of birth"],
    ["occupation", "Occupation"],
    ["address", "Residential address"],
    ["mobile", "Mobile number"],
  ]);
  required("memberDetails", [
    ["identityType", "ID proof type"],
    ["identityNumber", "ID proof number"],
    ["identityAttached", "Document attachment status"],
  ]);
  
  if (!form.memberDetails.identityProof)
    errors["memberDetails.identityProof"] = "PDF proof copy is required.";
  else if (form.memberDetails.identityProof.type !== "application/pdf")
    errors["memberDetails.identityProof"] = "Proof copy must be a PDF file.";
    
  if (!form.memberDetails.addressProof)
    errors["memberDetails.addressProof"] = "Address proof PDF is required.";
  else if (form.memberDetails.addressProof.type !== "application/pdf")
    errors["memberDetails.addressProof"] = "Address proof must be a PDF file.";
    
  required("membershipDetails", [
    ["registrationNumber", "Registration number"],
    ["joiningDate", "Date of joining"],
    ["status", "Member status"], // <-- Added Member status here
    ["shares", "Number of shares"],
    ["shareValue", "Share value"],
    ["monthlySaving", "Monthly saving amount"],
  ]);
  
  required("nomineeDetails", [
    ["name", "Nominee name"],
    ["relationship", "Relationship"],
    ["mobile", "Nominee mobile number"],
  ]);
  
  required("declaration", [
    ["memberName", "Member name"],
    ["date", "Declaration date"],
  ]);
  
  required("paymentDetails", [["paymentMethod", "Payment method"]]);
  
  if (!form.declaration.agreed)
    errors["declaration.agreed"] =
      "You must agree to the declaration before submitting.";

  validateMobile("memberDetails", "mobile");
  validateMobile("nomineeDetails", "mobile", "nominee mobile number");
  if (form.memberDetails.email && !emailPattern.test(form.memberDetails.email))
    errors["memberDetails.email"] = "Enter a valid email address.";

  if (Number(form.membershipDetails.shares) < 1)
    errors["membershipDetails.shares"] = "Number of shares must be at least 1.";
  if (Number(form.membershipDetails.shareValue) <= 0)
    errors["membershipDetails.shareValue"] =
      "Share value must be greater than 0.";
  if (Number(form.membershipDetails.monthlySaving) <= 0)
    errors["membershipDetails.monthlySaving"] =
      "Monthly saving must be greater than 0.";

  [1, 2].forEach((number) => {
    const section = `witness${number}`;
    required(section, [
      ["fullName", "Full name"],
      ["mobile", "Mobile number"],
      ["idType", "ID proof type"],
      ["idNumber", "ID proof number"],
      ["address", "Address"],
    ]);
    if (!form[section].addressProof)
      errors[`${section}.addressProof`] = "Address proof PDF is required.";
    else if (form[section].addressProof.type !== "application/pdf")
      errors[`${section}.addressProof`] = "Address proof must be a PDF file.";
    validateMobile(section, "mobile");
  });

  return errors;
}