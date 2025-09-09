import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the fuerza app.
// See https://vitejs.dev/config/ for details.
export default defineConfig({
  plugins: [react()],
  // Define the root of the application to be the project root.
  root: '.',
  // Build configuration: output directory is `dist` by default.
});