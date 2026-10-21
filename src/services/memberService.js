// src/services/memberService.js
import apiClient from "./apiClient";
import { REGISTRATIONS_STORAGE_KEY } from "../constants/formOptions";

const MEMBERS_CACHE_KEY = "cached_members_list";

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

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export async function fetchMembers() {
  try {
    const { data } = await apiClient.get("/api/members");
    const membersList = Array.isArray(data) ? data : [];
    localStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(membersList));
    return membersList;
  } catch (error) {
    // Do NOT fall back to the cached list here: it hides new registrations and hides the real error.
    if (!error.response) {
      throw new Error("Could not connect to the member list. Check that the backend is running and CORS allows this origin.", { cause: error });
    }
    throw getMemberError(error);
  }
}

export async function fetchMemberById(memberId) {
  try {
    const { data } = await apiClient.get(`/api/members/${encodeURIComponent(memberId)}`);
    return data;
  } catch (error) {
    const cached = !error.response ? localStorage.getItem(MEMBERS_CACHE_KEY) : null;
    if (cached) {
      try {
        const members = JSON.parse(cached);
        const found = members.find(m => String(m.id) === String(memberId));
        if (found) return found;
      } catch (parseErr) {
        console.warn("Failed to parse member cache", parseErr);
      }
    }
    if (!error.response) {
      throw new Error("Could not connect to the member lookup. Check that the backend is running.", { cause: error });
    }
    throw getMemberError(error);
  }
}

export async function updateMember(memberId, memberData) {
  try {
    const { data } = await apiClient.put(`/api/members/${encodeURIComponent(memberId)}`, memberData);
    return data;
  } catch (error) {
    if (!error.response) {
      throw new Error("Could not connect to the server to update member. Check backend status.", { cause: error });
    }
    throw getMemberError(error);
  }
}

function readRegistrations() {
  try {
    const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (parseErr) {
    console.warn("Failed to read local registrations", parseErr);
    return [];
  }
}

export async function submitMemberRegistration(memberData) {
  try {
    const { data } = await apiClient.post("/api/members", memberData);
    return data;
  } catch {
    const registration = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...memberData,
    };
    const registrations = [...readRegistrations(), registration];
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(registrations));
    return registration;
  }
}

export function getMemberRegistrations() {
  return readRegistrations();
}