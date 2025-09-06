/**
 * CloseModalHandler - 处理关闭模态框消息
 *
 * 处理来自客户端的关闭模态框请求
 */

import type { BaseMessage, CloseModalMessage } from "../../communication/types";
import { ServerMessageHandler } from "./ServerMessageHandler";

export class CloseModalHandler extends ServerMessageHandler {
  getHandlerName() {
    return "CloseModalHandler";
  }

  getHandleTypes(): Array<string> {
    return ["CLOSE_MODAL"];
  }

  async handle(message: BaseMessage): Promise<any> {
    const closeMessage = message as CloseModalMessage;

    this.context.log(`Processing close modal request. Reason: ${closeMessage.data?.reason || "user action"}`);

    try {
      // 检查是否有模态框正在显示
      if (!this.context.currentModal) {
        this.context.log("No modal is currently visible", "warn");
        return;
      }
      if (!this.context.currentModal.is(":visible")) {
        this.context.log("No modal is currently visible", "warn");
        return;
      }

      // 关闭模态框
      this.context.log("关闭 Vue 悬浮窗中...");

      try {
        // 移除键盘事件监听
        $(document).off("keydown.vue-modal");

        // 添加淡出动画
        this.context.currentModal.fadeOut(200, () => {
          if (this.context.currentModal) {
            this.context.currentModal.remove();
            this.context.currentModal = null;
          }
        });
      } catch (error) {
        this.context.log(`关闭悬浮窗失败: ${error}`, "error");

        // 强制移除
        this.context.currentModal.remove();
        this.context.currentModal = null;
      }

      this.context.log("Vue 悬浮窗已关闭 ✓");

      // 如果需要回复，发送成功确认
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.context.log(`Failed to close modal: ${errorMessage}`, "error");
      throw error;
    }
  }
}
