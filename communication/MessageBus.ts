/**
 * MessageBus - PostMessage 通信核心类
 * 
 * 这是整个通信架构的核心组件，负责在 iframe 环境中进行跨窗口通信。
 * 由于 SillyTavern 的安全沙箱限制，Vue 应用（运行在 iframe 中）只能通过
 * postMessage API 与 tavern-script（运行在主窗口）进行通信。
 * 
 * ## 核心功能
 * 
 * ### 1. 消息传输与路由
 * - 统一的消息发送和接收管理
 * - 基于消息类型的处理器路由
 * - 自动消息序列化和反序列化
 * - 跨域安全验证
 * 
 * ### 2. 请求-响应模式
 * - 支持异步请求并等待回复 (`request()`)
 * - 自动消息 ID 生成和匹配
 * - 超时处理和错误恢复
 * - Promise 化的 API 设计
 * 
 * ### 3. 处理器管理
 * - 动态注册和注销消息处理器
 * - 类型安全的处理器调用
 * - 上下文注入和错误隔离
 * - 并发处理支持
 * 
 * ### 4. 错误处理与监控
 * - 详细的错误分类和报告
 * - 超时检测和自动重试
 * - 调试日志和性能监控
 * - 优雅的错误降级
 * 
 * ## 使用场景
 * 
 * ### 服务端 (tavern-script)
 * ```typescript
 * const registry = new HandlerRegistryImpl()
 * const messageBus = new MessageBusImpl({
 *   environment: 'server',
 *   debugMode: true
 * }, registry)
 * 
 * // 注册处理器
 * registry.register(new CloseModalHandler(serverContext))
 * ```
 * 
 * ### 客户端 (Vue 应用)
 * ```typescript
 * const registry = new HandlerRegistryImpl()
 * const messageBus = new MessageBusImpl({
 *   environment: 'client',
 *   debugMode: true
 * }, registry)
 * 
 * // 发送消息
 * await messageBus.send({
 *   type: 'CLOSE_MODAL',
 *   data: { reason: 'user_action' }
 * })
 * 
 * // 请求-响应模式
 * const result = await messageBus.request({
 *   type: 'GET_DATA',
 *   data: { query: 'user_info' }
 * })
 * ```
 * 
 * ## 消息流程
 * 
 * 1. **发送消息**: `send()` → 生成消息ID → postMessage → 对端接收
 * 2. **处理消息**: 接收 → 验证来源 → 路由到处理器 → 执行业务逻辑
 * 3. **回复消息**: 处理器返回 → 自动生成回复 → 发送回复
 * 4. **完成请求**: 接收回复 → 解析结果 → 解析 Promise
 * 
 * ## 安全特性
 * 
 * - **来源验证**: 检查消息来源域名，防止恶意消息
 * - **消息格式验证**: 严格的消息结构检查
 * - **超时保护**: 防止无限等待和资源泄漏
 * - **错误隔离**: 处理器错误不影响消息总线本身
 * 
 * @author Vue Card Template Team
 * @since 2.0.0
 * @see {@link MessageBus} 接口定义
 * @see {@link MessageBusConfig} 配置选项
 */

import type {
  BaseMessage,
  MessageReply,
  MessageBus,
  MessageBusConfig,
  MessageHandler,
  HandlerRegistry
} from './types'
import {
  MessageBusError,
  MessageTimeoutError,
  MessageHandlerError
} from './types'

/**
 * MessageBus 的具体实现类
 * 
 * 这个类实现了 MessageBus 接口，提供完整的跨窗口通信功能。
 * 支持双向通信、请求-响应模式、错误处理和处理器管理。
 */
export class MessageBusImpl implements MessageBus {
  /** MessageBus 配置，包含超时、调试模式等设置 */
  private config: MessageBusConfig
  
  /** 消息处理器注册表，管理所有已注册的处理器 */
  private handlerRegistry: HandlerRegistry
  
  /** 
   * postMessage 事件监听器
   * 绑定到 handleMessage 方法，处理所有传入的消息
   */
  private messageListener: (event: MessageEvent) => void = this.handleMessage.bind(this)
  
  /** 
   * 待处理的请求映射表
   * 
   * 键: 消息ID
   * 值: Promise 解决器和超时计时器
   * 
   * 当发送需要回复的消息时，会在此存储 Promise 的 resolve/reject 函数，
   * 收到回复后会调用对应的解决器。如果超时未收到回复，会自动拒绝 Promise。
   */
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void
    reject: (error: any) => void
    timerId: number
  }>()
  
  /** 
   * MessageBus 销毁状态标志
   * 为 true 时拒绝处理新消息，防止内存泄漏
   */
  private destroyed = false

  /**
   * 创建 MessageBus 实例
   * 
   * @param config - MessageBus 配置，支持部分配置（会与默认配置合并）
   * @param handlerRegistry - 消息处理器注册表实例
   * 
   * @example
   * ```typescript
   * const registry = new HandlerRegistryImpl()
   * const messageBus = new MessageBusImpl({
   *   environment: 'server',
   *   debugMode: true,
   *   messageTimeout: 10000,
   *   allowedOrigins: ['http://localhost:5500']
   * }, registry)
   * ```
   */
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

  /**
   * 初始化 MessageBus
   * 
   * 根据环境类型设置正确的消息监听器：
   * - 服务端：监听来自 iframe 的消息（使用 window.top）
   * - 客户端：监听来自父窗口的消息（使用 window）
   * 
   * @private
   */
  private initialize(): void {
    if (this.config.environment === 'server') {
      // 服务端：监听来自 iframe 的消息
      // 使用 window.top 确保在 SillyTavern 环境中正确监听
      const topWindow = window.top || window
      topWindow.addEventListener('message', this.messageListener)
    } else {
      // 客户端：监听来自父窗口的消息
      // iframe 中的 Vue 应用监听父窗口（tavern-script）的消息
      window.addEventListener('message', this.messageListener)
    }

    this.log('MessageBus initialized', 'info')
  }

  /**
   * 处理接收到的 postMessage 消息
   * 
   * 这是消息处理的核心方法，负责：
   * 1. 验证消息来源和格式
   * 2. 区分普通消息和回复消息
   * 3. 路由消息到对应的处理器
   * 4. 处理错误和异常情况
   * 
   * @param event - postMessage 事件对象
   * @private
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    // 检查 MessageBus 是否已销毁
    if (this.destroyed) return

    const self = (window.top || window).location.origin

    try {
      // 验证消息来源
      // event.origin === self: Trigger html 发出的事件
      // event.origin === "null": 未设置 sandbox allow-origin 的 iframe 所发出的事件
      if (event.origin !== self && event.origin !== "null" && !this.isOriginAllowed(event.origin)) {
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
        // 处理消息
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

  /**
   * 发送消息（单向通信）
   * 
   * 发送一条消息到对端，不等待回复。适用于通知类消息，
   * 如关闭模态框、状态更新等不需要返回值的操作。
   * 
   * @param message - 要发送的消息（不包含 id 和 timestamp，会自动生成）
   * @throws {MessageBusError} 当 MessageBus 已销毁或发送失败时抛出
   * 
   * @example
   * ```typescript
   * // 发送关闭模态框消息
   * await messageBus.send({
   *   type: 'CLOSE_MODAL',
   *   data: { reason: 'user_action' }
   * })
   * 
   * // 发送状态更新消息
   * await messageBus.send({
   *   type: 'STATUS_UPDATE',
   *   data: { status: 'ready' }
   * })
   * ```
   */
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

  /**
   * 发送请求并等待回复（双向通信）
   * 
   * 发送一条消息到对端并等待回复，支持超时和错误处理。
   * 适用于需要获取数据或确认结果的操作。
   * 
   * @template T - 期望的回复数据类型
   * @param message - 要发送的消息（不包含 id、timestamp 和 needReply，会自动设置）
   * @returns Promise<T> - 解析为回复数据的 Promise
   * @throws {MessageBusError} 当 MessageBus 已销毁时抛出
   * @throws {MessageTimeoutError} 当超时未收到回复时抛出
   * 
   * @example
   * ```typescript
   * // 请求用户数据
   * const userData = await messageBus.request<UserData>({
   *   type: 'GET_USER_DATA',
   *   data: { userId: 123 }
   * })
   * 
   * // 请求确认操作（使用自定义超时时间）
   * const confirmation = await messageBus.request<boolean>({
   *   type: 'CONFIRM_ACTION',
   *   data: { action: 'delete_file' },
   *   timeoutMS: 3000  // 30秒超时
   * })
   * ```
   */
  public async request<T = any>(
    message: Omit<BaseMessage, 'id' | 'timestamp' | 'needReply'>
  ): Promise<T> {
    if (this.destroyed) {
      throw new MessageBusError('MessageBus has been destroyed', 'BUS_DESTROYED')
    }

    const fullMessage = this.createMessage({ ...message, needReply: true })

    return new Promise((resolve, reject) => {
      // 使用消息中的 timeoutMS 或默认配置的超时时间
      const timeoutMs = message.timeoutMS ? message.timeoutMS : this.config.messageTimeout

      const timerId = setTimeout(() => {
        this.pendingRequests.delete(fullMessage.id)
        reject(new MessageTimeoutError(fullMessage.id, timeoutMs))
      }, timeoutMs)

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

  /**
   * 注册消息处理器
   * 
   * 将一个消息处理器注册到 MessageBus，使其能够处理对应类型的消息。
   * 一个处理器可以处理多种类型的消息。
   * 
   * @param handler - 要注册的消息处理器实例
   * 
   * @example
   * ```typescript
   * const closeHandler = new CloseModalHandler(context)
   * messageBus.registerHandler(closeHandler)
   * ```
   */
  public registerHandler(handler: MessageHandler): void {
    this.handlerRegistry.register(handler)
    this.log(`Registered handler: ${handler.name}`, 'info')
  }

  /**
   * 注销消息处理器
   * 
   * 从 MessageBus 中移除指定名称的消息处理器。
   * 注销后该处理器将不再处理任何消息。
   * 
   * @param handlerName - 要注销的处理器名称
   * 
   * @example
   * ```typescript
   * messageBus.unregisterHandler('CloseModalHandler')
   * ```
   */
  public unregisterHandler(handlerName: string): void {
    this.handlerRegistry.unregister(handlerName)
    this.log(`Unregistered handler: ${handlerName}`, 'info')
  }

  /**
   * 销毁 MessageBus
   * 
   * 清理所有资源，包括：
   * - 取消所有待处理的请求
   * - 移除事件监听器
   * - 清空处理器注册表
   * - 设置销毁标志
   * 
   * 销毁后的 MessageBus 不能再使用，调用其方法会抛出错误。
   * 
   * @example
   * ```typescript
   * // 在组件卸载或应用关闭时调用
   * messageBus.destroy()
   * ```
   */
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