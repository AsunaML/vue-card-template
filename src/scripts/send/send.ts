import { type MessageBus } from "../../../communication";


export async function sendCloseModal(messageBus: MessageBus, reason?: string): Promise<void> {
  await messageBus.send({
    type: 'CLOSE_MODAL',
    data: reason ? { reason } : undefined
  })
}

export async function sendModalReady(
  messageBus: MessageBus, 
  clientInfo?: { width: number; height: number; userAgent: string }
): Promise<void> {
  await messageBus.send({
    type: 'MODAL_READY',
    data: clientInfo ? { clientInfo } : undefined
  })
}

export async function sendModalError(
  messageBus: MessageBus, 
  error: Error | string,
  stack?: string
): Promise<void> {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? stack : error.stack
  
  await messageBus.send({
    type: 'MODAL_ERROR',
    data: {
      message: errorMessage,
      stack: errorStack
    }
  })
}