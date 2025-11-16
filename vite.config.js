import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { apiPlugin } from './vite-plugin-api.js'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    apiPlugin(),
    // 在 build 時複製 words.json 到 public 目錄
    {
      name: 'copy-words-json',
      buildStart() {
        const srcFile = join(__dirname, 'src', 'data', 'words.json')
        const destDir = join(__dirname, 'public', 'data')
        const destFile = join(destDir, 'words.json')
        
        if (existsSync(srcFile)) {
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true })
          }
          copyFileSync(srcFile, destFile)
          console.log('已複製 words.json 到 public/data/')
        }
      }
    }
  ],
})
