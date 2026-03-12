import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/frontend-assets/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
  },
});
