<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isInIframe = window !== window.top
const testHeight = ref('500px') // 固定高度测试
const showModal = ref(false) // 悬浮窗显示状态
const windowSize = ref({ width: 0, height: 0 }) // 窗口尺寸状态

// PostMessage 通信接口
interface PostMessageData {
  type: string
  data?: any
}

const sendMessage = (type: string, data?: any) => {
  if (isInIframe && window.parent) {
    const message: PostMessageData = { type, data }
    window.parent.postMessage(message, '*')
    console.log(`[Vue App] 发送消息:`, message)
  }
}

const openModal = () => {
  showModal.value = true
  console.log('Opening modal')
}

const closeModal = () => {
  showModal.value = false
  console.log('Closing modal')
  
  // 通过 postMessage 通知酒馆助手关闭悬浮窗
  sendMessage('CLOSE_MODAL')
}

const updateWindowSize = () => {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

onMounted(() => {
  console.log('[Vue App] 应用启动，iframe检测:', isInIframe)
  
  updateWindowSize()
  console.log('[Vue App] 窗口尺寸:', windowSize.value.width, 'x', windowSize.value.height)
  
  if (isInIframe) {
    console.log('[Vue App] 运行在iframe环境中')
    // 通知酒馆助手应用已就绪
    sendMessage('MODAL_READY')
  } else {
    console.log('[Vue App] 运行在直接浏览器中')
  }
  
  // 添加事件监听
  window.addEventListener('resize', updateWindowSize)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize)
  window.removeEventListener('keydown', handleKeyDown)
  console.log('[Vue App] 应用卸载')
})
</script>

<template>
  <div class="vue-modal-app">
    <!-- 在新架构中，整个Vue应用就是悬浮窗内容 -->
    <div class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>🎭 Vue Character Card Template</h2>
          <button @click="closeModal" class="close-btn" title="关闭 (ESC)">×</button>
        </div>
        
        <div class="modal-body">
          <div class="card-demo">
            <h3>✨ 角色卡片模板演示</h3>
            <p>这是一个运行在全屏悬浮窗中的 Vue 3 + TypeScript 角色卡片模板。</p>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="label">运行环境:</span>
                <span class="value">{{ isInIframe ? '🪟 Iframe (全屏)' : '🌐 直接浏览器' }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">窗口尺寸:</span>
                <span class="value">{{ windowSize.width }} × {{ windowSize.height }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">架构:</span>
                <span class="value">双层架构 (Trigger + Modal)</span>
              </div>
            </div>
            
            <div class="features">
              <h4>🚀 模板特性</h4>
              <ul>
                <li>✅ 突破 SillyTavern iframe 高度限制</li>
                <li>✅ 支持全屏悬浮窗显示</li>
                <li>✅ PostMessage 安全通信</li>
                <li>✅ Vue 3 + TypeScript + Vite</li>
                <li>✅ 响应式设计和热重载</li>
              </ul>
            </div>
            
            <div class="demo-actions">
              <button @click="testHeight = testHeight === '500px' ? '800px' : '500px'" class="action-btn secondary">
                📏 测试高度切换
              </button>
              
              <button @click="openModal" class="action-btn secondary">
                🔄 切换内部悬浮窗
              </button>
              
              <button @click="closeModal" class="action-btn primary">
                🚪 关闭悬浮窗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内部测试悬浮窗 (用于演示多层模态框) -->
    <div v-if="showModal" class="inner-modal-overlay" @click.self="() => showModal = false">
      <div class="inner-modal-content">
        <div class="inner-modal-header">
          <h3>内部测试悬浮窗</h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>
        
        <div class="inner-modal-body">
          <p>这是一个内部测试悬浮窗，演示多层模态框的效果。</p>
          <p>当前测试高度: {{ testHeight }}</p>
          <p>你可以看到，这个内部悬浮窗同样可以正常显示。</p>
          
          <div class="inner-modal-actions">
            <button @click="showModal = false" class="action-btn secondary">关闭内部悬浮窗</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Vue Modal App 样式 */
.vue-modal-app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 主悬浮窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 16px;
  border: 2px solid #42b883;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 1.6rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-body {
  padding: 32px;
  color: white;
  overflow-y: auto;
  max-height: calc(90vh - 100px);
}

.card-demo h3 {
  margin: 0 0 16px 0;
  font-size: 1.4rem;
  color: #42b883;
}

.card-demo p {
  margin: 12px 0;
  font-size: 1.1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.info-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.info-item .value {
  color: #42b883;
  font-weight: 600;
}

/* 特性列表 */
.features {
  margin: 24px 0;
  padding: 20px;
  background: rgba(66, 184, 131, 0.1);
  border: 1px solid rgba(66, 184, 131, 0.3);
  border-radius: 8px;
}

.features h4 {
  margin: 0 0 16px 0;
  color: #42b883;
  font-size: 1.2rem;
}

.features ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.features li {
  margin: 8px 0;
  line-height: 1.5;
  position: relative;
}

/* 操作按钮 */
.demo-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 32px;
}

.action-btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(66, 184, 131, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* 内部悬浮窗样式 */
.inner-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.inner-modal-content {
  background: #1a202c;
  border-radius: 12px;
  border: 2px solid #667eea;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 80%;
  animation: slideUp 0.2s ease-out;
}

.inner-modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 10px 10px 0 0;
}

.inner-modal-header h3 {
  margin: 0;
  color: white;
  font-size: 1.3rem;
}

.inner-modal-body {
  padding: 24px;
  color: white;
}

.inner-modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-body {
    padding: 24px 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .demo-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-btn {
    width: 100%;
    max-width: 200px;
  }
}
</style>
