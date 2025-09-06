/**
 * ShowModalHandler - 处理打开模态框消息
 *
 * 处理来自客户端的打开模态框请求
 */

import type { BaseMessage, CloseModalMessage } from "../../communication/types";
import { ServerMessageHandler } from "./ServerMessageHandler";

export class ShowModalHandler extends ServerMessageHandler {
  getHandlerName() {
    return "ShowModalHandler";
  }

  getHandleTypes(): Array<string> {
    return ["SHOW_MODAL"];
  }

  async handle(message: BaseMessage): Promise<any> {
    const closeMessage = message as CloseModalMessage;

    this.context.log(`Processing show modal request. Reason: ${closeMessage.data?.reason || "user action"}`);

    try {
      // 检查是否有模态框正在显示
      if (this.context.currentModal && this.context.currentModal.is(":visible")) {
        return { success: true };
      }

      // 创建悬浮窗容器
      const $modalContainer = $("<div>").addClass("vue-modal-container").css({
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(5px)",
      });

      // 创建 iframe
      const $iframe = $("<iframe>")
        .addClass("vue-modal-iframe")
        .attr({
          src: this.context.modalUrl,
          sandbox: "allow-scripts", // 仅支持脚本执行，禁止 allow-same-origin 确保安全
          title: "Vue Character Card Modal",
        })
        .css({
          width: "100%",
          height: "100%",
          border: "none",
          backgroundColor: "transparent",
        });

      // 组装并添加到页面
      $modalContainer.append($iframe);
      $("body").append($modalContainer);

      // 保存引用
      this.context.currentModal = $modalContainer;

      // 添加键盘事件监听（ESC 关闭）（这里先注释掉了，这个在客户端完成，服务端不该干涉客户端的操作）
      // $(document).on('keydown.vue-modal', (e) => {
      //     if (e.key === 'Escape') {
      //         this.hideModal();
      //     }
      // });

      this.context.log("Vue 悬浮窗显示成功 ✓");

      // 如果需要回复，发送成功确认
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.context.log(`Failed to close modal: ${errorMessage}`, "error");
      throw error;
    }
  }
}
