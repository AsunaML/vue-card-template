#!/usr/bin/env node
/**
 * Bundle tavern-script into a single JavaScript file
 * 
 * This script uses esbuild to bundle all tavern-script dependencies
 * into a single file that can be easily deployed to SillyTavern.
 */

import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

async function bundleTavernScript() {
  console.log('📦 Bundling tavern-script into single file...');
  
  try {
    const result = await build({
      // 入口文件
      entryPoints: [resolve(projectRoot, 'tavern-script/ModalController.ts')],
      
      // 输出配置
      bundle: true,                    // 打包所有依赖
      outfile: resolve(projectRoot, 'dist/scripts/ModalController-bundle.js'),
      
      // 平台配置
      platform: 'browser',            // 浏览器环境
      target: 'es2020',               // 目标ES版本
      format: 'iife',                 // 立即执行函数表达式，避免模块系统
      
      // 优化配置
      minify: false,                  // 不压缩，方便调试
      sourcemap: false,               // 不生成sourcemap
      metafile: false,                // 不生成元数据文件
      
      // 代码分割
      splitting: false,               // 不分割代码
      
      // 外部依赖处理
      external: [],                   // 不排除任何依赖，全部打包
      
      // 全局变量定义（SillyTavern环境）
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      
      // TypeScript 支持
      loader: {
        '.ts': 'ts',
        '.js': 'js'
      },
      
      // 解析配置
      resolveExtensions: ['.ts', '.js'],
      
      // 日志配置
      logLevel: 'info',
      
      // 输出格式配置
      globalName: 'VueModalController',  // 全局变量名
      
      // 构建完成后的处理
      plugins: [{
        name: 'build-finished',
        setup(build) {
          build.onEnd(result => {
            if (result.errors.length === 0) {
              console.log('✅ Tavern-script bundled successfully!');
              console.log('📁 Output: dist/scripts/modal-controller-bundle.js');
            } else {
              console.error('❌ Bundle failed with errors:', result.errors);
            }
          });
        }
      }]
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Bundle error:', error);
    throw error;
  }
}

// 如果直接运行此脚本
const scriptPath = fileURLToPath(import.meta.url);
const runPath = process.argv[1];

if (scriptPath === runPath) {
  bundleTavernScript().catch(error => {
    console.error('❌ Bundle failed:', error);
    process.exit(1);
  });
}

export { bundleTavernScript };