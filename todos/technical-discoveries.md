# 技术发现和洞察记录

## JS-Slash-Runner源码分析

### vh单位自动转换机制
通过分析 `references/JS-Slash-Runner/src/component/message_iframe/render_message.ts` 发现：

#### 检测逻辑
```typescript
const hasMinVh = /min-height:\s*[^;]*vh/.test(extractedText);
```

#### 转换逻辑 (行239-249)
```typescript
processedContent = processedContent.replace(/min-height:\s*([^;]*vh[^;]*);/g, expression => {
  const processedExpression = expression.replace(/(\d+(?:\.\d+)?)vh/g, num => {
    const numValue = parseFloat(num);
    if (numValue === 100) {
      return `var(--viewport-height, ${viewportHeight}px)`;
    } else {
      return `calc(var(--viewport-height, ${viewportHeight}px) * ${numValue / 100})`;
    }
  });
  return `${processedExpression};`;
});
```

#### 内联样式处理 (行252-267)
```typescript
processedContent = processedContent.replace(
  /style\s*=\s*["']([^"']*min-height:\s*[^"']*vh[^"']*?)["']/gi,
  (match, styleContent) => {
    const processedStyleContent = styleContent.replace(/min-height:\s*([^;]*vh[^;]*)/g, (expression: string) => {
      const processedExpression = expression.replace(/(\d+(?:\.\d+)?)vh/g, num => {
        // 同样的转换逻辑
      });
      return processedExpression;
    });
    return match.replace(styleContent, processedStyleContent);
  },
);
```

#### Viewport高度更新 (行275+)
```typescript
export function updateIframeViewportHeight() {
  $(window).on('resize', function () {
    if ($('iframe[data-needs-vh="true"]').length) {
      const viewportHeight = window.innerHeight;
      $('iframe[data-needs-vh="true"]').each(function () {
        // postMessage to iframe
      });
    }
  });
}
```

### 关键发现

1. **只处理 `min-height` 属性**: JS-Slash-Runner只转换 `min-height: *vh`，不处理其他属性如 `height`、`max-height`

2. **需要 `data-needs-vh="true"` 属性**: iframe元素需要这个属性才会被检测和处理

3. **CSS变量模式**: 转换后使用 `var(--viewport-height, fallback)` 模式

4. **文档说明**: "为防止高度无限增长，代码中的min-height: * vh 会被自动转换为以浏览器高度为基准"

## Vue技术问题解决

### Window对象访问问题
**问题**: 在Vue模板中直接使用 `{{ window.innerWidth }}` 导致错误

**原因**: Vue的响应式系统中，`window` 对象可能在某些情况下不可用

**解决方案**:
```typescript
// 错误方式
<p>窗口尺寸: {{ window.innerWidth }} x {{ window.innerHeight }}</p>

// 正确方式
const windowSize = ref({ width: 0, height: 0 })
const updateWindowSize = () => {
  windowSize.value = { width: window.innerWidth, height: window.innerHeight }
}
<p>窗口尺寸: {{ windowSize.width }} x {{ windowSize.height }}</p>
```

### iframe环境检测
```typescript
const isInIframe = window !== window.top
```
这个检测方法在所有尝试中都工作正常。

## 浏览器安全限制

### 跨域iframe访问
尝试访问 `window.parent.innerWidth` 时遇到跨域安全限制：
```typescript
try {
  if (window.parent && window.parent !== window) {
    width = window.parent.innerWidth  // SecurityError
    height = window.parent.innerHeight
  }
} catch (error) {
  console.log('Cannot access parent window')
}
```

### PostMessage通信限制
尝试使用postMessage进行父子窗口通信，但需要父窗口的配合，单方面无法实现。

## CSS定位策略尝试

### Fixed定位 + vh单位
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  min-height: 100vh;  /* 期望被JS-Slash-Runner转换 */
}
```
**结果**: 仍然被iframe高度限制

### 强制大尺寸
```css
.modal-overlay {
  width: 2000px;
  height: 1500px;
}
```
**结果**: 导致UI元素消失

## Browser-Tools-MCP调试发现

### 可用功能
- `mcp__browser-mcp__getConsoleLogs`: 成功获取控制台日志
- `mcp__browser-mcp__getConsoleErrors`: 成功获取错误信息
- `mcp__browser-mcp__wipeLogs`: 成功清除日志

### 权限限制
- Screenshot功能需要特殊权限设置
- DevTools URL访问受限

### 日志观察
- Vue应用的console.log在SillyTavern环境中可能不显示
- SillyTavern自身产生大量debug日志

## 开发环境发现

### 热重载机制
- Vite开发服务器热重载工作正常
- 代码更改能实时反映到 http://127.0.0.1:5500
- SillyTavern iframe中的内容也会同步更新

### 端口和URL
- 开发服务器: http://127.0.0.1:5500
- SillyTavern中iframe id: message-iframe-0-1
- WebFetch工具对本地HTTP有SSL协议问题

## 未探索的方向

### 可能的解决方案
1. **Transform/Scale策略**: 使用CSS transform缩放来突破iframe限制
2. **Multiple iframe策略**: 创建多个iframe来组合实现全屏效果
3. **JS-Slash-Runner插件扩展**: 直接修改JS-Slash-Runner的处理逻辑
4. **局部脚本应用**: 利用酒馆助手的局部脚本功能
5. **DOM修改策略**: 在运行时动态修改iframe的样式和属性

### 需要进一步研究
1. SillyTavern的iframe沙箱具体限制机制
2. JS-Slash-Runner的局部脚本API和能力
3. 其他CSS定位属性的可能性（如clip-path等）
4. 浏览器原生全屏API的适用性