// src/services/settingsService.js
import apiClient from "./apiClient";

const SETTINGS_STORAGE_KEY = "app_registration_settings";
export const DEFAULT_LOAN_SETTINGS = {
  dailyPenaltyRatePercent: 0,
  penaltyBasis: "installment",
  penaltyGraceDays: 0,
  reminderAfterDays: 7,
};

function normalizeSettings(settings) {
  return {
    ...settings,
    loanSettings: { ...DEFAULT_LOAN_SETTINGS, ...(settings.loanSettings || {}) },
  };
}

export function getRegistrationSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return normalizeSettings(saved ? JSON.parse(saved) : {
      amount: 500, 
      monthlyFee: 1000, 
      memberTypes: ["General", "Lifetime", "Honorary", "Founder"],
      memberTypesWithFee: [
        { id: 1, name: "General", regFee: 500, monthlyFee: 1000, yearlyFee: 12000 },
        { id: 2, name: "Lifetime", regFee: 5000, monthlyFee: 0, yearlyFee: 0 },
        { id: 3, name: "Honorary", regFee: 0, monthlyFee: 0, yearlyFee: 0 },
        { id: 4, name: "Founder", regFee: 10000, monthlyFee: 2000, yearlyFee: 24000 }
      ],
      bankAccounts: []
    });
  } catch {
    return normalizeSettings({
      amount: 500, 
      monthlyFee: 1000, 
      memberTypes: ["General", "Lifetime", "Honorary", "Founder"] 
    });
  }
}

export function saveRegistrationSettings(settings) {
  try {
    const normalized = normalizeSettings(settings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    apiClient.put("/api/settings", { value: JSON.stringify(normalized) }).catch(() => {});
    return normalized;
  } catch {
    return settings;
  }
}

export async function hydrateRegistrationSettings() {
  try {
    const { data } = await apiClient.get("/api/settings");
    if (data?.value) {
      const serverSettings = normalizeSettings(JSON.parse(data.value));
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(serverSettings));
      window.dispatchEvent(new Event("settingsUpdated"));
      return serverSettings;
    }
  } catch {
    // Local settings remain available when the API is temporarily unavailable.
  }
  return getRegistrationSettings();
}

export async function saveLoanSettings(loanSettings) {
  const nextSettings = normalizeSettings({
    ...getRegistrationSettings(),
    loanSettings,
  });
  await apiClient.put("/api/settings", { value: JSON.stringify(nextSettings) });
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  window.dispatchEvent(new Event("settingsUpdated"));
  return nextSettings;
}

// Complete backend sync function for fee & full settings update
export async function saveRegistrationFee(amount, monthlyFee = null) {
  try {
    const payload = { amount };
    if (monthlyFee !== null) {
      payload.monthlyFee = monthlyFee;
    }
    const { data } = await apiClient.put("/api/payments/registration-fee", payload);
    return data;
  } catch (error) {
    console.warn("Failed to update registration fee on server, falling back to local storage.", error);
    throw error;
  }
}