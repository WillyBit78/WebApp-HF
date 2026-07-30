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
        entryFileNames: `assets/[name]-[hash]-v11.js`,
        chunkFileNames: `assets/[name]-[hash]-v11.js`,
        assetFileNames: `assets/[name]-[hash]-v11.[ext]`
      }
    }
  }
};
