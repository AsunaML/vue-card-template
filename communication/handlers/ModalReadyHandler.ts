/**
 * ModalReadyHandler - 处理模态框就绪消息
 * 
 * 处理来自客户端的模态框就绪通知
 */

import type { BaseMessage, MessageHandler, MessageHandlerContext, ModalReadyMessage } from '../types'

export class ModalReadyHandler implements MessageHandler {
  name = 'ModalReadyHandler'
  private context?: MessageHandlerContext

  setContext(context: MessageHandlerContext): void {
    this.context = context
  }

  canHandle(type: string): boolean {
    return type === 'MODAL_READY'
  }

  async handle(message: BaseMessage): Promise<void> {
    const readyMessage = message as ModalReadyMessage
    
    this.log('Vue application is ready')

    try {
      // 记录客户端信息（如果有的话）
      if (readyMessage.data?.clientInfo) {
        const { width, height, userAgent } = readyMessage.data.clientInfo
        this.log(`Client info: ${width}x${height}, UA: ${userAgent.substring(0, 50)}...`)
      }

      // 执行模态框就绪后的初始化操作
      await this.performReadyActions(readyMessage)

      this.log('Modal ready processing completed')

      // 如果需要回复，发送确认
      if (message.needReply && this.context) {
        await this.context.reply(message, { 
          status: 'acknowledged',
          timestamp: Date.now()
        })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log(`Failed to process modal ready: ${errorMessage}`, 'error')

      if (message.needReply && this.context) {
        await this.context.replyError(message, errorMessage)
      }
    }
  }

  private async performReadyActions(_message: ModalReadyMessage): Promise<void> {
    // 这里可以执行模态框就绪后的初始化操作
    // 例如：
    // - 发送初始数据到客户端
    // - 更新UI状态
    // - 记录分析数据
    
    // 示例：发送欢迎数据到客户端（如果需要的话）
    // 注意：这里不直接发送消息，而是由调用者决定如何处理
    
    this.log('Performing modal ready actions...')
    
    // 可以在这里添加具体的初始化逻辑
    // 比如加载用户数据、设置主题等
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.context) {
      this.context.log(`[${this.name}] ${message}`, level)
    } else {
      console.log(`[${this.name}] ${message}`)
    }
  }
}