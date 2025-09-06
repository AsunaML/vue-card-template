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
  MessageHandlerContext,
  MessageBus,
  MessageBusConfig,
  HandlerRegistry,
} from './types'

// 错误类型
export {
  MessageHandler,
  MessageBusError,
  MessageTimeoutError,
  MessageHandlerError
} from './types'

// 核心实现
export { MessageBusImpl } from './MessageBus'
export { 
  HandlerRegistryImpl,
} from './registry'