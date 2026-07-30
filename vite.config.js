import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v22.js`,
        chunkFileNames: `assets/[name]-[hash]-v22.js`,
        assetFileNames: `assets/[name]-[hash]-v22.[ext]`
      }
    }
  }
};
