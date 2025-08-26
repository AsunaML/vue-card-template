<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isInIframe = window !== window.top
const testHeight = ref('500px') // 固定高度测试
const showModal = ref(false) // 悬浮窗显示状态
const windowSize = ref({ width: 0, height: 0 }) // 窗口尺寸状态

const openModal = () => {
  showModal.value = true
  console.log('Opening modal')
}

const closeModal = () => {
  showModal.value = false
  console.log('Closing modal')
}

const updateWindowSize = () => {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

onMounted(() => {
  console.log('App mounted, iframe detected:', isInIframe)
  
  updateWindowSize()
  console.log('Window size:', windowSize.value.width, 'x', windowSize.value.height)
  
  if (isInIframe) {
    console.log('Running in iframe environment')
  } else {
    console.log('Running in direct browser')
  }
  
  window.addEventListener('resize', updateWindowSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize)
})
</script>

<template>
  <div class="test-container" :style="{ height: testHeight }">
    <h1>Vue Card Template - 悬浮窗测试</h1>
    <p>当前环境: {{ isInIframe ? 'iframe中' : '直接浏览器' }}</p>
    <p>窗口尺寸: {{ windowSize.width }} x {{ windowSize.height }}</p>
    <p>测试容器高度: {{ testHeight }}</p>
    
    <div class="button-group">
      <button @click="testHeight = testHeight === '500px' ? '800px' : '500px'" class="test-btn">
        切换高度 ({{ testHeight }})
      </button>
      
      <button @click="openModal" class="test-btn modal-btn">
        打开悬浮窗
      </button>
    </div>
  </div>

  <!-- 简单的悬浮窗 -->
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>悬浮窗测试</h2>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <p>这是一个简单的悬浮窗组件</p>
        <p>环境: {{ isInIframe ? 'iframe中' : '直接浏览器' }}</p>
        <p>当前窗口: {{ windowSize.width }} x {{ windowSize.height }}</p>
        
        <div class="modal-actions">
          <button @click="closeModal" class="test-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid #42b883;
  box-sizing: border-box;
}

.test-container h1 {
  margin: 0 0 20px 0;
  font-size: 2rem;
}

.test-container p {
  margin: 8px 0;
  font-size: 1.1rem;
}

.test-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.test-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.button-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.modal-btn {
  background: rgba(66, 184, 131, 0.3);
  border-color: rgba(66, 184, 131, 0.5);
}

.modal-btn:hover {
  background: rgba(66, 184, 131, 0.5);
}

/* 悬浮窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #2d2d2d;
  border-radius: 12px;
  border: 2px solid #42b883;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
  max-height: 80%;
  overflow: hidden;
}

.modal-header {
  background: #3d3d3d;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #555;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 1.4rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #555;
  color: white;
}

.modal-body {
  padding: 24px;
  color: white;
}

.modal-body p {
  margin: 12px 0;
  font-size: 1rem;
  line-height: 1.5;
}

.modal-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
