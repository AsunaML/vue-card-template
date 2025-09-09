/**
 * Vue Modal Controller v2 - 使用新的通信架构
 *
 * 基于 MessageBus 架构的模态框控制器
 * 支持类型安全的消息通信和扩展性处理
 */

/// <reference path="./types.d.ts" />
import * as Comlink from "comlink";

// 导入新的通信架构
export interface ModalConfig {
  modalUrl: string;
}

export interface BaseInterface {
  showModal(): void;
  closeModal(): void;
}

export abstract class BaseModalController<ET extends BaseInterface> {
  /**
   * 基础窗口控制器, 负责最基本的初始化, 窗口弹出, 销毁功能, 不涉及具体的业务逻辑.
   */
  private config: ModalConfig;
  private currentIFrame: JQuery<HTMLElement> | null = null;
  private currentModal: JQuery<HTMLElement> | null = null;
  private hasBind: boolean = false;

  constructor(config?: Partial<ModalConfig>) {
    this.config = {
      modalUrl: "null",
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.log("开始初始化");

    // 检查环境
    if (!this.checkEnvironment()) {
      return;
    }

    this.log("初始化完成");
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
    this.log("销毁中");
    // do something
    this.log("已销毁");
  }

  public log(message: string, level?: "info" | "warn" | "error"): void {
    if (level === undefined) {
      level = "info";
    }

    const prefix = "[Modal Controller]";
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

  abstract getExpose(): ET

  private messageEventCallback() {
    if (this.currentIFrame === null) {
      const errorMsg = "出现未知错误, 在接收到iframe回调时, 持有的iframe引用为null";
      this.log(errorMsg, "error");
      return;
    }

    // 建立消息通道(MessageChannel 是轻量级的，用完可以新建)
    const channel = new MessageChannel();

    // 暴露 API 给 iframe
    const exposed: ET = this.getExpose();
    Comlink.expose(exposed, channel.port1);

    // 发送 MessageChannel 的端口过去
    const iframeEl = this.currentIFrame[0] as HTMLIFrameElement; // 这里的iframe
    iframeEl.contentWindow!.postMessage({ port: channel.port2 }, "*", [channel.port2]); // 这里将通道端口2的所有权移交给iframe了
    console.log("Send port to iframe");
  }

  public showModal(): void {
    this.log("开始显示主窗口");

    try {
      // 检查是否有模态框正在显示
      if (this.currentModal && this.currentModal.is(":visible")) {
        return;
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
      this.currentIFrame = $iframe;
      this.currentModal = $modalContainer;

      // 在顶层window上添加事件监听
      if (!this.hasBind) {
        (window.top ?? window).addEventListener("message", (event) => {
          if (event.data === "ready") {
            console.log(`接收到iframe已经加载完毕的信号, 开始向iframe传递端口: ${event.data}`);
            this.messageEventCallback();
          }
        });
        console.log("绑定message监听器成功");
        this.hasBind = true;
      }

      this.log("主窗口显示成功 ✓");
    } catch (error) {
      throw error;
    }
  }

  public closeModal() {
    this.log(`关闭主窗口中`);

    try {
      // 检查是否有模态框正在显示
      if (!this.currentModal) {
        this.log("未持有窗口的引用, 错误调用.", "warn");
        return;
      }
      if (!this.currentModal.is(":visible")) {
        this.log("主窗口非显示中, 错误调用", "warn");
        return;
      }

      try {
        // 移除键盘事件监听
        $(document).off("keydown.vue-modal");

        // 添加淡出动画
        this.currentModal.fadeOut(200, () => {
          if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
            this.log("主窗口已关闭");
          }
        });
      } catch (error) {
        this.log(`关闭悬浮窗失败: ${error}`, "error");

        // 强制移除持有的变量
        this.currentModal.remove();
        this.currentModal = null;
      }
    } catch (error) {
      throw error;
    }
  }
}