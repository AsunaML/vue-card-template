<script setup lang="ts">
import { ref, inject } from "vue";
import { sendCloseModal } from "../scripts/send/send";

const globalState = inject('globalState', { messageBus: null });
const testHeight = ref("500px");
const innerModalState = ref(false);

const openInnerModal = () => {
  innerModalState.value = true;
  console.log("Opening inner modal");
};

const closeInnerModal = () => {
  innerModalState.value = false;
  console.log("Closing inner modal");
};

const closeMainModal = async () => {
  console.log("Closing main modal");

  if (globalState?.messageBus) {
    try {
      await sendCloseModal(globalState.messageBus, 'user action from demo page')
    } catch (error) {
      console.error("Failed to send close modal message:", error);
    }
  }
};
</script>

<template>
  <div class="p-8 text-white h-full overflow-y-auto">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-vue-green mb-4">🎮 交互演示</h1>
      <p class="text-xl text-white/80">这里展示各种交互功能和测试用例</p>
    </div>

    <div class="flex flex-col gap-8">
      <div class="card-base">
        <h2 class="text-2xl font-bold text-vue-green mb-5">🔧 功能测试</h2>
        <div class="flex flex-wrap gap-4">
          <button 
            @click="testHeight = testHeight === '500px' ? '800px' : '500px'" 
            class="btn-secondary"
          >
            📏 测试高度切换 ({{ testHeight }})
          </button>

          <button @click="openInnerModal" class="btn-secondary">
            🔄 打开内部悬浮窗
          </button>

          <button @click="closeMainModal" class="btn-primary">
            🚪 关闭主悬浮窗
          </button>
        </div>
      </div>

      <div class="card-base">
        <h2 class="text-2xl font-bold text-vue-green mb-5">📊 状态信息</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span class="text-white/70">测试高度:</span>
            <span class="text-vue-green font-semibold">{{ testHeight }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span class="text-white/70">内部悬浮窗:</span>
            <span class="text-vue-green font-semibold">{{ innerModalState ? '已打开' : '已关闭' }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <span class="text-white/70">消息总线:</span>
            <span class="text-vue-green font-semibold">{{ globalState?.messageBus ? '已连接' : '未连接' }}</span>
          </div>
        </div>
      </div>

      <div class="card-base">
        <h2 class="text-2xl font-bold text-vue-green mb-5">💡 说明</h2>
        <div class="flex flex-col gap-3">
          <div class="p-3 bg-white/5 rounded-lg leading-relaxed">
            <strong class="text-vue-green">高度切换:</strong> 演示动态调整组件高度
          </div>
          <div class="p-3 bg-white/5 rounded-lg leading-relaxed">
            <strong class="text-vue-green">内部悬浮窗:</strong> 演示多层模态框效果
          </div>
          <div class="p-3 bg-white/5 rounded-lg leading-relaxed">
            <strong class="text-vue-green">关闭主窗口:</strong> 通过消息总线向服务端发送关闭指令
          </div>
        </div>
      </div>
    </div>

    <!-- 内部测试悬浮窗 -->
    <div v-if="innerModalState" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] animate-fade-in" @click.self="closeInnerModal">
      <div class="bg-slate-800 rounded-xl border-2 border-indigo-400 shadow-2xl max-w-lg w-4/5 animate-slide-up">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 flex justify-between items-center rounded-t-lg">
          <h3 class="text-xl font-semibold text-white">内部测试悬浮窗</h3>
          <button 
            @click="closeInnerModal" 
            class="bg-white/10 border border-white/20 text-white text-lg cursor-pointer p-1.5 rounded-md transition-all duration-200 w-8 h-8 flex items-center justify-center hover:bg-white/20 hover:scale-110"
          >
            ×
          </button>
        </div>

        <div class="p-6 text-white">
          <p class="mb-3">这是一个内部测试悬浮窗，演示多层模态框的效果。</p>
          <p class="mb-3">当前测试高度: <strong class="text-vue-green">{{ testHeight }}</strong></p>
          <p class="mb-5">你可以看到，这个内部悬浮窗同样可以正常显示。</p>

          <div class="flex justify-center">
            <button @click="closeInnerModal" class="btn-secondary">
              关闭内部悬浮窗
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义动画 */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>