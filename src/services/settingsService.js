const SETTINGS_KEY = "pjsoftRegistrationSettings";

const defaultSettings = {
  memberTypes: ["Member"],
  years: [String(new Date().getFullYear())],
  shareTypes: ["Ordinary Shares", "Preference Shares", "Founder Shares"],
};

function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  const unique = new Map();
  options.forEach((option) => {
    if (typeof option !== "string") return;
    const value = option.trim();
    if (value) unique.set(value.toLocaleLowerCase(), value);
  });
  return [...unique.values()];
}

export function getRegistrationSettings() {
  try {
    const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (!savedSettings || typeof savedSettings !== "object") return defaultSettings;
    return {
      memberTypes: normalizeOptions(savedSettings.memberTypes ?? defaultSettings.memberTypes),
      years: normalizeOptions(savedSettings.years ?? defaultSettings.years),
      shareTypes: normalizeOptions(savedSettings.shareTypes ?? defaultSettings.shareTypes),
    };
  } catch {
    return defaultSettings;
  }
}

export function saveRegistrationSettings(settings) {
  const normalizedSettings = {
    memberTypes: normalizeOptions(settings.memberTypes),
    years: normalizeOptions(settings.years),
    shareTypes: normalizeOptions(settings.shareTypes),
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizedSettings));
  return normalizedSettings;
}