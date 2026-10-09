import { useEffect, useState } from "react";
const defaults = {
  theme: "system",
  compact: false,
  priority: "medium",
  focusMinutes: 25,
  breakMinutes: 5,
};
export function usePreferences(userId) {
  const key = `nexo.preferences.${userId}`;
  const [preferences, setPreferences] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "{}");
      return {
        theme: ["light", "dark", "system"].includes(value.theme)
          ? value.theme
          : "system",
        compact: value.compact === true,
        priority: ["low", "medium", "high"].includes(value.priority)
          ? value.priority
          : "medium",
        focusMinutes: [15, 25, 45, 60].includes(value.focusMinutes)
          ? value.focusMinutes
          : 25,
        breakMinutes: [5, 10, 15].includes(value.breakMinutes)
          ? value.breakMinutes
          : 5,
      };
    } catch {
      return defaults;
    }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        preferences.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preferences.theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      delete document.documentElement.dataset.theme;
    };
  }, [key, preferences]);
  return {
    preferences,
    setPreference: (name, value) =>
      setPreferences((current) => ({ ...current, [name]: value })),
    storageError,
  };
}
