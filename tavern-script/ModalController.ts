/// <reference path="../@types/iframe/exported.sillytavern.d.ts" />
/// <reference path="../@types/iframe/exported.tavernhelper.d.ts" />

import { type ModalConfig, BaseModalController, type BaseInterface } from './AbsModalController'


export interface ExposeInterface extends BaseInterface {
  incCounter(): void;
  getCount(): number;
  sillyTavern: typeof SillyTavern
  tavernHelper: typeof TavernHelper
}


class ModalController extends BaseModalController<ExposeInterface> {
  
  private testCounter: number = 0;

  constructor(config?: Partial<ModalConfig>) {
    super(config);
  }

  getExpose(): ExposeInterface {
    return {
      showModal: this.showModal.bind(this),
      closeModal: this.closeModal.bind(this),
      incCounter: this.incCounter.bind(this),
      getCount: this.getCount.bind(this),
      sillyTavern: window.SillyTavern,
      tavernHelper: window.TavernHelper
    };
  }

  public getCount(): number {
    return this.testCounter;
  }

  public incCounter(): void {
    this.testCounter += 1;
  }
}

// 全局实例管理
declare global {
  interface Window {
    modalController?: ModalController;
  }
}

// 自动初始化
(async function () {
  try {
    // 防止重复初始化
    if (window.modalController) {
      console.log("[Modal Controller] 控制器已存在，销毁旧实例");
      await window.modalController.destroy();
    }

    // 创建新实例
    const topWindow = window.top ?? window
    topWindow.modalController = new ModalController({modalUrl: 'http://127.0.0.1:5500'})

    console.log("[Modal Controller] 控制器已就绪，等待触发事件");
  } catch (error) {
    console.error("[Modal Controller] 初始化失败:", error);
  }
})();

// 导出用于 TypeScript 编译
export { ModalController };
export default ModalController;
