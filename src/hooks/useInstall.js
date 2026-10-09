import { useEffect, useState } from "react";
export function useInstall() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(
    () =>
      matchMedia("(display-mode: standalone)").matches ||
      navigator.standalone === true,
  );
  useEffect(() => {
    const before = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  return {
    installed,
    canInstall: Boolean(prompt),
    install: async () => {
      if (!prompt) return;
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setPrompt(null);
      return choice.outcome;
    },
  };
}
