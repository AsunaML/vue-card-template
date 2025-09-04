/**
 * CloseModalHandler - 处理关闭模态框消息
 * 
 * 处理来自客户端的关闭模态框请求
 */

import { MessageHandler } from '../types'
import type { BaseMessage, CloseModalMessage } from '../types'

export class CloseModalHandler extends MessageHandler {

  constructor() {
    super()
  }

  getHandlerName() {
    return 'CloseModalHandler'
  }

  getHandleTypes(): Array<string> {
      return ['CLOSE_MODAL']
  }

  async handle(message: BaseMessage): Promise<void> {
    const closeMessage = message as CloseModalMessage
    
    this.log(`Processing close modal request. Reason: ${closeMessage.data?.reason || 'user action'}`)

    try {
      // 查找 VueModalController 实例（兼容新旧版本）
      const modalController = (window as any).vueModalControllerV2 || (window as any).vueModalController
      
      if (!modalController) {
        throw new Error('VueModalController not found')
      }

      // 检查是否有模态框正在显示
      if (!modalController.isModalVisible()) {
        this.log('No modal is currently visible', 'warn')
        return
      }

      // 关闭模态框
      modalController.hideModal()
      
      this.log('Modal closed successfully')

      // 如果需要回复，发送成功确认
      if (message.needReply && this.context) {
        await this.context.reply(message, { success: true })
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.log(`Failed to close modal: ${errorMessage}`, 'error')

      // 如果需要回复，发送错误信息
      if (message.needReply && this.context) {
        await this.context.replyError(message, errorMessage)
      }
    }
  }
}