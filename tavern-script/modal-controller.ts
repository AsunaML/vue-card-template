/**
 * Vue Modal Controller v2 - 使用新的通信架构
 * 
 * 基于 MessageBus 架构的模态框控制器
 * 支持类型安全的消息通信和扩展性处理
 */

/// <reference path="./types.d.ts" />

// 导入新的通信架构
import { MessageBusImpl, type MessageBus, type HandlerRegistry, MessageBusConfig, HandlerRegistryImpl } from '../communication'
import { createAllHandlers } from './handlers'
import { ServerContext } from './ServerContext';

interface VueModalConfig {
    modalUrl: string;
    debugMode: boolean;
}

class VueModalController {
    private config: VueModalConfig;
    private messageBus: MessageBus | null = null;
    private handlerRegistry: HandlerRegistry | null = null;
    private serverContexts: ServerContext = {
        log: this.log.bind(this),
        modalUrl: '',
        currentModal: null,
    }

    constructor(config?: Partial<VueModalConfig>) {
        this.config = {
            modalUrl: 'http://localhost:5500/',
            debugMode: true,
            ...config
        };
        
        this.serverContexts.modalUrl = this.config.modalUrl

        this.initialize();
    }

    private async initialize(): Promise<void> {
        this.log('Vue Modal Controller 初始化...');
        
        // 检查环境
        if (!this.checkEnvironment()) {
            return;
        }

        // 初始化消息总线
        await this.initializeMessageBus();
        
        this.log('Vue Modal Controller 初始化完成');
    }

    private async initializeMessageBus(): Promise<void> {
        try {
            this.log('初始化服务端消息总线...');

            const config: Partial<MessageBusConfig> = {
                environment: 'server',
                debugMode: this.config.debugMode,
                allowedOrigins: [this.config.modalUrl],
            }

            const handlerRegistry = new HandlerRegistryImpl()
            const messageBus = new MessageBusImpl(config, handlerRegistry)

            // 注册默认处理器
            const handlers = createAllHandlers(this.serverContexts)
            handlers.forEach(handler => messageBus.registerHandler(handler))

            this.messageBus = messageBus;
            this.handlerRegistry = handlerRegistry;

            this.log('服务端消息总线初始化成功');

        } catch (error) {
            this.log(`服务端消息总线初始化失败: ${error}`, 'error');
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

    public async destroy(): Promise<void> {
        this.log('销毁 Vue Modal Controller v2...');

        // 关闭悬浮窗
        // await this.hideModal();

        // 销毁消息总线
        if (this.messageBus) {
            this.messageBus.destroy();
            this.messageBus = null;
        }

        this.handlerRegistry = null;

        this.log('Vue Modal Controller 已销毁');
    }

    public log(message: string, level?: 'info' | 'warn' | 'error'): void {
        if (level === undefined) {
            level = 'info'
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
        vueModalController?: VueModalController;
    }
}

// 自动初始化
(async function() {
    try {
        // 防止重复初始化
        if (window.vueModalController) {
            console.log('[Vue Modal] 控制器已存在，销毁旧实例...');
            await window.vueModalController.destroy();
        }

        // 创建新实例
        window.vueModalController = new VueModalController();
        
        console.log('[Vue Modal] 控制器已就绪，等待触发事件...');
        
    } catch (error) {
        console.error('[Vue Modal] 初始化失败:', error);
    }
})();

// 导出用于 TypeScript 编译
export { VueModalController };
export default VueModalController;