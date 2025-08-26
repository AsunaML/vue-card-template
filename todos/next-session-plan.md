# 下次会话计划

## 会话目标
专注解决Vue悬浮窗在SillyTavern iframe环境中的高度限制问题，实现真正的全屏效果。

## 当前状态摘要

### ✅ 已完成
- 基础悬浮窗功能完整实现
- 直接浏览器环境中完全正常工作
- iframe环境检测和响应式窗口尺寸处理
- JS-Slash-Runner源码分析和vh单位转换机制理解
- 多种方案尝试和技术发现记录

### ❌ 核心问题未解决
SillyTavern iframe中悬浮窗高度仍被限制，无法实现全屏覆盖效果

## 下次会话起点

### 代码状态
- **Git分支**: `dev`
- **最新提交**: 包含vh单位尝试的版本
- **稳定基础**: 有完整可工作的悬浮窗基础功能

### 环境准备
1. 确保 `npm run dev` 运行正常
2. 验证 http://127.0.0.1:5500 基础功能
3. 在SillyTavern中测试iframe环境

## 建议的探索方向

### 优先级1: CSS Transform/Scale策略
尝试使用CSS transform来突破iframe限制：
```css
.modal-overlay {
  transform: scale(1);
  transform-origin: top left;
  /* 可能需要结合position和z-index */
}
```

### 优先级2: 多层iframe策略
研究是否可以创建多个层级的iframe来实现全屏效果。

### 优先级3: 浏览器原生全屏API
探索使用 `document.documentElement.requestFullscreen()` 等原生API：
```typescript
const goFullscreen = () => {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen()
  }
}
```

### 优先级4: DOM运行时修改
尝试在运行时动态修改iframe的样式和属性：
```typescript
if (isInIframe) {
  const iframe = window.frameElement
  if (iframe) {
    iframe.style.position = 'fixed'
    iframe.style.top = '0'
    iframe.style.left = '0'
    iframe.style.width = '100vw'
    iframe.style.height = '100vh'
    iframe.style.zIndex = '9999'
  }
}
```

### 优先级5: JS-Slash-Runner局部脚本
深入研究酒馆助手的局部脚本功能，看是否能通过脚本来辅助布局。

## 调试策略

### 1. 渐进式测试
每次只修改一个方面，确保能准确定位问题和解决方案。

### 2. 双环境验证
每个方案都需要在直接浏览器和SillyTavern iframe中测试。

### 3. 详细日志记录
增加console.log来跟踪CSS属性、iframe属性等关键信息。

### 4. Browser-Tools-MCP充分利用
使用可用的调试工具来观察DOM变化和样式应用。

## 技术资源

### 已有的技术洞察
- `todos/technical-discoveries.md`: JS-Slash-Runner工作机制详解
- `todos/iframe-height-problem.md`: 问题详述和已尝试方案
- `todos/current-working-solution.md`: 当前可用的基础实现

### 开发工具
- Browser-tools-mcp: 控制台和错误日志查看
- Vue DevTools: 组件状态调试
- Git: 版本控制和回滚能力

### 参考资源
- `references/JS-Slash-Runner/`: 源码参考
- `CLAUDE.md`: 项目文档和开发指南

## 期望结果

在下次会话结束时，实现以下目标之一：
1. **最佳结果**: 悬浮窗在iframe中实现真正全屏效果
2. **次优结果**: 找到一个可行的变通方案（如伪全屏）
3. **保底结果**: 明确确定技术限制边界，为用户提供清晰的说明

## 备注

- 保持当前的基础功能完整性
- 确保直接浏览器环境中的功能不受影响
- 记录所有新的尝试和发现，继续完善技术文档