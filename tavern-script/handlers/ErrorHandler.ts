/**
 * ErrorHandler - 处理错误消息
 * 
 * 处理来自客户端的错误报告
 */

import type { BaseMessage } from '../../communication/types'
import { ServerMessageHandler } from './ServerMessageHandler'

export class ErrorHandler extends ServerMessageHandler {

  getHandlerName() {
    return 'ErrorHandler'
  }

  getHandleTypes(): Array<string> {
      return ['MODAL_ERROR']
  }

  async handle(_message: BaseMessage): Promise<any> {
    this.context.log('接收到错误消息事件，因ErrorHandler暂时被屏蔽，跳过该消息的处理', 'warn')
    return
  }
}