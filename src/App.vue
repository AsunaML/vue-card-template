<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isInIframe = window !== window.top
const testHeight = ref('500px') // 固定高度测试

onMounted(() => {
  console.log('App mounted, iframe detected:', isInIframe)
  console.log('Window size:', window.innerWidth, 'x', window.innerHeight)
  
  if (isInIframe) {
    console.log('Running in iframe environment')
  } else {
    console.log('Running in direct browser')
  }
})
</script>

<template>
  <div class="test-container" :style="{ height: testHeight }">
    <h1>Vue Card Template - 基础测试</h1>
    <p>当前环境: {{ isInIframe ? 'iframe中' : '直接浏览器' }}</p>
    <p>窗口尺寸: {{ window.innerWidth }} x {{ window.innerHeight }}</p>
    <p>测试容器高度: {{ testHeight }}</p>
    
    <button @click="testHeight = testHeight === '500px' ? '800px' : '500px'" class="test-btn">
      切换高度 ({{ testHeight }})
    </button>
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
</style>
