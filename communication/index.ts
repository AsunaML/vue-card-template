/**
 * Communication Architecture - 统一导出
 * 
 * PostMessage 通信架构的主要入口点
 * 导出所有核心组件和便捷函数
 */

// 核心类型定义
export type {
  BaseMessage,
  MessageReply,
  CloseModalMessage,
  ModalReadyMessage,
  ModalErrorMessage,
  DataSyncMessage,
  MessageHandler,
  MessageHandlerContext,
  MessageBus,
  MessageBusConfig,
  HandlerRegistry,
  MessageHandlerFactory
} from './types'

// 错误类型
export {
  MessageBusError,
  MessageTimeoutError,
  MessageHandlerError
} from './types'

// 核心实现
export { MessageBusImpl } from './MessageBus'
export { 
  HandlerRegistryImpl,
  MessageHandlerFactoryImpl,
  createHandlerRegistry,
  createHandlerFactory
} from './registry'

// 消息处理器
export {
  CloseModalHandler,
  ModalReadyHandler,
  ErrorHandler,
  handlerCreators,
  createAllHandlers,
  createHandlerByType
} from './handlers'

// 便捷创建函数
import { MessageBusImpl } from './MessageBus'
import { createHandlerRegistry } from './registry'
import { createAllHandlers } from './handlers'
import type { MessageBusConfig, MessageBus, HandlerRegistry } from './types'

/**
 * 创建完整的 MessageBus 实例（包含默认处理器）
 */
export function createMessageBus(config: Partial<MessageBusConfig> = {}): {
  messageBus: MessageBus
  handlerRegistry: HandlerRegistry
} {
  const handlerRegistry = createHandlerRegistry()
  const messageBus = new MessageBusImpl(config, handlerRegistry)
  
  // 注册默认处理器
  const handlers = createAllHandlers()
  handlers.forEach(handler => messageBus.registerHandler(handler))
  
  return { messageBus, handlerRegistry }
}

/**
 * 创建服务端 MessageBus（用于 tavern-script）
 */
export function createServerMessageBus(config: Partial<MessageBusConfig> = {}): {
  messageBus: MessageBus
  handlerRegistry: HandlerRegistry
} {
  return createMessageBus({
    environment: 'server',
    debugMode: true,
    allowedOrigins: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    ...config
  })
}

/**
 * 创建客户端 MessageBus（用于 Vue 应用）
 */
export function createClientMessageBus(config: Partial<MessageBusConfig> = {}): {
  messageBus: MessageBus
  handlerRegistry: HandlerRegistry
} {
  return createMessageBus({
    environment: 'client',
    debugMode: true,
    allowedOrigins: ['*'], // 客户端通常接受来自任何来源的消息
    ...config
  })
}

/**
 * 简化的消息发送函数
 */
export async function sendCloseModal(messageBus: MessageBus, reason?: string): Promise<void> {
  await messageBus.send({
    type: 'CLOSE_MODAL',
    data: reason ? { reason } : undefined
  })
}

export async function sendModalReady(
  messageBus: MessageBus, 
  clientInfo?: { width: number; height: number; userAgent: string }
): Promise<void> {
  await messageBus.send({
    type: 'MODAL_READY',
    data: clientInfo ? { clientInfo } : undefined
  })
}

export async function sendModalError(
  messageBus: MessageBus, 
  error: Error | string,
  stack?: string
): Promise<void> {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? stack : error.stack
  
  await messageBus.send({
    type: 'MODAL_ERROR',
    data: {
      message: errorMessage,
      stack: errorStack
    }
  })
}