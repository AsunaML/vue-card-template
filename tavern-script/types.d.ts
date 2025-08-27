// SillyTavern 环境类型定义

declare global {
  // SillyTavern 事件系统
  function eventOn(eventName: string, callback: (...args: any[]) => void): void;
  function eventEmit(eventName: string, ...args: any[]): void;

  // jQuery (简化版)
  interface JQuery {
    attr(name: string, value?: string): JQuery;
    css(props: Record<string, string | number>): JQuery;
    addClass(className: string): JQuery;
    append(element: JQuery | HTMLElement): JQuery;
    fadeOut(duration?: number, callback?: () => void): JQuery;
    remove(): void;
    is(selector: string): boolean;
    on(event: string, handler: (e: any) => void): JQuery;
    off(event: string): JQuery;
  }

  interface JQueryStatic {
    (selector: string): JQuery;
    <T extends HTMLElement>(element: T): JQuery;
    (html: string): JQuery;
  }

  const $: JQueryStatic;

  interface Window {
    vueModalController?: any;
  }
}