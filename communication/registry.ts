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

  getHandler(messageType: string): MessageHandler | null {
    const handlers = this.handlersByType.get(messageType) || []
    
    // 返回第一个能处理该类型的处理器
    // 如果需要多个处理器处理同一类型，可以修改这里的逻辑
    return handlers.length > 0 ? handlers[0] : null
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
      // 检查所有可能的消息类型
      // 这里使用一个简单的启发式方法：检查常见的消息类型
      const commonTypes = [
        'CLOSE_MODAL',
        'MODAL_READY', 
        'MODAL_ERROR',
        'DATA_SYNC',
        'REPLY'
      ]

      for (const type of commonTypes) {
        if (handler.canHandle(type)) {
          if (!this.handlersByType.has(type)) {
            this.handlersByType.set(type, [])
          }
          this.handlersByType.get(type)!.push(handler)
        }
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
    
    // 注册关闭模态框处理器创建函数
    this.handlerCreators.set('CLOSE_MODAL', (_context) => {
      // 这里会导入并创建 CloseModalHandler
      // 为了避免循环依赖，实际实现可能需要延迟加载
      return null as any // 占位符，实际实现在 handlers 模块中
    })
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