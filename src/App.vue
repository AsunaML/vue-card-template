<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, provide } from "vue";
import { type MessageBusConfig, HandlerRegistryImpl, MessageBusImpl } from "../communication";
import { sendModalReady, sendModalError } from "./scripts/send/send";
import TabLayout from "./components/TabLayout.vue";

const isInIframe = window !== window.top;
const windowSize = ref({ width: 0, height: 0 });

// 全局消息总线配置和实例
const messageBusConfig: Partial<MessageBusConfig> = {
  environment: "client",
  debugMode: true,
  allowedOrigins: ["*"],
};

// 使用reactive对象来管理全局状态
const globalState = reactive({
  messageBus: null as MessageBusImpl | null,
  handlerRegistry: null as HandlerRegistryImpl | null
});

// 提供全局服务
provide('isInIframe', isInIframe);
provide('windowSize', windowSize);
provide('globalState', globalState);

const updateWindowSize = () => {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

onMounted(async () => {
  console.log("[Vue App] 应用启动，iframe检测:", isInIframe);

  updateWindowSize();
  console.log("[Vue App] 窗口尺寸:", windowSize.value.width, "x", windowSize.value.height);

  if (isInIframe) {
    console.log("[Vue App] 运行在iframe环境中，初始化消息总线...");

    try {
      globalState.handlerRegistry = new HandlerRegistryImpl();
      globalState.messageBus = new MessageBusImpl(messageBusConfig, globalState.handlerRegistry);

      // 发送应用就绪消息，包含客户端信息
      await sendModalReady(globalState.messageBus, {
        width: windowSize.value.width,
        height: windowSize.value.height,
        userAgent: navigator.userAgent,
      });

      console.log("[Vue App] 消息总线初始化完成，已发送就绪信号");
    } catch (error) {
      console.error("[Vue App] 消息总线初始化失败:", error);
      if (globalState.messageBus) {
        await sendModalError(globalState.messageBus, error instanceof Error ? error : String(error));
      }
    }
  } else {
    console.log("[Vue App] 运行在直接浏览器中");
  }

  window.addEventListener("resize", updateWindowSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWindowSize);

  if (globalState.messageBus) {
    globalState.messageBus.destroy();
    globalState.messageBus = null;
  }

  console.log("[Vue App] 应用卸载，消息总线已清理");
});
</script>

<template>
  <div class="vue-modal-app">
    <TabLayout />
  </div>
</template>

<style scoped>
.vue-modal-app {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
}
</style>
