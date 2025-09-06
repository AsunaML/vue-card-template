/**
 * PostMessage 通信架构 - 类型定义
 * 
 * 定义服务端（tavern-script）和客户端（Vue app）之间的消息格式和接口
 */

// ========== 基础消息格式 ==========

export interface BaseMessage {
  /** 消息唯一标识符 */
  id: string
  /** 消息类型 */
  type: string
  /** 消息数据 */
  data?: any
  /** 时间戳 */
  timestamp: number
  /** 是否需要回复 */
  needReply?: boolean
}

export interface MessageReply extends BaseMessage {
  /** 回复的原消息ID */
  replyTo: string
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
}

// ========== 具体消息类型 ==========

export interface CloseModalMessage extends BaseMessage {
  type: 'CLOSE_MODAL'
  data?: {
    reason?: string
  }
}

export interface ModalReadyMessage extends BaseMessage {
  type: 'MODAL_READY'
  data?: {
    clientInfo?: {
      width: number
      height: number
      userAgent: string
    }
  }
}

export interface ModalErrorMessage extends BaseMessage {
  type: 'MODAL_ERROR'
  data: {
    message: string
    stack?: string
  }
}

export interface DataSyncMessage extends BaseMessage {
  type: 'DATA_SYNC'
  data: {
    action: 'request' | 'response'
    dataType: string
    payload?: any
  }
}

// ========== 消息处理器接口 ==========

export interface MessageHandlerContext {
  /** 记录日志 */
  log(message: string, level?: 'info' | 'warn' | 'error'): void
}

export abstract class MessageHandler<C extends MessageHandlerContext = MessageHandlerContext> {

  public readonly name: string
  protected readonly context: C

  constructor(context: C) {
    this.name = this.getHandlerName()
    this.context = context
  }

  /** 获取处理器名称 */
  abstract getHandlerName(): string

  /** 能处理的消息类型 */
  abstract getHandleTypes(): Array<string>

  /** 处理消息 */
  abstract handle(message: BaseMessage): Promise<any>

    /** 检查是否能处理该消息类型 */
  canHandle(type: string): boolean {
    return this.getHandleTypes().includes(type)
  }
}

// ========== MessageBus 接口 ==========

export interface MessageBusConfig {
  /** 调试模式 */
  debugMode: boolean
  /** 消息超时时间（毫秒） */
  messageTimeout: number
  /** 重试次数 */
  retryCount: number
  /** 允许的来源域名 */
  allowedOrigins: string[]
  /** 环境标识 */
  environment: 'server' | 'client'
}

export interface MessageBus {
  /** 发送消息 */
  send(message: Omit<BaseMessage, 'id' | 'timestamp'>): Promise<void>
  /** 发送请求并等待回复 */
  request<T = any>(message: Omit<BaseMessage, 'id' | 'timestamp' | 'needReply'>): Promise<T>
  /** 注册消息处理器 */
  registerHandler(handler: MessageHandler): void
  /** 注销消息处理器 */
  unregisterHandler(handlerName: string): void
  /** 销毁 MessageBus */
  destroy(): void
}

// ========== 工厂和注册表接口 ==========

export interface HandlerRegistry {
  /** 注册处理器 */
  register(handler: MessageHandler): void
  /** 注销处理器 */
  unregister(handlerName: string): void
  /** 获取能处理指定类型的处理器 */
  getFirstHandler(messageType: string): MessageHandler | null
  getAllHandler(messageType: string): Array<MessageHandler> | null
  /** 获取所有处理器 */
  getAllHandlers(): MessageHandler[]
  /** 清空所有处理器 */
  clear(): void
}

// ========== 错误类型 ==========

export class MessageBusError extends Error {
  public code: string
  public originalMessage?: BaseMessage
  
  constructor(
    message: string,
    code: string,
    originalMessage?: BaseMessage
  ) {
    super(message)
    this.name = 'MessageBusError'
    this.code = code
    this.originalMessage = originalMessage
  }
}

export class MessageTimeoutError extends MessageBusError {
  constructor(messageId: string, timeout: number) {
    super(
      `Message ${messageId} timed out after ${timeout}ms`,
      'MESSAGE_TIMEOUT'
    )
  }
}

export class MessageHandlerError extends MessageBusError {
  constructor(handlerName: string, originalError: Error, message?: BaseMessage) {
    super(
      `Handler ${handlerName} failed: ${originalError.message}`,
      'HANDLER_ERROR',
      message
    )
  }
}