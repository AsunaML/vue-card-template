/**
 * Message Handlers - 统一导出
 * 
 * 导出所有消息处理器，便于注册和使用
 */

export { CloseModalHandler } from './CloseModalHandler'
export { ModalReadyHandler } from './ModalReadyHandler'
export { ErrorHandler } from './ErrorHandler'

// 导出处理器创建函数，用于工厂模式
import { ServerMessageHandler } from './ServerMessageHandler'
import { CloseModalHandler } from './CloseModalHandler'
import { ModalReadyHandler } from './ModalReadyHandler'  
import { ErrorHandler } from './ErrorHandler'
import { ServerContext } from '../types'

/**
 * 创建处理器的工厂函数映射
 */

// 选择简单直观的 for 循环来避免多重 Object.fromEntries, Object.entries, map 的嵌套，嵌套过深不利于理解
// 以后默认实现的话，直接添加一行键值对就行，也方便维护
const quickLoop: Record<string, new (ctx: ServerContext) => ServerMessageHandler> = {
    'CLOSE_MODAL': CloseModalHandler,
    'MODAL_READY': ModalReadyHandler,
    'MODAL_ERROR': ErrorHandler,
}

type handlerCreatorsType = Record<string, (context: ServerContext) => ServerMessageHandler>

const defaultCreators: handlerCreatorsType = {}
for (const [handlerType, handlerCls] of Object.entries(quickLoop)) {
    defaultCreators[handlerType] = (context: ServerContext) => { return new handlerCls(context) }
}

export const handlerCreators: handlerCreatorsType = {
    ...defaultCreators
}

/**
 * 创建所有默认处理器的便捷函数
 */
export function createAllHandlers(context: ServerContext): ServerMessageHandler[] {
  return Object.values(handlerCreators).map(creator => creator(context))
}

/**
 * 根据消息类型创建处理器
 */
export function createHandlerByType(type: string, context: ServerContext): ServerMessageHandler | null {
  const creator = handlerCreators[type]
  return creator ? creator(context) : null
}