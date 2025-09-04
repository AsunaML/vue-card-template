/**
 * MessageBus - PostMessage 通信核心类
 * 
 * 统一管理客户端和服务端之间的 postMessage 通信
 * 支持请求-响应模式、超时重试、错误处理
 */

import type {
  BaseMessage,
  MessageReply,
  MessageBus,
  MessageBusConfig,
  MessageHandler,
  MessageHandlerContext,
  HandlerRegistry
} from './types'
import {
  MessageBusError,
  MessageTimeoutError,
  MessageHandlerError
} from './types'

export class MessageBusImpl implements MessageBus {
  private config: MessageBusConfig
  private handlerRegistry: HandlerRegistry
  private messageListener: (event: MessageEvent) => void = this.handleMessage.bind(this)
  private pendingRequests = new Map<string, {  // 期待回复的消息列表，指定时间没有接受到回复后，抛出异常
    resolve: (value: any) => void
    reject: (error: any) => void
    timerId: number
  }>()
  private destroyed = false
  private context: MessageHandlerContext = {
    reply: (original, data) => this.sendReply(original, data),
    replyError: (original, error) => this.sendReplyError(original, error),
    log: (msg, level) => this.log(msg, level)
 }

  constructor(
    config: Partial<MessageBusConfig>,
    handlerRegistry: HandlerRegistry
  ) {
    this.config = {
      debugMode: false,
      messageTimeout: 5000,
      retryCount: 3,
      allowedOrigins: ['*'],
      environment: 'client',
      ...config
    }
    this.handlerRegistry = handlerRegistry
    
    this.initialize()
  }

  private initialize(): void {
    
    if (this.config.environment === 'server') {
      // 服务端：监听来自 iframe 的消息
      const topWindow = window.top || window
      topWindow.addEventListener('message', this.messageListener)
    } else {
      // 客户端：监听来自父窗口的消息
      window.addEventListener('message', this.messageListener)
    }

    this.log('MessageBus initialized', 'info')
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    if (this.destroyed) return

    try {
      // 验证消息来源
      if (!this.isOriginAllowed(event.origin)) {
        this.log(`Rejected message from unauthorized origin: ${event.origin}`, 'warn')
        return
      }

      const message = event.data as BaseMessage
      if (!this.isValidMessage(message)) {
        this.log('Received invalid message format', 'warn')
        return
      }

      this.log(`Received message: ${message.type} (id: ${message.id})`, 'info')

      // 检查是否是回复消息
      if ('replyTo' in message) {
        this.handleReply(message as MessageReply)
        return
      }

      // 查找并执行处理器
      const handler = this.handlerRegistry.getFirstHandler(message.type)
      if (!handler) {
        this.log(`No handler found for message type: ${message.type}`, 'warn')
        
        if (message.needReply) {
          await this.sendReplyError(message, `No handler for message type: ${message.type}`)
        }
        return
      }

      try {
        // 临时设置处理器上下文（如果处理器需要的话）
        if ('setContext' in handler && typeof handler.setContext === 'function') {
          (handler as any).setContext(this.context)
        }

        const result = await handler.handle(message)

        // 如果需要回复且处理器返回了结果
        if (message.needReply && result !== undefined) {
          await this.sendReply(message, result)
        }

      } catch (error) {
        const handlerError = new MessageHandlerError(handler.name, error as Error, message)
        this.log(`Handler error: ${handlerError.message}`, 'error')

        if (message.needReply) {
          await this.sendReplyError(message, handlerError.message)
        }
      }

    } catch (error) {
      this.log(`Message handling error: ${(error as Error).message}`, 'error')
    }
  }

  private handleReply(reply: MessageReply): void {
    const pending = this.pendingRequests.get(reply.replyTo)
    if (!pending) {
      this.log(`Received reply for unknown request: ${reply.replyTo}`, 'warn')
      return
    }

    clearTimeout(pending.timerId)
    this.pendingRequests.delete(reply.replyTo)

    if (reply.success) {
      pending.resolve(reply.data)
    } else {
      pending.reject(new MessageBusError(reply.error || 'Unknown error', 'REPLY_ERROR'))
    }
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.config.allowedOrigins.includes('*')) {
      return true
    }
    return this.config.allowedOrigins.includes(origin)
  }

  private isValidMessage(message: any): message is BaseMessage {
    return (
      message &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      typeof message.timestamp === 'number'
    )
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private createMessage(partial: Omit<BaseMessage, 'id' | 'timestamp'>): BaseMessage {
    return {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      ...partial
    }
  }

  public async send(message: Omit<BaseMessage, 'id' | 'timestamp'>): Promise<void> {
    if (this.destroyed) {
      throw new MessageBusError('MessageBus has been destroyed', 'BUS_DESTROYED')
    }

    const fullMessage = this.createMessage(message)
    
    try {
      if (this.config.environment === 'server') {
        // 服务端：发送到 iframe
        const iframe = document.querySelector('.vue-modal-iframe') as HTMLIFrameElement
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(fullMessage, '*')
        } else {
          throw new MessageBusError('Modal iframe not found', 'IFRAME_NOT_FOUND')
        }
      } else {
        // 客户端：发送到父窗口
        window.parent.postMessage(fullMessage, '*')
      }

      this.log(`Sent message: ${fullMessage.type} (id: ${fullMessage.id})`, 'info')
    } catch (error) {
      throw new MessageBusError(
        `Failed to send message: ${(error as Error).message}`,
        'SEND_ERROR'
      )
    }
  }

  public async request<T = any>(
    message: Omit<BaseMessage, 'id' | 'timestamp' | 'needReply'>
  ): Promise<T> {
    if (this.destroyed) {
      throw new MessageBusError('MessageBus has been destroyed', 'BUS_DESTROYED')
    }

    const fullMessage = this.createMessage({ ...message, needReply: true })

    return new Promise((resolve, reject) => {
      const timerId = setTimeout(() => {
        this.pendingRequests.delete(fullMessage.id)
        reject(new MessageTimeoutError(fullMessage.id, this.config.messageTimeout))
      }, this.config.messageTimeout)

      this.pendingRequests.set(fullMessage.id, { resolve, reject, timerId: timerId })

      this.send(fullMessage).catch(reject)
    })
  }

  private async sendReply(originalMessage: BaseMessage, data?: any): Promise<void> {
    const reply: MessageReply = {
      id: this.generateMessageId(),
      type: 'REPLY',
      replyTo: originalMessage.id,
      success: true,
      data,
      timestamp: Date.now()
    }

    await this.send(reply)
  }

  private async sendReplyError(originalMessage: BaseMessage, error: string | Error): Promise<void> {
    const errorMessage = typeof error === 'string' ? error : error.message

    const reply: MessageReply = {
      id: this.generateMessageId(),
      type: 'REPLY',
      replyTo: originalMessage.id,
      success: false,
      error: errorMessage,
      timestamp: Date.now()
    }

    await this.send(reply)
  }

  public registerHandler(handler: MessageHandler): void {
    this.handlerRegistry.register(handler)
    this.log(`Registered handler: ${handler.name}`, 'info')
  }

  public unregisterHandler(handlerName: string): void {
    this.handlerRegistry.unregister(handlerName)
    this.log(`Unregistered handler: ${handlerName}`, 'info')
  }

  public destroy(): void {
    if (this.destroyed) return

    this.log('Destroying MessageBus...', 'info')

    // 清理待处理的请求
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timerId)
      pending.reject(new MessageBusError('MessageBus destroyed', 'BUS_DESTROYED'))
    }
    this.pendingRequests.clear()

    // 移除事件监听
    if (this.config.environment === 'server') {
      const topWindow = window.top || window
      topWindow.removeEventListener('message', this.messageListener)
    } else {
      window.removeEventListener('message', this.messageListener)
    }

    // 清理处理器注册表
    this.handlerRegistry.clear()

    this.destroyed = true
    this.log('MessageBus destroyed', 'info')
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.debugMode) return

    const prefix = `[MessageBus:${this.config.environment}]`
    const timestamp = new Date().toLocaleTimeString()
    const fullMessage = `${prefix} [${timestamp}] ${message}`

    switch (level) {
      case 'warn':
        console.warn(fullMessage)
        break
      case 'error':
        console.error(fullMessage)
        break
      default:
        console.log(fullMessage)
    }
  }
}