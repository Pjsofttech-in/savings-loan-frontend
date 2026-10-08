import apiClient from "./apiClient";

function getMemberError(error) {
  if (error.response?.status === 404) {
    return new Error("No member exists with that ID.", { cause: error });
  }
  return new Error(
    error.response?.data?.detail ||
      error.response?.data?.message ||
      "Could not load member data.",
    { cause: error },
  );
}

export async function fetchMembers() {
  try {
    const { data } = await apiClient.get("/api/members");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (!error.response) {
      throw new Error(
        "Could not connect to the member list. Check that the backend is running.",
        { cause: error },
      );
    }
    throw getMemberError(error);
  }
}

export async function fetchMemberById(memberId) {
  try {
    const { data } = await apiClient.get(
      `/api/members/${encodeURIComponent(memberId)}`,
    );
    return data;
  } catch (error) {
    if (!error.response) {
      throw new Error(
        "Could not connect to the member lookup. Check that the backend is running.",
        { cause: error },
      );
    }
    throw getMemberError(error);
  }
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
