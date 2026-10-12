<<<<<<< Updated upstream
// src/services/settingsService.js

const DEFAULT_SETTINGS = {
  amount: 500,
  fee: 500,
  monthlyFee: 1000,
  memberTypes: ["General", "Lifetime", "Honorary"],
  years: ["2026", "2027", "2028"]
};

=======
const DEFAULT_SETTINGS = {
  amount: 500,
  fee: 500,
  monthlyFee: 1000,
  memberTypes: ["General", "Lifetime", "Honorary"],
  years: ["2026", "2027", "2028"]
};

>>>>>>> Stashed changes
export const getRegistrationSettings = () => {
  try {
    const storedSettings = localStorage.getItem("registrationSettings");
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        amount: parsed.amount || parsed.fee || DEFAULT_SETTINGS.amount,
        monthlyFee: parsed.monthlyFee || DEFAULT_SETTINGS.monthlyFee,
        memberTypes: parsed.memberTypes?.length ? parsed.memberTypes : DEFAULT_SETTINGS.memberTypes,
        years: parsed.years?.length ? parsed.years : DEFAULT_SETTINGS.years
      };
    }
  } catch (error) {
    console.error("Error reading settings:", error);
  }
  return DEFAULT_SETTINGS;
};

export const saveRegistrationSettings = (newSettings) => {
  try {
    const currentSettings = getRegistrationSettings();
    const updated = { ...currentSettings, ...newSettings };
    localStorage.setItem("registrationSettings", JSON.stringify(updated));
    window.dispatchEvent(new Event("settingsUpdated"));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
};