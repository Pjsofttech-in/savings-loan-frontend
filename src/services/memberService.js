import { REGISTRATIONS_STORAGE_KEY } from "../constants/formOptions";

function readRegistrations() {
  try {
    const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    const registrations = saved ? JSON.parse(saved) : [];
    return Array.isArray(registrations) ? registrations : [];
  } catch {
    return [];
  }
}

export function submitMemberRegistration(data) {
  const registration = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  const registrations = [...readRegistrations(), registration];
  localStorage.setItem(
    REGISTRATIONS_STORAGE_KEY,
    JSON.stringify(registrations),
  );
  return registration;
}

export function getMemberRegistrations() {
  return readRegistrations();
}
