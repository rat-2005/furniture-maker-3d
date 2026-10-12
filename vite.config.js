import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative assets paths work on GitHub Pages and static deployments
  server: {
    host: true, // Allows access from mobile devices on the same local network
    port: 5173
  }
});
