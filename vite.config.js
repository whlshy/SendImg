import {
  defineConfig,
} from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from 'path';
import fs from 'fs';

// 根據環境選擇配置文件
const isDev = process.env.NODE_ENV === 'development';
const configFileName = isDev ? 'config.dev.json' : 'config.json';
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, configFileName), 'utf-8'));
const {
  title
} = config;

export default defineConfig(({
  mode
}) => {
  const isProd = mode === 'production'

  return {
    server: {
      host: true,
      port: 1001,
      fs: {
        strict: false, // 這有時候會解決路徑問題
      },
      historyApiFallback: true, // 對於 React Router，開啟這個選項以處理瀏覽器直接訪問子路由
    },
    base: isProd ? '/SendImg/' : '/', // 公共路徑
    plugins: [
      react(), // 使用 React 插件
      create404Plugin()
    ],
    resolve: {
      alias: {
        '@': '/src', // 簡化導入
        Config: path.resolve(__dirname, configFileName), // 根據環境選擇配置文件
      },
      extensions: ['.js', '.jsx', '.styl'], // 自定義擴展名
    },
    css: {
      preprocessorOptions: {
        stylus: {
          // Stylus 的配置選項（如有需要）
        },
      },
    },
    define: {
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        TITLE: JSON.stringify(title), // 將 title 變數傳遞到前端
      },
    },
    assetsInclude: ['**/*.svg', '**/*.png', '**/*.mp4'], // 包括圖像資產
    build: {
      outDir: 'docs',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return id.toString().split("node_modules/")[1].split("/")[0].toString();
            }
          },
        },
      },
    },
  }
});

// 自動複製 index.html 為 404.html
function create404Plugin() {
  return {
    name: 'create-404-plugin',
    closeBundle() {
      const indexPath = path.resolve(__dirname, 'docs/index.html')
      const notFoundPath = path.resolve(__dirname, 'docs/404.html')

      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath)
        console.log('✅ Copied index.html → 404.html')
      } else {
        console.warn('⚠️ index.html not found after build')
      }
    }
  }
}