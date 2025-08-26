import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { hotReloadPlugin } from "./vite-plugin-hot-reload";

// https://vite.dev/config/
export default defineConfig({
  base: "http://localhost:5500/",
  plugins: [vue(), hotReloadPlugin({ port: 6621 })],
});
