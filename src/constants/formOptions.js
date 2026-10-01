export const ID_OPTIONS = [
  "Aadhaar",
  "PAN",
  "Voter ID",
  "Driving Licence",
  "Other",
];
export const YES_NO_OPTIONS = ["Yes", "No"];
export const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Cheque"];
export const MEMBER_STATUS_OPTIONS = ["Active", "Paused", "Terminated", "Suspended"]; 

export const initialForm = {
  memberDetails: {
    fullName: "",
    guardianName: "",
    dateOfBirth: "",
    occupation: "",
    address: "",
    mobile: "",
    email: "",
    identityType: "",
    identityNumber: "",
    identityAttached: "",
    identityProof: null,
    addressProof: null,
  },
  membershipDetails: {
    registrationNumber: "",
    joiningDate: "",
    status: "Active", // <-- Added the default status here
    shares: "",
    shareValue: "",
    monthlySaving: "",
  },
  nomineeDetails: { name: "", relationship: "", mobile: "" },
  declaration: { memberName: "", date: "", agreed: false },
  witness1: {
    fullName: "",
    mobile: "",
    idType: "",
    idNumber: "",
    address: "",
    addressProof: null,
  },
  witness2: {
    fullName: "",
    mobile: "",
    idType: "",
    idNumber: "",
    address: "",
    addressProof: null,
  },
  officeUse: {
    receivedDate: "",
    documentsVerified: "",
    approved: "",
    registerNumber: "",
    approvedBy: "",
    presidentSignature: "",
    secretarySignature: "",
  },
  paymentDetails: {
    paymentMethod: "",
  },
};

export const DRAFT_STORAGE_KEY = "memberRegistrationDraft";
export const REGISTRATIONS_STORAGE_KEY = "memberRegistrations";
export const REGISTRATION_FEE = 500;