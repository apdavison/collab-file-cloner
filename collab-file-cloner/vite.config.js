import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  //base: "/",
  plugins: [react()],
  assetsInclude: ["**/*.njk"],
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8", // or "istanbul"
    },
    setupFiles: ["./__tests__/setup.js"],
  },
});
