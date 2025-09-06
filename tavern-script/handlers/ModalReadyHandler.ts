/**
 * ModalReadyHandler - 处理模态框就绪消息
 * 
 * 处理来自客户端的模态框就绪通知
 */

import type { BaseMessage } from '../../communication/types'
import { ServerMessageHandler } from './ServerMessageHandler'

interface ModalReadyMessage extends BaseMessage {
  type: 'MODAL_READY'
  data?: {
    clientInfo?: {
      width: number
      height: number
      userAgent: string
    }
  }
}

export class ModalReadyHandler extends ServerMessageHandler {

  getHandlerName() {
    return 'ModalReadyHandler'
  }

  getHandleTypes(): Array<string> {
      return ['MODAL_READY']
  }

  async handle(message: BaseMessage): Promise<any> {
    const readyMessage = message as ModalReadyMessage
    
    this.context.log('Vue application is ready')

    try {
      // 记录客户端信息（如果有的话）
      if (readyMessage.data?.clientInfo) {
        const { width, height, userAgent } = readyMessage.data.clientInfo
        this.context.log(`Client info: ${width}x${height}, UA: ${userAgent.substring(0, 50)}...`)
      }

      // 执行模态框就绪后的初始化操作
      await this.performReadyActions(readyMessage)

      this.context.log('Modal ready processing completed')

      // 如果需要回复，发送确认
      return { 
          status: 'acknowledged',
          timestamp: Date.now()
        }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.context.log(`Failed to process modal ready: ${errorMessage}`, 'error')
      throw error
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
    
    this.context.log('Performing modal ready actions...')
    
    // 可以在这里添加具体的初始化逻辑
    // 比如加载用户数据、设置主题等
  }
}