import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'booknest-react-devtools',
      transformIndexHtml(html) {
        return process.env.BOOKNEST_REACT_DEVTOOLS === '1'
          ? html.replace('<head>', '<head><script src="http://127.0.0.1:8097"></script>')
          : html;
      },
    },
  ],
})
