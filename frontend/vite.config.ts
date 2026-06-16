import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
// import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { resolve } from 'path';
import modulePreload from './vite-plugins/module-preload'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.OSS_BASE_URL || '/',
    plugins: [
      react(),
      tailwindcss(),
      // ViteImageOptimizer({
      //   png: { quality: 85 },
      //   jpeg: { quality: 85 },
      //   jpg: { quality: 85 },
      //   webp: { quality: 80 },
      //   avif: { quality: 70 },
      //   svg: {
      //     multipass: true,
      //   },
      // }),
      modulePreload({
        entries: [
          '@/components/AppCenterLayout',
          '@/routes/AppCenter',
          '@/routes/Subscription',
          '@/routes/ChartList',
          // '@/routes/Task',
        ],
      }),
    ],
    build: {
      cssMinify: 'esbuild',
      commonjsOptions: {
        strictRequires: true
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'), // 将 @ 指向 src 目录
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.API_TARGET,
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/oss-proxy': {
          target: 'http://nemo-copilot.oss-cn-hangzhou.aliyuncs.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/oss-proxy/, ''),
        },
      }
    }
  }
})
