import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// .env is a symlink to ../envs/shared/.env

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The precaching SW served a stale index.html for every navigation, so
      // users on an old build hit the "New Version Released" prompt in a loop.
      // Ship a self-destroying SW that unregisters itself and clears caches.
      selfDestroying: true,
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true, // Clean old caches
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Qarhami Portal",
        short_name: "QarhamiPortal",
        description: "Admin portal for Qarhami",
        theme_color: "#8b5cf6",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api/openphone": {
        target: "https://api.openphone.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openphone/, ""),
      },
    },
  },
});
