import { MessageHandlerContext } from "../communication";

export interface ServerContext extends MessageHandlerContext {
  modalUrl: string
  currentModal: JQuery | null
}
