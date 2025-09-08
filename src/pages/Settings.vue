<script setup lang="ts">
import { ref } from "vue";

const settings = ref({
  theme: 'dark',
  autoSave: true,
  debugMode: false,
  animations: true,
  notifications: true
});

const saveSettings = () => {
  console.log('Settings saved:', settings.value);
  // 这里可以实现实际的保存逻辑
};

const resetSettings = () => {
  settings.value = {
    theme: 'dark',
    autoSave: true,
    debugMode: false,
    animations: true,
    notifications: true
  };
  console.log('Settings reset to defaults');
};
</script>

<template>
  <div class="p-8 text-white h-full overflow-y-auto">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-vue-green mb-4">⚙️ 设置</h1>
      <p class="text-xl text-white/80">配置您的模板偏好设置</p>
    </div>

    <div class="flex flex-col gap-8 mb-12">
      <div class="card-base">
        <h2 class="text-2xl font-bold text-vue-green mb-6">🎨 界面设置</h2>
        
        <div class="mb-5">
          <label class="flex justify-between items-center cursor-pointer py-3">
            <span class="text-base text-white/90">主题色调</span>
            <select 
              v-model="settings.theme" 
              class="bg-white/10 border border-white/20 rounded-md text-white px-3 py-2 text-sm cursor-pointer focus:outline-none focus:border-vue-green"
            >
              <option value="dark">深色模式</option>
              <option value="light">浅色模式</option>
              <option value="auto">跟随系统</option>
            </select>
          </label>
        </div>

        <div class="mb-5">
          <label class="flex justify-between items-center cursor-pointer py-3">
            <span class="text-base text-white/90">动画效果</span>
            <div class="relative">
              <input 
                type="checkbox" 
                v-model="settings.animations" 
                class="sr-only"
              />
              <div 
                :class="[
                  'w-5 h-5 bg-white/10 border-2 border-white/20 rounded transition-all duration-300 flex items-center justify-center',
                  { 'bg-vue-green border-vue-green': settings.animations }
                ]"
              >
                <span v-if="settings.animations" class="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="card-base">
        <h2 class="text-2xl font-bold text-vue-green mb-6">💾 功能设置</h2>
        
        <div class="mb-5">
          <label class="flex justify-between items-center cursor-pointer py-3">
            <span class="text-base text-white/90">自动保存</span>
            <div class="relative">
              <input 
                type="checkbox" 
                v-model="settings.autoSave" 
                class="sr-only"
              />
              <div 
                :class="[
                  'w-5 h-5 bg-white/10 border-2 border-white/20 rounded transition-all duration-300 flex items-center justify-center',
                  { 'bg-vue-green border-vue-green': settings.autoSave }
                ]"
              >
                <span v-if="settings.autoSave" class="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </label>
        </div>

        <div class="mb-5">
          <label class="flex justify-between items-center cursor-pointer py-3">
            <span class="text-base text-white/90">调试模式</span>
            <div class="relative">
              <input 
                type="checkbox" 
                v-model="settings.debugMode" 
                class="sr-only"
              />
              <div 
                :class="[
                  'w-5 h-5 bg-white/10 border-2 border-white/20 rounded transition-all duration-300 flex items-center justify-center',
                  { 'bg-vue-green border-vue-green': settings.debugMode }
                ]"
              >
                <span v-if="settings.debugMode" class="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </label>
        </div>

        <div class="mb-5">
          <label class="flex justify-between items-center cursor-pointer py-3">
            <span class="text-base text-white/90">通知提醒</span>
            <div class="relative">
              <input 
                type="checkbox" 
                v-model="settings.notifications" 
                class="sr-only"
              />
              <div 
                :class="[
                  'w-5 h-5 bg-white/10 border-2 border-white/20 rounded transition-all duration-300 flex items-center justify-center',
                  { 'bg-vue-green border-vue-green': settings.notifications }
                ]"
              >
                <span v-if="settings.notifications" class="text-white text-xs font-bold">✓</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="card-base">
        <h2 class="text-2xl font-bold text-vue-green mb-6">📊 当前配置</h2>
        <div class="bg-black/30 border border-white/10 rounded-lg p-4">
          <pre class="text-vue-green text-sm font-mono whitespace-pre-wrap">{{ JSON.stringify(settings, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <div class="flex gap-4 justify-center flex-wrap">
      <button @click="saveSettings" class="btn-primary">
        💾 保存设置
      </button>
      <button @click="resetSettings" class="btn-secondary">
        🔄 重置默认
      </button>
    </div>
  </div>
</template>

