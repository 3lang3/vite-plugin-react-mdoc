import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import mdoc from 'vite-plugin-react-mdoc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mdoc()]
})