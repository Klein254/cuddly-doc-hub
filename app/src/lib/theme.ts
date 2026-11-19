import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { useSyncExternalStore } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'vdh-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set<() => void>();

const read = (): ThemePref => {
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
};

let pref = read();

/** Sets html[data-theme] and the browser/OS chrome colour to match. */
function apply() {
  const dark = pref === 'dark' || (pref === 'system' && media.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e0e0f' : '#f6f5f2');
  // Android app: light status-bar icons on the dark theme, dark icons on the light one.
  if (Capacitor.isNativePlatform()) SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
}

export function initTheme() {
  apply();
  media.addEventListener('change', () => pref === 'system' && apply());
}

export function setTheme(next: ThemePref) {
  pref = next;
  if (next === 'system') localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, next);
  apply();
  listeners.forEach((l) => l());
}

export const useTheme = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pref,
  );
