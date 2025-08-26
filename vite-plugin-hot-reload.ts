import { Server } from "socket.io";
import type { Plugin } from "vite";

interface HotReloadOptions {
  port?: number;
}

let io: Server | null = null;

export function hotReloadPlugin(options: HotReloadOptions = {}): Plugin {
  const port = options.port ?? 6621;

  // 直接启动 Socket.IO 服务器
  if (!io) {
    io = new Server(port, { cors: { origin: "*" } });
    console.info(`[Listener] 已启动热更新监听服务, 正在监听: http://0.0.0.0:${port}`);

    io.on("connect", (socket) => {
      console.info(`[Listener] 成功连接到客户端 '${socket.id}', 初始化推送...`);
      socket.on("disconnect", (reason) => {
        console.info(`[Listener] 与客户端 '${socket.id}' 断开连接: ${reason}`);
      });
    });
  }

  return {
    name: "hot-reload-notify",
    buildEnd() {
      if (io) {
        console.info("\n[Listener] 检测到完成编译, 推送更新事件...");
        io.emit("iframe_updated");
      }
    },
  };
}
