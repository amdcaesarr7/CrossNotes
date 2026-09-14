import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Sensible defaults — no throws. PORT and BASE_PATH are injected by the
// artifact workflow on Replit; outside Replit they fall back to safe values
// so `pnpm build` (and any other env) works with zero configuration.
const port = Number(process.env.PORT) || 5173;
const basePath = process.env.BASE_PATH || '/';

// All three Replit dev-only plugins are conditional on REPL_ID so they are
// simply absent in every non-Replit environment (CI, Docker, Vercel, etc.).
const replitPlugins =
  process.env.REPL_ID !== undefined
    ? await Promise.all([
        import('@replit/vite-plugin-runtime-error-modal').then((m) => m.default()),
        ...(process.env.NODE_ENV !== 'production'
          ? [
              import('@replit/vite-plugin-cartographer').then((m) =>
                m.cartographer({ root: path.resolve(import.meta.dirname, '..') }),
              ),
              import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
            ]
          : []),
      ])
    : [];

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(import.meta.dirname, '..', '..', 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase SDK → its own chunk (large, loaded once, cached)
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          // React + react-dom → separate stable chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          // Tanstack / Radix / Lucide / other UI libs → vendor chunk
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/@radix-ui') ||
              id.includes('node_modules/lucide-react') || id.includes('node_modules/sonner') ||
              id.includes('node_modules/wouter') || id.includes('node_modules/framer-motion')) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
