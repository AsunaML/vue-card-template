import { MessageHandler } from "../../communication";
import { ServerContext } from '../ServerContext';

// 新继承一个抽象类，确保服务端 Handler 都能使用 ServerContext 进行静态类型检查
export abstract class ServerMessageHandler extends MessageHandler<ServerContext> {
}