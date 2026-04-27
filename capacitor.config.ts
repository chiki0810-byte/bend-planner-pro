import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c574d4a9bb59448a96e28a3b748d759b',
  appName: 'Calculadora de Plegado',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      iosIsEncryption: false,
      electronIsEncryption: false,
    },
  },
};

export default config;
