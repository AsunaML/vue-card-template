/**
 * ErrorHandler - 处理错误消息
 * 
 * 处理来自客户端的错误报告
 */

import { MessageHandler } from '../types'
import type { BaseMessage, ModalErrorMessage } from '../types'

export class ErrorHandler extends MessageHandler {

  private errorCount = 0
  private lastErrorTime = 0

  constructor() {
    super()
  }

  getHandlerName() {
    return 'ErrorHandler'
  }

  getHandleTypes(): Array<string> {
      return ['MODAL_ERROR']
  }

  async handle(message: BaseMessage): Promise<void> {
    const errorMessage = message as ModalErrorMessage
    
    this.updateErrorStats()
    
    const { message: errorText, stack } = errorMessage.data
    
    this.log(`Client error received: ${errorText}`, 'error')
    
    if (stack) {
      this.log(`Error stack: ${stack}`, 'error')
    }

    try {
      // 执行错误处理逻辑
      await this.processError(errorMessage)

      // 如果错误频率过高，可能需要特殊处理
      if (this.isErrorRateHigh()) {
        this.log('High error rate detected, considering recovery actions', 'warn')
        await this.handleHighErrorRate(errorMessage)
      }

      // 如果需要回复，发送确认
      if (message.needReply && this.context) {
        await this.context.reply(message, {
          acknowledged: true,
          errorId: this.generateErrorId(),
          suggestedAction: this.getSuggestedAction(errorMessage)
        })
      }

    } catch (handlerError) {
      const handlerErrorMessage = handlerError instanceof Error ? handlerError.message : 'Handler error'
      this.log(`Error handler failed: ${handlerErrorMessage}`, 'error')

      if (message.needReply && this.context) {
        await this.context.replyError(message, handlerErrorMessage)
      }
    }
  }

  private updateErrorStats(): void {
    this.errorCount++
    this.lastErrorTime = Date.now()
  }

  private isErrorRateHigh(): boolean {
    // 简单的错误率检测：如果在过去 30 秒内有超过 5 个错误
    const thirtySecondsAgo = Date.now() - 30000
    return this.errorCount > 5 && this.lastErrorTime > thirtySecondsAgo
  }

  private async processError(errorMessage: ModalErrorMessage): Promise<void> {
    // 错误处理逻辑
    const errorData = errorMessage.data
    
    // 根据错误类型进行分类处理
    if (this.isNetworkError(errorData.message)) {
      this.log('Network error detected', 'warn')
      // 可以触发网络重试逻辑
    } else if (this.isPermissionError(errorData.message)) {
      this.log('Permission error detected', 'warn')
      // 可以显示权限相关的提示
    } else {
      this.log('General application error', 'warn')
    }

    // 记录错误信息用于调试（在实际应用中可能会发送到错误收集服务）
    this.logErrorForDebugging(errorMessage)
  }

  private async handleHighErrorRate(_errorMessage: ModalErrorMessage): Promise<void> {
    this.log('Implementing error recovery measures', 'warn')
    
    // 高错误率时的恢复策略
    // 例如：
    // 1. 重置客户端状态
    // 2. 显示错误提示
    // 3. 关闭模态框（如果错误太严重）
    
    // 示例：如果错误过多，建议用户刷新
    if (this.errorCount > 10) {
      this.log('Too many errors, suggesting modal restart', 'error')
      
      // 可以通过 MessageBus 发送建议刷新的消息给客户端
      // 但这里不直接操作 MessageBus，而是记录建议
    }
  }

  private isNetworkError(message: string): boolean {
    const networkKeywords = ['network', 'fetch', 'connection', 'timeout', 'CORS']
    return networkKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  private isPermissionError(message: string): boolean {
    const permissionKeywords = ['permission', 'denied', 'unauthorized', 'forbidden']
    return permissionKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  private getSuggestedAction(errorMessage: ModalErrorMessage): string {
    const message = errorMessage.data.message.toLowerCase()
    
    if (this.isNetworkError(message)) {
      return 'Check network connection and retry'
    }
    
    if (this.isPermissionError(message)) {
      return 'Check browser permissions and settings'
    }
    
    return 'Try refreshing the application'
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  private logErrorForDebugging(errorMessage: ModalErrorMessage): void {
    // 在实际应用中，这里可以发送到错误收集服务
    const debugInfo = {
      timestamp: new Date().toISOString(),
      messageId: errorMessage.id,
      error: errorMessage.data,
      errorCount: this.errorCount,
      userAgent: navigator.userAgent
    }
    
    this.log(`Error debug info: ${JSON.stringify(debugInfo, null, 2)}`, 'error')
  }

  // 重置错误统计（可以被外部调用）
  public resetErrorStats(): void {
    this.errorCount = 0
    this.lastErrorTime = 0
    this.log('Error statistics reset')
  }
}