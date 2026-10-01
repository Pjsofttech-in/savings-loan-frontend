import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  DRAFT_STORAGE_KEY,
  initialForm,
} from "../constants/formOptions";
import { getTotalShareValue } from "../utils/formHelpers";
import { validateMemberForm } from "../utils/validation";

function mergeForm(savedForm) {
  if (!savedForm || typeof savedForm !== "object") return null;
  return Object.fromEntries(
    Object.entries(initialForm).map(([section, defaults]) => [
      section,
      { ...defaults, ...(savedForm[section] || {}) },
    ]),
  );
}

function readStoredDraft() {
  try {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    return savedDraft ? mergeForm(JSON.parse(savedDraft)) : null;
  } catch {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

export function useMemberForm() {
  const [storedDraft] = useState(readStoredDraft);
  const formMethods = useForm({
    defaultValues: storedDraft || initialForm,
    mode: "onBlur",
  });
  const form = useWatch({ control: formMethods.control });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalShareValue = useMemo(
    () => getTotalShareValue(form.membershipDetails),
    [form.membershipDetails],
  );

  const updateField = (section, field, value) => {
    formMethods.setValue(`${section}.${field}`, value, {
      shouldDirty: true,
      shouldValidate: false,
    });
    setErrors((current) => {
      const next = { ...current };
      delete next[`${section}.${field}`];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = validateMemberForm(form);
    setErrors(nextErrors);
    return nextErrors;
  };

  const loadDraft = () => {
    const restoredForm = readStoredDraft();
    if (restoredForm) {
      formMethods.reset(restoredForm);
      setMessage({ type: "success", text: "Saved draft restored." });
      return true;
    }
    return false;
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify(formMethods.getValues()),
      );
      setMessage({ type: "success", text: "Draft saved successfully." });
      window.setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({
        type: "error",
        text: "Draft could not be saved on this device.",
      });
    }
  };

  const resetForm = () => {
    if (
      JSON.stringify(form) !== JSON.stringify(initialForm) &&
      !window.confirm("Reset all entered registration data?")
    )
      return;
    formMethods.reset(initialForm);
    setErrors({});
    setMessage(null);
  };

  // --- UPDATED ROBUST SUBMIT LOGIC ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setMessage({
        type: "error",
        text: "Please review the highlighted fields before submitting.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const rawData = formMethods.getValues();
      console.log("Captured Form Raw Data:", rawData); // Check your browser console (F12) to see this!

      // Robust extraction checking multiple possible nested structures
      const d = rawData.memberDetails || rawData.personalDetails || rawData;

      const databasePayload = {
        name: d.fullName || d.name || d.firstName || "",
        email: d.emailId || d.email || d.emailAddress || "",
        phone: d.mobileNumber || d.phone || d.mobile || "",
        
        fathersName: d.fathersName || d.fatherName || "",
        dob: d.dob || d.dateOfBirth || "",
        occupation: d.occupation || "",
        idProofType: d.idProofType || "",
        idProofNumber: d.idProofNumber || "",
        residentialAddress: d.residentialAddress || d.address || ""
      };

      // Send it to your Spring Boot API
      const response = await fetch('http://localhost:8080/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(databasePayload)
      });

      if (response.ok) {
        formMethods.reset(initialForm);
        setErrors({});
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setMessage({
          type: "success",
          text: "Registration saved successfully to MySQL database!",
        });
      } else {
        throw new Error("Server rejected the save");
      }
      
    } catch (error) {
      console.error("Database connection error:", error);
      setMessage({
        type: "error",
        text: "Could not connect to the database. Registration failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // -----------------------------

  return {
    form,
    errors,
    updateField,
    validateForm,
    resetForm,
    saveDraft,
    loadDraft,
    handleSubmit,
    isSubmitting,
    message,
    totalShareValue,
  };
}