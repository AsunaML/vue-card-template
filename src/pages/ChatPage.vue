<script setup lang="ts">
import { ref } from "vue";

const newMessage = ref("");
const messages = ref([
  { id: 1, sender: "user", content: "你好！", time: "10:30" },
  { id: 2, sender: "assistant", content: "您好！我是角色卡片助手，很高兴为您服务！", time: "10:31" },
  { id: 3, sender: "user", content: "请介绍一下这个模板的功能", time: "10:32" },
  { id: 4, sender: "assistant", content: "这是一个Vue 3 + TypeScript的角色卡片模板，支持全屏悬浮窗显示，Chrome风格标签页切换等功能。", time: "10:33" },
]);

const sendMessage = () => {
  if (newMessage.value.trim()) {
    const newMsg = {
      id: Date.now(),
      sender: "user",
      content: newMessage.value.trim(),
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    messages.value.push(newMsg);
    newMessage.value = "";
  }
};
</script>

<template>
  <div class="h-full flex flex-col bg-black">

    <!-- 聊天消息显示区域 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 w-full bg-[#383c3d] rounded-lg">
      <div v-for="message in messages" :key="message.id" class="flex flex-col w-full">
        <!-- 消息按钮操作 -->
        <div class="mb-2 flex flex-row justify-between">
          <div>
            <p class="text-xs opacity-70 text-white">{{ message.time }}</p>
          </div>
          <div>
            <button class="text-white text-xs">Edit</button>
          </div>
        </div>
        <div :class="['max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 shadow-lg rounded-lg min-w-full', message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800']">
          <p class="text-sm">{{ message.content }}</p>
        </div>
      </div>
    </div>
    
    <div class="h-[1rem]"></div>

    <!-- 消息输入区域 -->
    <div class="p-4 bg-[#383c3d] rounded-lg">
      <div class="flex gap-2">
        <input v-model="newMessage" @keyup.enter="sendMessage" type="text" placeholder="输入消息..." class="flex-1 px-3 py-2 border rounded-sm border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-blue-500" />
        <button @click="sendMessage" class="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors rounded-sm">发送</button>
      </div>
    </div>
  </div>
</template>
