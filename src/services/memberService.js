import apiClient from "./apiClient";
import { REGISTRATIONS_STORAGE_KEY } from "../constants/formOptions";

// Local cache storage keys
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

// Cross-browser safe UUID generator fallback
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Fetch members with automatic offline fallback to localStorage cache.
 */
export async function fetchMembers() {
  try {
    const { data } = await apiClient.get("/members");
    const membersList = Array.isArray(data) ? data : [];
    
    // Save successfully fetched data to local cache
    localStorage.setItem(MEMBERS_CACHE_KEY, JSON.stringify(membersList));
    return membersList;
  } catch (error) {
    // If backend/MySQL is unreachable, try serving from local cache
    const cached = localStorage.getItem(MEMBERS_CACHE_KEY);
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached);
        if (Array.isArray(parsedCache)) {
          console.warn("Backend offline. Serving members from local cache.");
          return parsedCache;
        }
      } catch (parseError) {
        console.error("Failed to parse member cache", parseError);
      }
    }

    // If no cache exists, throw the standard connection error
    if (!error.response) {
      throw new Error(
        "Could not connect to the member list. Check that the backend is running.",
        { cause: error },
      );
    }
    throw getMemberError(error);
  }
}

/**
 * Fetch single member by ID with offline fallback support.
 */
export async function fetchMemberById(memberId) {
  try {
    const { data } = await apiClient.get(
      `/members/${encodeURIComponent(memberId)}`,
    );
    return data;
  } catch (error) {
    // Check local cache if backend is down
    const cached = localStorage.getItem(MEMBERS_CACHE_KEY);
    if (cached) {
      try {
        const members = JSON.parse(cached);
        const found = members.find(m => String(m.id) === String(memberId));
        if (found) {
          console.warn("Backend offline. Serving member from local cache.");
          return found;
        }
      } catch (parseError) {
        console.error("Failed to parse member cache", parseError);
      }
    }

    if (!error.response) {
      throw new Error(
        "Could not connect to the member lookup. Check that the backend is running.",
        { cause: error },
      );
    }
    throw getMemberError(error);
  }
}

function readRegistrations() {
  try {
    const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
    const registrations = saved ? JSON.parse(saved) : [];
    return Array.isArray(registrations) ? registrations : [];
  } catch {
    return [];
  }
}

/**
 * Submit member registration directly to the backend database 
 * with local fallback support.
 */
export async function submitMemberRegistration(memberData) {
  try {
    const { data } = await apiClient.post("/members", memberData);
    return data;
  } catch {
    console.warn("Backend offline during registration. Storing locally as fallback.");
    const registration = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...memberData,
    };
    const registrations = [...readRegistrations(), registration];
    localStorage.setItem(
      REGISTRATIONS_STORAGE_KEY,
      JSON.stringify(registrations),
    );
    return registration;
  }
}

export function getMemberRegistrations() {
  return readRegistrations();
}