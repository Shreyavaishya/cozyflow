import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // "prompt": a new version waits until the user taps Reload, so an update can never restart a running timer.
      registerType: "prompt",
      injectRegister: false, // registered in src/main.tsx (production only)
      includeAssets: ["favicon.ico", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Cozy Flow",
        short_name: "Cozy Flow",
        description: "An aesthetic Pomodoro timer with cozy scenes, ambient sounds, streaks and a leaderboard.",
        id: "/app",
        start_url: "/app",
        scope: "/",
        display: "standalone",
        background_color: "#f8f2eb",
        theme_color: "#f8f2eb",
        categories: ["productivity", "education", "lifestyle"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Start focusing", short_name: "Focus", url: "/app", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        // Precache the app shell. Sounds (large, streamed in ranges) and the share image are deliberately left out.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        globIgnores: ["sounds/**", "og.png"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//], // payment and webhook routes must always hit the server
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Font files are many and only loaded on demand: cache them as they are used.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.endsWith(".woff2"),
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        // Libraries every page needs get their own long-lived files, so a deploy that only changes our code
        // does not make returning visitors download React, animation and Supabase again.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // tslib is used by both Supabase and the dialog library. Left alone, the build parks it inside the
          // Supabase file, so every page with a dialog would download all of Supabase. Its own tiny file avoids that.
          if (id.includes("node_modules/tslib/")) return "vendor-tslib";
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "vendor-react";
          if (/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(id)) return "vendor-router";
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return "vendor-motion";
          if (id.includes("node_modules/@supabase/")) return "vendor-supabase";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));