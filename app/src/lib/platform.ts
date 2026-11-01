import { Capacitor } from '@capacitor/core';

/** Running inside the Windows/Mac desktop app (Tauri). */
export const isDesktopApp = '__TAURI_INTERNALS__' in window;

/** Running inside the Android app (Capacitor). */
export const isAndroidApp = Capacitor.isNativePlatform();

export const isNativeApp = isDesktopApp || isAndroidApp;
