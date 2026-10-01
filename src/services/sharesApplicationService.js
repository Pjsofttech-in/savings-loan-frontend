const SHARES_APPLICATIONS_STORAGE_KEY = "sharesApplications";

export function saveSharesApplication(application) {
  const saved = JSON.parse(localStorage.getItem(SHARES_APPLICATIONS_STORAGE_KEY) || "[]");
  saved.push({ ...application, id: crypto.randomUUID(), submittedAt: new Date().toISOString() });
  localStorage.setItem(SHARES_APPLICATIONS_STORAGE_KEY, JSON.stringify(saved));
}

export function getSharesApplications() {
  return JSON.parse(localStorage.getItem(SHARES_APPLICATIONS_STORAGE_KEY) || "[]");
}
