import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: process.env.NODE_ENV === "production" ? "/gsp-calc/" : "/",
  server: {
    proxy: {
      "/trajectory": {
        target: "http://localhost:3005",
        changeOrigin: true,
      },
      "/suggestShot": {
        target: "http://localhost:3005",
        changeOrigin: true,
      },
    },
  },
});
