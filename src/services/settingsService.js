// src/services/settingsService.js
import apiClient from "./apiClient";

const SETTINGS_STORAGE_KEY = "app_registration_settings";

export function getRegistrationSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { 
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
    };
  } catch {
    return { 
      amount: 500, 
      monthlyFee: 1000, 
      memberTypes: ["General", "Lifetime", "Honorary", "Founder"] 
    };
  }
}

export function saveRegistrationSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return settings;
  } catch {
    return settings;
  }
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