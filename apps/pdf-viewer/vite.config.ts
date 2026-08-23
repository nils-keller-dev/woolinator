import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

function emitTsModule() {
  return {
    name: 'emit-ts-module',
    closeBundle() {
      const html = readFileSync(resolve(__dirname, 'dist/index.html'), 'utf-8')
      writeFileSync(
        resolve(__dirname, 'dist/viewerHtml.ts'),
        `export default ${JSON.stringify(html)}`,
      )
      const types = readFileSync(resolve(__dirname, 'src/types.ts'), 'utf-8')
      writeFileSync(resolve(__dirname, 'dist/types.ts'), types)
    },
  }
}

export default defineConfig({
  plugins: [react(), viteSingleFile(), emitTsModule()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
})
