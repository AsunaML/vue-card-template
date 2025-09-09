<script setup lang="ts">
import { ref, inject } from "vue";
import ChatPage from "../pages/ChatPage.vue";
import CardDemo from "../pages/CardDemo.vue";
import Settings from "../pages/Settings.vue";
import { type Expose } from "../scripts/ExposeTypes";
import log from "../scripts/log";

const parentApi = inject<Expose | null>('parentApi', null);

interface Tab {
  id: string;
  title: string;
  component: any;
  icon: string;
}

const tabs: Record<string, Tab> = {
  'home': { id: 'home', title: '聊天', component: ChatPage, icon: '🏠' },
  'demo': { id: 'demo', title: '演示', component: CardDemo, icon: '🎮' },
  'settings': { id: 'settings', title: '设置', component: Settings, icon: '⚙️' }, 
}

const activeTab = ref('home');

const switchTab = (tabId: string) => {

  if (!(tabId in tabs)) {
    log(`非法的标签页ID: ${tabId}`, 'warn')
    return
  }

  activeTab.value = tabId;
  log(`切换到标签页: ${tabs[tabId]['title']}`);
};

const closeModal = async () => {
  log("关闭主悬浮窗");
  if (parentApi === null) {
    log('parentApi is null', 'warn')
  }
  else {
    if (parentApi.data === null) {
      log('parentApi.data is null', 'warn')
    }
    else {
      parentApi.data.closeModal()
    }
  }
};

async function incCounter() {
  if (parentApi !== null && parentApi.data !== null) {
    await parentApi.data.incCounter()
    log('increment done')
  }
}

async function getCount() {
  if (parentApi !== null && parentApi.data !== null) {
    const value = await parentApi.data.getCount()
    log(`count is ${value}`)
  }
}

</script>

<template>
  <div class="tab-layout">
    <!-- 模态框覆盖层 -->
    <div class="fixed inset-0 bg-black/90 z-[9999] backdrop-blur-sm animate-fade-in" @click.self="closeModal">

      <div class="bg-black w-full h-full overflow-hidden animate-slide-up flex flex-col">
        
        <!-- Chrome风格标签栏 bg-gradient-to-r from-vue-green to-vue-dark    border-b border-white/10  -->
        <div class="bg-[#171717] rounded-lg flex items-center min-h-[48px] my-4 mx-2 p-2">

          <div class="flex flex-1 items-stretch">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="switchTab(tab.id)"
              :class="[
                'flex rounded-lg items-center gap-2 px-5 py-3 border-none cursor-pointer transition-all duration-300 relative mr-3 min-w-[120px] justify-center',
                activeTab === tab.id
                  ? 'bg-[#383c3d] text-white font-bold shadow-lg shadow-white/20 border-b-2 border-vue-green'
                  : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white/90 hover:scale-105'
              ]"
            >
              <span class="text-base">{{ tab.icon }}</span>
              <span class="text-sm font-medium md:inline hidden">{{ tab.title }}</span>
            </button>
          </div>
          
          <div class="flex items-center px-4">
            <button 
              @click="incCounter" 
              class="bg-white/10 mr-4 border border-white/20 text-white text-lg cursor-pointer rounded-md transition-all duration-200 w-12 h-9 flex items-center justify-center hover:bg-red-500/30 hover:border-red-500/50 hover:scale-105" 
              title="增加"    
            >
              Add
            </button>
            <button 
              @click="getCount" 
              class="bg-white/10 mr-4 border border-white/20 text-white text-lg cursor-pointer rounded-md transition-all duration-200 w-12 h-9 flex items-center justify-center hover:bg-red-500/30 hover:border-red-500/50 hover:scale-105" 
              title="获取"    
            >
              Get
            </button>
            <button 
              @click="closeModal" 
              class="bg-white/10 border border-white/20 text-white text-lg cursor-pointer p-2 rounded-md transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-red-500/30 hover:border-red-500/50 hover:scale-105" 
              title="关闭 (ESC)"    
            >
              ×
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="tab-content-box rounded-lg mx-2 flex-1 bg-slate-800 overflow-hidden flex flex-col mb-2">
          <component 
            :is="activeTab in tabs ? tabs[activeTab].component : null"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-layout {
  width: 100%;
  height: 100%;
}

/* 自定义动画 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
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

/* 响应式处理标签栏滚动 */
@media (max-width: 480px) {
  .tabs-container {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .tabs-container::-webkit-scrollbar {
    display: none;
  }
}
</style>