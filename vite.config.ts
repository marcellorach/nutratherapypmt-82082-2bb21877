import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Plugin to run translation audit automatically
function translationAuditPlugin() {
  let hasRun = false;
  
  return {
    name: 'translation-audit',
    async buildStart() {
      if (!hasRun) {
        console.log('\n🔍 Running translation audit...\n');
        try {
          const { stdout, stderr } = await execAsync('npx tsx scripts/audit-translations.ts');
          if (stdout) console.log(stdout);
          if (stderr) console.error(stderr);
          hasRun = true;
          console.log('✅ Translation audit complete\n');
        } catch (error: any) {
          console.error('⚠️  Translation audit encountered issues\n');
        }
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    translationAuditPlugin(),
  ].filter(Boolean),
  resolve: {
    // IMPORTANT: order matters (three alias would otherwise catch three/webgpu)
    alias: [
      {
        find: 'three/webgpu',
        replacement: path.resolve(__dirname, './src/lib/three-webgpu-stub.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: 'three',
        replacement: path.resolve(__dirname, 'node_modules/three'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['three/webgpu'],
  },
}));
