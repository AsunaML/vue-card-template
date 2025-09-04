/**
 * Vue Modal Controller v2 - 使用新的通信架构
 * 
 * 基于 MessageBus 架构的模态框控制器
 * 支持类型安全的消息通信和扩展性处理
 */

/// <reference path="./types.d.ts" />

// 导入新的通信架构
import { createServerMessageBus, type MessageBus, type HandlerRegistry } from '../communication'

function assert<T>(value: T | null | undefined, msg = "Unexpected null/undefined"): T {
  if (value == null) {
    throw new Error(msg);
  }
  return value;
}

interface VueModalConfig {
    modalUrl: string;
    debugMode: boolean;
}

class VueModalControllerV2 {
    private config: VueModalConfig;
    private currentModal: JQuery | null = null;
    private messageBus: MessageBus | null = null;
    private handlerRegistry: HandlerRegistry | null = null;

    constructor(config?: Partial<VueModalConfig>) {
        this.config = {
            modalUrl: 'http://localhost:5500/',
            debugMode: true,
            ...config
        };

        this.initialize();
    }

    private async initialize(): Promise<void> {
        this.log('Vue Modal Controller v2 初始化...');
        
        // 检查环境
        if (!this.checkEnvironment()) {
            return;
        }

        // 初始化消息总线
        await this.initializeMessageBus();

        // 注册 SillyTavern 事件监听
        this.registerEventListeners();
        
        this.log('Vue Modal Controller v2 初始化完成');
    }

    private async initializeMessageBus(): Promise<void> {
        try {
            this.log('初始化服务端消息总线...');
            
            // 创建服务端消息总线
            const { messageBus, handlerRegistry } = createServerMessageBus({
                debugMode: this.config.debugMode,
                allowedOrigins: [new URL(this.config.modalUrl).origin]
            });

            this.messageBus = messageBus;
            this.handlerRegistry = handlerRegistry;

            this.log('消息总线初始化成功');

        } catch (error) {
            this.log(`消息总线初始化失败: ${error}`, 'error');
            throw error;
        }
    }

    private checkEnvironment(): boolean {
        // 检查 SillyTavern 事件系统
        if (typeof eventOn === 'undefined' || typeof eventEmit === 'undefined') {
            this.log('SillyTavern 事件系统不可用', 'error');
            return false;
        }

        // 检查 jQuery
        if (typeof $ === 'undefined') {
            this.log('jQuery 不可用', 'error');
            return false;
        }

        // 测试DOM操作能力
        try {
            const $testElement = $('<div>').css({ display: 'none' });
            $('body').append($testElement);
            $testElement.remove();
            this.log('DOM操作权限验证通过 ✓');
        } catch (error) {
            this.log(`DOM操作权限不足: ${error}`, 'error');
            return false;
        }

        this.log('环境检查通过 ✓');
        return true;
    }

    private registerEventListeners(): void {
        const eventName = 'vue_modal:show';
        
        // 监听来自 trigger.html 的事件
        eventOn(eventName, () => {
            this.log(`收到事件: ${eventName}`);
            this.showModal();
        });

        this.log(`事件监听器注册完成: ${eventName}`);
    }

    public async showModal(): Promise<void> {
        this.log('显示 Vue 悬浮窗...');

        // 如果已有悬浮窗，先关闭
        if (this.currentModal) {
            await this.hideModal();
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
                    sandbox: 'allow-scripts allow-same-origin', // 更宽松的 sandbox 以支持 postMessage
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
            throw error;
        }
    }

    public async hideModal(): Promise<void> {
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

    public async destroy(): Promise<void> {
        this.log('销毁 Vue Modal Controller v2...');

        // 关闭悬浮窗
        await this.hideModal();

        // 销毁消息总线
        if (this.messageBus) {
            this.messageBus.destroy();
            this.messageBus = null;
        }

        this.handlerRegistry = null;

        this.log('Vue Modal Controller v2 已销毁');
    }

    public log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        if (!this.config.debugMode) {
            return;
        }

        const prefix = '[Vue Modal Controller v2]';
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

    // 调试方法：获取消息总线状态
    public getMessageBusStatus(): any {
        if (!this.handlerRegistry) {
            return { status: 'not_initialized' };
        }

        return (this.handlerRegistry as any).getRegistryStatus?.() || { status: 'available' };
    }
}

// 全局实例管理（避免与原有控制器冲突）
declare global {
    interface Window {
        vueModalControllerV2?: VueModalControllerV2;
    }
}

// 自动初始化
(async function() {
    try {
        // 防止重复初始化
        if (window.vueModalControllerV2) {
            console.log('[Vue Modal v2] 控制器已存在，销毁旧实例...');
            await window.vueModalControllerV2.destroy();
        }

        // 创建新实例
        window.vueModalControllerV2 = new VueModalControllerV2();
        
        console.log('[Vue Modal v2] 控制器已就绪，等待触发事件...');
        
    } catch (error) {
        console.error('[Vue Modal v2] 初始化失败:', error);
    }
})();

// 导出用于 TypeScript 编译
export { VueModalControllerV2 };
export default VueModalControllerV2;