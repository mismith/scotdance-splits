import { URL, fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue(), tailwindcss(), process.env.ANALYZE ? visualizer({ open: true }) : null],
  resolve: {
    alias: [
      // e2e tests send to an in-memory ScotDance.app, never Firebase
      ...(mode === 'e2e'
        ? [
            {
              find: /^@\/lib\/scotdance-firebase$/,
              replacement: fileURLToPath(
                new URL('./src/lib/scotdance-firebase.fake.ts', import.meta.url),
              ),
            },
          ]
        : []),
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
}))
