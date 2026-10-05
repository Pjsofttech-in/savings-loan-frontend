const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

async function readMemberResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 404) throw new Error("No member exists with that ID.");
    throw new Error(data?.detail || data?.message || "Could not load member data.");
  }
  return data;
}

export async function fetchMembers() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/members`);
  } catch {
    throw new Error("Could not connect to the member list. Check that the backend is running.");
  }
  const members = await readMemberResponse(response);
  return Array.isArray(members) ? members : [];
}

export async function fetchMemberById(memberId) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/members/${encodeURIComponent(memberId)}`);
  } catch {
    throw new Error("Could not connect to the member lookup. Check that the backend is running.");
  }
  return readMemberResponse(response);
}import { REGISTRATIONS_STORAGE_KEY } from "../constants/formOptions";

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
