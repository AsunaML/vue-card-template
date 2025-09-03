/// <reference types="jquery" />

// SillyTavern 环境类型定义
declare global {
  // SillyTavern 事件系统
  function eventOn(eventName: string, callback: (...args: any[]) => void): void;
  function eventEmit(eventName: string, ...args: any[]): void;

  // 扩展 Window 接口以支持自定义属性
  interface Window {
    vueModalController?: any;
  }
}

// 确保这个文件被当作模块处理
export {};