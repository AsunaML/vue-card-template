import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// 自定义插件：构建后组织文件结构
const organizeDistPlugin = () => {
  return {
    name: 'organize-dist',
    async writeBundle() {
      try {
        const distDir = resolve(__dirname, 'dist');
        const modalDir = resolve(distDir, 'modal');
        const scriptsDir = resolve(distDir, 'scripts');
        
        // 创建子目录
        mkdirSync(modalDir, { recursive: true });
        mkdirSync(scriptsDir, { recursive: true });
        
        console.log('📦 编译和打包 Tavern Scripts...');
        
        // 1. 使用 esbuild 打包成单文件 (推荐方式)
        try {
          execSync('node scripts/bundle-tavern-script.js', { 
            stdio: 'inherit',
            cwd: __dirname 
          });
          console.log('✅ 单文件打包完成');
        } catch (error) {
          console.warn('⚠ 单文件打包失败，回退到 TypeScript 编译');
          
          // 2. 回退：传统 TypeScript 编译 (兼容性)
          try {
            execSync('npx tsc --project tsconfig.scripts.json --noEmitOnError false', { 
              stdio: 'inherit',
              cwd: __dirname 
            });
            console.log('✓ TypeScript 脚本编译完成 (回退模式)');
          } catch (tsError) {
            console.warn('⚠ TypeScript 脚本有类型错误，但JS文件已生成');
          }
        }
        
        // 复制 trigger.html 到 modal 目录
        copyFileSync(
          resolve(__dirname, 'trigger.html'),
          resolve(modalDir, 'trigger.html')
        );
        
        // 移动 index.html 和 assets 到 modal 目录
        const fs = await import('fs');
        if (existsSync(resolve(distDir, 'index.html'))) {
          fs.renameSync(
            resolve(distDir, 'index.html'),
            resolve(modalDir, 'index.html')
          );
        }
        
        if (existsSync(resolve(distDir, 'assets'))) {
          fs.renameSync(
            resolve(distDir, 'assets'),
            resolve(modalDir, 'assets')
          );
        }
        
        // 更新 modal/index.html 中的资源路径
        if (existsSync(resolve(modalDir, 'index.html'))) {
          let indexContent = fs.readFileSync(resolve(modalDir, 'index.html'), 'utf8');
          indexContent = indexContent.replace(/\/assets\//g, './assets/');
          fs.writeFileSync(resolve(modalDir, 'index.html'), indexContent);
        }
        
        console.log('✓ 文件结构组织完成: dist/modal/ 和 dist/scripts/');
        console.log('📁 Modal files: dist/modal/');
        console.log('📁 Script files: dist/scripts/');
      } catch (error) {
        console.warn('⚠ 组织文件结构失败:', error);
      }
    }
  };
};

// https://vite.dev/config/
export default defineConfig({
  base: "http://localhost:5500/",
  plugins: [
    vue(), 
    organizeDistPlugin()
  ],
  
  // 开发服务器配置
  server: {
    host: '127.0.0.1',
    port: 5500,
    cors: true, // 允许跨域请求，支持 postMessage 通信
    fs: {
      strict: false
    }
  },
  
  // 构建配置
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  
  // 确保静态文件可以被正确serve
  publicDir: 'public',
});
