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
  base: process.env.NODE_ENV === "production" ? "/mycal/" : "/",
  server: {
    proxy: {
      // Match all API endpoints with a single rule
      "^/api/.*": {
        target: "http://localhost:3005",
        changeOrigin: true,
      },
    },
  },
});
