/**
 * HandlerRegistry - 消息处理器注册表
 * 
 * 管理所有消息处理器的注册、注销和查找
 */

import type { MessageHandler, HandlerRegistry, MessageHandlerFactory, MessageHandlerContext } from './types'

export class HandlerRegistryImpl implements HandlerRegistry {
  private handlers = new Map<string, MessageHandler>()
  private handlersByType = new Map<string, MessageHandler[]>()

  register(handler: MessageHandler): void {
    // 检查处理器名称是否已存在
    if (this.handlers.has(handler.name)) {
      throw new Error(`Handler with name '${handler.name}' already exists`)
    }

    // 注册处理器
    this.handlers.set(handler.name, handler)

    // 更新按类型索引（一个处理器可能处理多种消息类型）
    this.updateTypeIndex()
  }

  unregister(handlerName: string): void {
    if (!this.handlers.has(handlerName)) {
      return // 静默忽略不存在的处理器
    }

    this.handlers.delete(handlerName)
    this.updateTypeIndex()
  }

  getFirstHandler(messageType: string): MessageHandler | null {
    const handlers = this.handlersByType.get(messageType) || []
    return handlers.length > 0 ? handlers[0] : null
  }

  getAllHandler(messageType: string): Array<MessageHandler> | null {
    const handlers = this.handlersByType.get(messageType) || []
    return handlers.length > 0 ? handlers : null
  }

  getAllHandlers(): MessageHandler[] {
    return Array.from(this.handlers.values())
  }

  clear(): void {
    this.handlers.clear()
    this.handlersByType.clear()
  }

  private updateTypeIndex(): void {
    // 重建类型索引
    this.handlersByType.clear()

    for (const handler of this.handlers.values()) {
      for (const type of handler.getHandleTypes()) {
        if (!this.handlersByType.has(type)){
          this.handlersByType.set(type, [])
        }
        this.handlersByType.get(type)?.push(handler)
      }
    }
  }

  // 调试方法：获取注册表状态
  getRegistryStatus(): {
    totalHandlers: number
    handlerNames: string[]
    typeMapping: Record<string, string[]>
  } {
    const typeMapping: Record<string, string[]> = {}
    
    for (const [type, handlers] of this.handlersByType.entries()) {
      typeMapping[type] = handlers.map(h => h.name)
    }

    return {
      totalHandlers: this.handlers.size,
      handlerNames: Array.from(this.handlers.keys()),
      typeMapping
    }
  }
}

/**
 * MessageHandlerFactory - 消息处理器工厂
 * 
 * 根据消息类型创建对应的处理器实例
 */
export class MessageHandlerFactoryImpl implements MessageHandlerFactory {
  private handlerCreators = new Map<string, (context: MessageHandlerContext) => MessageHandler>()

  constructor() {
    // 注册默认的处理器创建函数
    this.registerBuiltinHandlers()
  }

  private registerBuiltinHandlers(): void {
    // 这里可以注册内置的处理器创建函数
    // 实际的处理器实现将在 handlers/ 目录中
  }

  createHandler(type: string, context: MessageHandlerContext): MessageHandler | null {
    const creator = this.handlerCreators.get(type)
    return creator ? creator(context) : null
  }

  /**
   * 注册处理器创建函数
   */
  registerHandlerCreator(
    type: string, 
    creator: (context: MessageHandlerContext) => MessageHandler
  ): void {
    this.handlerCreators.set(type, creator)
  }

  /**
   * 获取所有支持的消息类型
   */
  getSupportedTypes(): string[] {
    return Array.from(this.handlerCreators.keys())
  }
}

/**
 * 创建默认的处理器注册表实例
 */
export function createHandlerRegistry(): HandlerRegistry {
  return new HandlerRegistryImpl()
}

/**
 * 创建默认的处理器工厂实例
 */
export function createHandlerFactory(): MessageHandlerFactory {
  return new MessageHandlerFactoryImpl()
}