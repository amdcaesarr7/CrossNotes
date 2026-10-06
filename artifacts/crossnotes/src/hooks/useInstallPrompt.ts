import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
let installed = false;
let listenersAttached = false;
const subscribers = new Set<() => void>();

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function attachInstallListeners() {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;
  installed = isStandaloneDisplay();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    notifySubscribers();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notifySubscribers();
  });
}

attachInstallListeners();

/**
 * Shared install logic used by the first-use tour and the settings dialog.
 * `install()` actually triggers the browser's install prompt; it resolves to
 * `false` when the browser won't offer one, so callers know to show manual
 * instructions instead.
 */
export function useInstallPrompt() {
  const [state, setState] = useState(() => ({
    installed: isStandaloneDisplay(),
    canInstall: deferredPrompt !== null,
  }));

  useEffect(() => {
    attachInstallListeners();
    const update = () => setState({
      installed: installed || isStandaloneDisplay(),
      canInstall: deferredPrompt !== null,
    });
    subscribers.add(update);
    update();
    return () => { subscribers.delete(update); };
  }, []);

  const install = async (): Promise<boolean> => {
    attachInstallListeners();
    const prompt = deferredPrompt;
    if (!prompt) return false;

    deferredPrompt = null;
    notifySubscribers();
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        installed = true;
        notifySubscribers();
        return true;
      }
      return false;
    } catch {
      notifySubscribers();
      toast.error('Could not open the install prompt. Use the install steps instead.');
      return false;
    }
  };

  return {
    installed: state.installed,
    canInstall: state.canInstall,
    install,
    ios: isIosDevice(),
  };
}