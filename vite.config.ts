import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Allows access from LAN (binds to 0.0.0.0)
    port: parseInt(process.env.VITE_PORT || "8888"),
    // HMR configuration for LAN access
    hmr: {
      // Use client's hostname (auto-detects: localhost, IP, or mDNS)
      clientPort: undefined,
      // Protocol auto-detection
      protocol: 'ws',
    },
    // Allow Caddy proxy hostnames
    allowedHosts: ["celesteos", "celesteos.local", ".local", ".celeste7.ai"],
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [
    react(),
    ...(mode === 'development' ? [expressPlugin()] : []), // Only use Express plugin in dev mode
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        globIgnores: ['**/background.png', '**/DAKR MODE BACKGROUND.png'] // Exclude large background images
      },
      includeAssets: ['favicon.ico', 'Logo.png', 'icons/*.png'],
      manifest: {
        name: 'CelesteOS',
        short_name: 'CelesteOS',
        description: 'AI-powered yacht management system',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: '/Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false // Disable SW in development to avoid conflicts
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Lazy load server to avoid build-time import
      const { createServer } = require("./server");
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
