<script setup lang="ts">
import { onMounted, onUnmounted, provide } from "vue";
import TabLayout from "./components/TabLayout.vue";
import * as Comlink from "comlink";
import { type Expose } from "./scripts/ExposeTypes";
import type { ExposeInterface } from "../tavern-script/ModalController";
import log from './scripts/log'

const isInIframe = window !== window.top;
let parentApi: Expose = { data: null };

// 提供全局服务
provide("isInIframe", isInIframe);
provide("parentApi", parentApi);

onMounted(async () => {
  if (isInIframe) {
    log("[Vue App] 运行在iframe环境中");
    window.addEventListener("message", (event) => {
      log("[Vue App] 从获取到端口消息");
      const port = event.data.port as MessagePort;
      parentApi.data = Comlink.wrap<ExposeInterface>(port);
    });
  } else {
    log("[Vue App] 运行在直接浏览器中");
  }

  // 发送iframe就绪消息, 用于获取消息通道端口
  window.parent.postMessage("ready", "*");
  log("发送iframe就绪消息完毕");
});

onUnmounted(() => {
  log("[Vue App] 应用已卸载");
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
