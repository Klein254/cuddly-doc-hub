import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vectortechnical.dochub',
  appName: 'Vector Doc Hub',
  webDir: 'dist',
  backgroundColor: '#07080a',
  android: {
    backgroundColor: '#07080a',
  },
  plugins: {
    // Light status-bar icons over the dark app; safe-area sizes exposed to CSS as --safe-area-inset-*.
    SystemBars: { style: 'DARK', insetsHandling: 'css' },
  },
};

export default config;
