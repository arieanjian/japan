import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";

import { apiPlugin } from "./vite-plugin-api.js";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    apiPlugin(),
    // 在 build 時複製 words.json 到 public 目錄
    {
      name: "copy-words-json",
      buildStart() {
        const srcFile = join(__dirname, "src", "data", "words.json");
        const destDir = join(__dirname, "public", "data");
        const destFile = join(destDir, "words.json");

        if (existsSync(srcFile)) {
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          copyFileSync(srcFile, destFile);
          console.log("已複製 words.json 到 public/data/");
        }
      },
    },
  ],
  preview: {
    host: "0.0.0.0",
    // PORT 會通過命令行參數傳遞，這裡設置默認值
    port: 4173,
    allowedHosts: [
      "japan-2.onrender.com",
      ".onrender.com", // 允許所有 Render.com 子域名
    ],
  },
});
