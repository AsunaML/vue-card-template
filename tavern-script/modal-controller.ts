/**
 * Vue Modal Controller v2 - 使用新的通信架构
 *
 * 基于 MessageBus 架构的模态框控制器
 * 支持类型安全的消息通信和扩展性处理
 */

/// <reference path="./types.d.ts" />
import * as Comlink from "comlink";

// 导入新的通信架构
interface VueModalConfig {
  modalUrl: string;
  debugMode: boolean;
}

export interface ExposeInterface {
  showModal(): void;
  closeModal(): void;
  incCounter(): void;
  getCount(): number;
}

class VueModalController {
  private config: VueModalConfig;
  public currentModal: JQuery<HTMLElement> | null = null;
  private testCounter: number = 0;
  private hasBind: boolean = false;

  constructor(config?: Partial<VueModalConfig>) {
    this.config = {
      modalUrl: "http://localhost:5500/",
      debugMode: true,
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.log("Vue Modal Controller 初始化...");

    // 检查环境
    if (!this.checkEnvironment()) {
      return;
    }

    this.log("Vue Modal Controller 初始化完成");
  }

  private checkEnvironment(): boolean {
    // 检查 SillyTavern 事件系统
    if (typeof eventOn === "undefined" || typeof eventEmit === "undefined") {
      this.log("SillyTavern 事件系统不可用", "error");
      return false;
    }

    // 检查 jQuery
    if (typeof $ === "undefined") {
      this.log("jQuery 不可用", "error");
      return false;
    }

    // 测试DOM操作能力
    try {
      const $testElement = $("<div>").css({ display: "none" });
      $("body").append($testElement);
      $testElement.remove();
      this.log("DOM操作权限验证通过 ✓");
    } catch (error) {
      this.log(`DOM操作权限不足: ${error}`, "error");
      return false;
    }

    this.log("环境检查通过 ✓");
    return true;
  }

  public async destroy(): Promise<void> {
    this.log("销毁 Vue Modal Controller v2...");

    // 关闭悬浮窗
    // await this.hideModal();

    // 销毁消息总线

    this.log("Vue Modal Controller 已销毁");
  }

  public log(message: string, level?: "info" | "warn" | "error"): void {
    if (level === undefined) {
      level = "info";
    }

    const prefix = "[Vue Modal Controller]";
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = `${prefix} [${timestamp}] ${message}`;

    switch (level) {
      case "warn":
        console.warn(fullMessage);
        break;
      case "error":
        console.error(fullMessage);
        break;
      default:
        console.log(fullMessage);
    }
  }

  public getCount(): number {
    return this.testCounter;
  }

  public incCounter(): void {
    this.testCounter += 1;
  }

  public showModal() {
    this.log(`Showing modal`);

    try {
      // 检查是否有模态框正在显示
      if (this.currentModal && this.currentModal.is(":visible")) {
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
          src: this.config.modalUrl,
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
      this.currentModal = $modalContainer;

      if (!this.hasBind) {
        (window.top ?? window).addEventListener("message", (event) => {
          if (event.data === "ready") {
            // iframe说它准备好了
            console.log(`recive ready message: ${event.data}`);

            // 建立消息通道(MessageChannel 是轻量级的，用完可以新建)
            const channel = new MessageChannel();

            // 暴露 API 给 iframe
            const exposed: ExposeInterface = {
              showModal: this.showModal.bind(this),
              closeModal: this.closeModal.bind(this),
              incCounter: this.incCounter.bind(this),
              getCount: this.getCount.bind(this),
            };
            Comlink.expose(exposed, channel.port1);

            // 发送 MessageChannel 的端口过去
            const iframeEl = $iframe[0] as HTMLIFrameElement;
            iframeEl.contentWindow!.postMessage({ port: channel.port2 }, "*", [channel.port2]);
            console.log("Send port to iframe");
          }
        });
        console.log('绑定message监听器成功')
        this.hasBind = true
      }
      else {
        console.warn('出现重复绑定监听器现象')
      }

      this.log("Vue 悬浮窗显示成功 ✓");

      // 如果需要回复，发送成功确认
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.log(`Failed to close modal: ${errorMessage}`, "error");
      throw error;
    }
  }

  public closeModal() {
    this.log(`Closing modal`);

    try {
      // 检查是否有模态框正在显示
      if (!this.currentModal) {
        this.log("No modal is currently visible", "warn");
        return;
      }
      if (!this.currentModal.is(":visible")) {
        this.log("No modal is currently visible", "warn");
        return;
      }

      // 关闭模态框
      this.log("关闭 Vue 悬浮窗中...");

      try {
        // 移除键盘事件监听
        $(document).off("keydown.vue-modal");

        // 添加淡出动画
        this.currentModal.fadeOut(200, () => {
          if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
          }
        });
      } catch (error) {
        this.log(`关闭悬浮窗失败: ${error}`, "error");

        // 强制移除
        this.currentModal.remove();
        this.currentModal = null;
      }

      this.log("Vue 悬浮窗已关闭 ✓");

      // 如果需要回复，发送成功确认
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.log(`Failed to close modal: ${errorMessage}`, "error");
      throw error;
    }
  }
}

// 全局实例管理（避免与原有控制器冲突）
declare global {
  interface Window {
    vueModalController?: VueModalController;
  }
}

// 自动初始化
(async function () {
  try {
    // 防止重复初始化
    if (window.vueModalController) {
      console.log("[Vue Modal] 控制器已存在，销毁旧实例...");
      await window.vueModalController.destroy();
    }

    // 创建新实例
    const obj = new VueModalController();
    console.log(`new obj: ${obj}`);
    const topWindow = window.top ?? window;
    topWindow.vueModalController = obj;

    console.log("[Vue Modal] 控制器已就绪，等待触发事件...");
  } catch (error) {
    console.error("[Vue Modal] 初始化失败:", error);
  }
})();

// 导出用于 TypeScript 编译
export { VueModalController };
export default VueModalController;
