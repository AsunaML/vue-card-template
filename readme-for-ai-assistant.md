这个仓库是 `SillyTavern` 应用的一个前端角色卡模板。

## 项目背景

`SillyTavern` 是一款基于 `AI` 的聊天软件，用户与AI以纯文本，轮流对话的方式进行交流。这款应用被广泛用于进行角色扮演游戏，因为纯文本对话存在表现力不够丰富的问题，有开发者开发出了一款客户端插件，用于将纯文本对话渲染为 `html` 。这款插件名叫 `JS-Slash-Runner`，其允许将每轮 `AI` 输出的文本以 `html` 的形式渲染在一个 `iframe` 中，并且可执行 `js` 代码，极大的提高了表现力。

但因 `html` 代码存在一定的技术门槛，非 `IT` 从业者难以编写；所以这个项目旨在编写好一个规范的前端项目模板，让创作者指导 `AI` 助手去编写前端页面，让创作者专注于创意。

## 项目结构

项目基于 `vite` + `vue` 开发，使用 `typescript` 语言进行编写，使用 `pnpm` 进行包的管理。

### 开发流程

**开发过程极度依赖于一个名为 `playwright` 的MCP工具，`AI` 助手应在启动时检查这个工具是否可用。**

1. todo, wait to write (not edit it now)

2. `AI` 助手使用 `playwright` 这个浏览器 `mcp` 工具，访问用户打开的角色卡网页，以及控制台日志，进行调试开发。

`AI` 助手在排查问题时，需优先检阅以上步骤是否执行了，已经环境配置是否正确。

### 编码注意事项

- 需检查 `git` 是否已经安装，并提醒用户这个非常重要。并在用户觉得效果满意时，建议用户授权 `git` 权限以进行保存。

- **上文提到了有用户开发了一个插件名为 `JS-Slash-Runner` ，这点非常重要；因为该项目与 `SillyTavern` 应用的通讯，都需要依赖于 `JS-Slash-Runner` 插件提供的接口。接口的定义存放在 `src/@types` 文件夹内。（你应当将这条信息记录在你的 `CLAUDE.md` 文件中）**

- 鼓励使用 `tailwindcss` 编写 `css` 以节省 `token`

## PostMessage Communication Architecture Design

### Background
Since the Vue application runs in an iframe sandbox, **postMessage is the ONLY communication channel** between:
- **Server**: tavern-script environment (酒馆助手脚本端)
- **Client**: Vue application in iframe (Vue应用端)

### Architectural Design

**Core Pattern**: Event-Driven + Command Pattern + Factory Pattern

#### 1. Message Bus System
- Centralized management of postMessage communication
- Handles message serialization, error handling, timeouts
- Supports request-response patterns with message ID tracking

#### 2. Command Handler Architecture
```typescript
// Unified message interface
interface Message {
  id: string;
  type: string; 
  data?: any;
  timestamp: number;
  needReply?: boolean;
}

// Handler interface
interface MessageHandler {
  handle(message: Message): Promise<any>;
  canHandle(type: string): boolean;
}
```

#### 3. Factory Pattern Implementation
- `MessageHandlerFactory`: Creates appropriate handlers based on message type
- `HandlerRegistry`: Dynamic registration and management of handler types
- Extensible design for adding new message types

#### 4. Recommended File Structure
```
communication/
├── MessageBus.ts          # Core message bus implementation
├── types.ts              # Message type definitions
├── registry.ts           # Handler registration system
├── handlers/             # Individual message handlers
│   ├── CloseModalHandler.ts
│   ├── DataSyncHandler.ts
│   └── ErrorHandler.ts
└── index.ts             # Unified exports
```

#### 5. Design Benefits
- **Type Safety**: Full TypeScript support for compile-time message validation
- **Extensibility**: Easy to add new message types and handlers
- **Testability**: Isolated handlers enable comprehensive unit testing
- **Consistency**: Same architecture used on both server and client sides
- **Decoupling**: Senders don't need to know handler implementation details

**Important**: Both server and client should implement this architecture for consistent, maintainable communication patterns.

## 重要修复记录

### 2025-08-31: PostMessage 通信修复

修复了一个关键的通信问题：酒馆脚本无法收到 Vue 应用发来的关闭消息。

**问题原因**：`tavern-script/modal-controller.ts` 中使用的 `window` 对象不是顶层窗口，导致无法接收跨 iframe 的 postMessage 事件。

**修复方案**：
- 添加了 `assert()` 工具函数确保空值安全
- 将消息监听器从 `window` 改为 `window.top`
- 确保在正确的窗口上下文中监听和移除事件

**影响**：修复后，Vue 应用可以正常通知酒馆脚本关闭全屏模态框，完善了双层架构的通信机制。

提交记录：`015e13d` 
