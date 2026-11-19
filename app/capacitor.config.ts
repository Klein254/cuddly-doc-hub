import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vectortechnical.dochub',
  appName: 'Vector Doc Hub',
  webDir: 'dist',
  backgroundColor: '#f6f5f2',
  android: {
    backgroundColor: '#f6f5f2',
  },
  plugins: {
    // Status-bar icons follow the app theme (set at runtime in src/lib/theme.ts); safe-area sizes exposed to CSS as --safe-area-inset-*.
    SystemBars: { style: 'DEFAULT', insetsHandling: 'css' },
  },
};

export default config;
