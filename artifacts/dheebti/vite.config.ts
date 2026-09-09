import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// BASE_PATH is optional, defaults to '/' for Railway
const basePath = process.env.BASE_PATH || '/';

// VITE_API_URL defaults to current origin for Railway
const apiUrl = process.env.VITE_API_URL || '';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

function injectFirebaseServiceWorkerConfig() {
  return {
    name: 'inject-firebase-service-worker-config',
    closeBundle() {
      const outputPath = path.resolve(import.meta.dirname, 'dist/public/firebase-messaging-sw.js');
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId || !firebaseConfig.appId) {
        throw new Error('Missing VITE_FIREBASE_* variables required for Firebase Messaging service worker');
      }
      const source = fs.readFileSync(outputPath, 'utf8');
      fs.writeFileSync(outputPath, source.replace('__FIREBASE_CONFIG__', JSON.stringify(firebaseConfig)));
    },
  };
}

export default defineConfig({
  // Expose env variables to client
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
  },
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    injectFirebaseServiceWorkerConfig(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
