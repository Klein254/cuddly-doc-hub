import { useSyncExternalStore } from 'react';

// Optional (non-essential) cookie categories the site uses.
// The site currently sets NO optional cookies, so this list is empty and the
// banner only shows an information notice. If you ever add analytics or a
// third-party embed, add its category here (e.g. 'analytics'), list it in the
// Cookie Policy, and only load it when `useConsent().analytics` is true.
export type OptionalCategory = 'analytics' | 'marketing';
export const OPTIONAL_CATEGORIES: OptionalCategory[] = [];

export type ConsentState = {
  decided: boolean;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = 'vt-cookie-consent-v1';
const DEFAULT_STATE: ConsentState = { decided: false, analytics: false, marketing: false };
const listeners = new Set<() => void>();
let settingsOpen = false;

function read(): ConsentState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw), decided: true } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let current: ConsentState = typeof window === 'undefined' ? DEFAULT_STATE : read();

function emit() {
  listeners.forEach((l) => l());
}

export function saveConsent(choice: Partial<Omit<ConsentState, 'decided'>>) {
  current = { ...DEFAULT_STATE, ...choice, decided: true };
  settingsOpen = false;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ analytics: current.analytics, marketing: current.marketing, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
  emit();
}

export function openCookieSettings() {
  settingsOpen = true;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useConsent() {
  return useSyncExternalStore(subscribe, () => current, () => DEFAULT_STATE);
}

export function useCookieSettingsOpen() {
  return useSyncExternalStore(subscribe, () => settingsOpen, () => false);
}
