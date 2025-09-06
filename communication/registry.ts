/**
 * HandlerRegistry - 消息处理器注册表
 * 
 * 管理所有消息处理器的注册、注销和查找
 */

import type { MessageHandler, HandlerRegistry } from './types'

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
