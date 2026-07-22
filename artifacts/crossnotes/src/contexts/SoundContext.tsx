import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setSoundEnabled, unlockAudio } from "@/lib/sfx";

interface SoundContextType {
  soundOn: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType>({ soundOn: true, toggleSound: () => {} });

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem("cn-sound") !== "off";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    setSoundEnabled(soundOn);
    try {
      localStorage.setItem("cn-sound", soundOn ? "on" : "off");
    } catch {
      /* ignore — worst case the toggle doesn't persist */
    }
  }, [soundOn]);

  // Browsers require a user gesture before audio can play — unlock on the
  // very first tap/click anywhere in the app.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  return (
    <SoundContext.Provider value={{ soundOn, toggleSound: () => setSoundOn((s) => !s) }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
