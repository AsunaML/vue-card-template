/**
 * Vue Modal Controller for SillyTavern
 * 
 * 这个脚本在 SillyTavern 的酒馆助手中运行，负责：
 * 1. 监听来自 trigger.html 的事件
 * 2. 创建全屏 iframe 加载 Vue 应用
 * 3. 处理 postMessage 通信以关闭悬浮窗
 * 
 * 使用方法：
 * 1. 将此文件内容复制到 SillyTavern 的酒馆助手脚本中
 * 2. 确保 Vue 应用在 http://localhost:5500 运行
 * 3. 在聊天中加载 trigger.html 触发悬浮窗
 */

/// <reference path="./types.d.ts" />

function assert<T>(value: T | null | undefined, msg = "Unexpected null/undefined"): T {
  if (value == null) {
    throw new Error(msg);
  }
  return value;
}

interface VueModalConfig {
    modalUrl: string;
    eventName: string;
    debugMode: boolean;
}

class VueModalController {
    private config: VueModalConfig;
    private currentModal: JQuery | null = null;
    private messageListener: ((event: MessageEvent) => void) | null = null;

    constructor(config?: Partial<VueModalConfig>) {
        this.config = {
            modalUrl: 'http://localhost:5500/',
            eventName: 'vue_modal:show',
            debugMode: true,
            ...config
        };

        this.initialize();
    }

    private initialize(): void {
        this.log('Vue Modal Controller 初始化...');
        
        // 检查环境
        if (!this.checkEnvironment()) {
            return;
        }

        // 注册事件监听
        this.registerEventListeners();
        
        this.log('Vue Modal Controller 初始化完成');
    }

    private checkEnvironment(): boolean {
        // 检查 SillyTavern 事件系统
        if (typeof eventOn === 'undefined' || typeof eventEmit === 'undefined') {
            console.error('[Vue Modal] SillyTavern 事件系统不可用');
            return false;
        }

        // 检查 jQuery
        if (typeof $ === 'undefined') {
            console.error('[Vue Modal] jQuery 不可用');
            return false;
        }

        // 测试DOM操作能力（而不是检查window环境）
        try {
            // 创建一个测试元素来验证DOM操作权限
            const $testElement = $('<div>').css({ display: 'none' });
            $('body').append($testElement);
            $testElement.remove();
            this.log('DOM操作权限验证通过 ✓');
        } catch (error) {
            console.error('[Vue Modal] DOM操作权限不足:', error);
            return false;
        }

        this.log('环境检查通过 ✓');
        return true;
    }

    private registerEventListeners(): void {
        // 监听来自 trigger.html 的事件
        eventOn(this.config.eventName, () => {
            this.log(`收到事件: ${this.config.eventName}`);
            this.showModal();
        });

        // 监听来自 Vue 应用的 postMessage
        this.messageListener = (event: MessageEvent) => {
            this.handlePostMessage(event);
        };
        
        assert(window.top).addEventListener('message', this.messageListener);

        this.log(`事件监听器注册完成: ${this.config.eventName}`);
    }

    private handlePostMessage(event: MessageEvent): void {
        // 安全检查：验证消息来源
        const allowedOrigins = [
            'http://localhost:5500',
            'http://127.0.0.1:5500'
        ];

        if (!allowedOrigins.includes(event.origin)) {
            return; // 忽略不信任的消息
        }

        const { type, data } = event.data || {};

        switch (type) {
            case 'CLOSE_MODAL':
                this.log('收到关闭悬浮窗请求');
                this.hideModal();
                break;
            
            case 'MODAL_READY':
                this.log('Vue 应用已就绪');
                break;
                
            case 'MODAL_ERROR':
                this.log(`Vue 应用错误: ${data?.message || '未知错误'}`, 'error');
                break;
                
            default:
                this.log(`未知消息类型: ${type}`);
        }
    }

    public showModal(): void {
        this.log('显示 Vue 悬浮窗...');

        // 如果已有悬浮窗，先关闭
        if (this.currentModal) {
            this.hideModal();
        }

        try {
            // 创建悬浮窗容器
            const $modalContainer = $('<div>')
                .addClass('vue-modal-container')
                .css({
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 99999,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(5px)'
                });

            // 创建 iframe
            const $iframe = $('<iframe>')
                .addClass('vue-modal-iframe')
                .attr({
                    src: this.config.modalUrl,
                    sandbox: 'allow-scripts', // 安全的 sandbox 设置
                    title: 'Vue Character Card Modal'
                })
                .css({
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: 'transparent'
                });

            // 组装并添加到页面
            $modalContainer.append($iframe);
            $('body').append($modalContainer);

            // 保存引用
            this.currentModal = $modalContainer;

            // 添加键盘事件监听（ESC 关闭）
            $(document).on('keydown.vue-modal', (e) => {
                if (e.key === 'Escape') {
                    this.hideModal();
                }
            });

            this.log('Vue 悬浮窗显示成功 ✓');

        } catch (error) {
            this.log(`显示悬浮窗失败: ${error}`, 'error');
        }
    }

    public hideModal(): void {
        if (!this.currentModal) {
            return;
        }

        this.log('关闭 Vue 悬浮窗...');

        try {
            // 移除键盘事件监听
            $(document).off('keydown.vue-modal');

            // 添加淡出动画
            this.currentModal.fadeOut(200, () => {
                this.currentModal?.remove();
                this.currentModal = null;
                this.log('Vue 悬浮窗已关闭 ✓');
            });

        } catch (error) {
            this.log(`关闭悬浮窗失败: ${error}`, 'error');
            
            // 强制移除
            this.currentModal.remove();
            this.currentModal = null;
        }
    }

    public isModalVisible(): boolean {
        return this.currentModal !== null && this.currentModal.is(':visible');
    }

    public destroy(): void {
        this.log('销毁 Vue Modal Controller...');

        // 关闭悬浮窗
        this.hideModal();

        // 移除事件监听
        if (this.messageListener) {
            assert(window.top).removeEventListener('message', this.messageListener);
            this.messageListener = null;
        }

        // 注意：SillyTavern 的 eventOn 可能没有对应的 eventOff，
        // 所以这里不能取消事件注册

        this.log('Vue Modal Controller 已销毁');
    }

    private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        if (!this.config.debugMode) {
            return;
        }

        const prefix = '[Vue Modal Controller]';
        const timestamp = new Date().toLocaleTimeString();
        const fullMessage = `${prefix} [${timestamp}] ${message}`;

        switch (level) {
            case 'warn':
                console.warn(fullMessage);
                break;
            case 'error':
                console.error(fullMessage);
                break;
            default:
                console.log(fullMessage);
        }
    }
}

// 全局实例将通过 window.vueModalController 暴露

// 自动初始化
(function() {
    // 防止重复初始化
    if (window.vueModalController) {
        console.log('[Vue Modal] 控制器已存在，销毁旧实例...');
        window.vueModalController.destroy();
    }

    // 创建新实例
    window.vueModalController = new VueModalController();
    
    console.log('[Vue Modal] 控制器已就绪，等待触发事件...');
})();

// 注意：在浏览器环境中，类型和类通过全局变量暴露
// VueModalController 类可通过 window.vueModalController 访问