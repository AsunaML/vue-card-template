<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from "vue";
import TabLayout from "./components/TabLayout.vue";
import * as Comlink from "comlink"
import { type Expose } from "./scripts/ExposeTypes";
import type { ExposeInterface } from "../tavern-script/modal-controller"

const isInIframe = window !== window.top;
const windowSize = ref({ width: 0, height: 0 });

let parentApi: Expose = { data: null };

window.addEventListener("message", (event) => {
  console.log('获取到端口消息')
  const port = event.data.port as MessagePort;
  parentApi.data = Comlink.wrap<ExposeInterface>(port);
});

// 提供全局服务
provide('isInIframe', isInIframe);
provide('windowSize', windowSize);
provide('parentApi', parentApi);

const updateWindowSize = () => {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

// 告诉父页面“我准备好了”
window.parent.postMessage("ready", "*");

onMounted(async () => {
  console.log("[Vue App] 应用启动，iframe检测:", isInIframe);

  updateWindowSize();
  console.log("[Vue App] 窗口尺寸:", windowSize.value.width, "x", windowSize.value.height);

  if (isInIframe) {
    console.log("[Vue App] 运行在iframe环境中");
  } else {
    console.log("[Vue App] 运行在直接浏览器中");
  }

  window.parent.postMessage("ready", "*");
  console.log('Send ready message over.')

  window.addEventListener("resize", updateWindowSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWindowSize);

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
