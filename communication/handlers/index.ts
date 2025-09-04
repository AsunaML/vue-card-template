/**
 * Message Handlers - 统一导出
 * 
 * 导出所有消息处理器，便于注册和使用
 */

export { CloseModalHandler } from './CloseModalHandler'
export { ModalReadyHandler } from './ModalReadyHandler'
export { ErrorHandler } from './ErrorHandler'

// 导出处理器创建函数，用于工厂模式
import type { MessageHandler, MessageHandlerContext } from '../types'
import { CloseModalHandler } from './CloseModalHandler'
import { ModalReadyHandler } from './ModalReadyHandler'  
import { ErrorHandler } from './ErrorHandler'

/**
 * 创建处理器的工厂函数映射
 */
export const handlerCreators: Record<string, (context?: MessageHandlerContext) => MessageHandler> = {
  'CLOSE_MODAL': (context) => {
    const handler = new CloseModalHandler()
    if (context && 'setContext' in handler) {
      (handler as any).setContext(context)
    }
    return handler
  },
  
  'MODAL_READY': (context) => {
    const handler = new ModalReadyHandler()
    if (context && 'setContext' in handler) {
      (handler as any).setContext(context)
    }
    return handler
  },
  
  'MODAL_ERROR': (context) => {
    const handler = new ErrorHandler()
    if (context && 'setContext' in handler) {
      (handler as any).setContext(context)
    }
    return handler
  }
}

/**
 * 创建所有默认处理器的便捷函数
 */
export function createAllHandlers(context?: MessageHandlerContext): MessageHandler[] {
  return Object.values(handlerCreators).map(creator => creator(context))
}

/**
 * 根据消息类型创建处理器
 */
export function createHandlerByType(type: string, context?: MessageHandlerContext): MessageHandler | null {
  const creator = handlerCreators[type]
  return creator ? creator(context) : null
}