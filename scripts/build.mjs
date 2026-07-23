import { build } from 'vite';
import react from '@vitejs/plugin-react';

async function runBuild() {
  try {
    console.log('Iniciando compilación de Haedo Futsal App...');
    await build({
      plugins: [react()],
      build: {
        outDir: 'dist',
        emptyOutDir: true
      }
    });
    console.log('✅ Compilación completada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la compilación:', error);
    process.exit(1);
  }
}

runBuild();
