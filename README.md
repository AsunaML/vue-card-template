（简介是写给需要使用这个仓库的其他非技术人员看的，AI助手可以无视这个文档）

# 简介

## 工具的安装和使用

### vscode 必备插件（必须）

按 `ctrl+shift+x` 打开扩展选项，搜索以下拓展并安装。

- Live Preview

- Vue(Official)

### browser-tools-mcp

这是一个AI可以看到你浏览器的日志和截图，帮助你更好的开发代码的工具，以下是安装步骤。

1. 打开链接：https://github.com/AgentDeskAI/browser-tools-mcp/releases/tag/v1.2.0

2. 下载 `BrowserTools-1.2.0-extension.zip` ，然后解压文件

3. 打开你浏览器的扩展设置页面（这一步各个浏览器可能操作方法不尽相同，若有不同的步骤，上网搜索 `xxx浏览器该如何加载解压缩的拓展`）

4. 点击 `加载解压缩的拓展` ，单击选择 `chrome-extension` 文件夹（不要进去），然后点击 `选择文件夹` 。

6. 运行安装命令

```shell
# 先运行命令安装与浏览器进行通讯的服务器
pnpx @agentdeskai/browser-tools-server@latest

# 然后运行命令预先安装一次 mcp 服务器
pnpx @agentdeskai/browser-tools-mcp@latest

# 安装成功后按 ctrl+c 退出，然后执行以下命令，向 clacude code 中添加这个 mcp （可选，你不使用 clacude code 就不用安装）
claude mcp add browser-mcp -- pnpx @agentdeskai/browser-tools-mcp@latest
```

7. 按 `F12` 打开控制台窗口，这时候，页面应该会显示 `"BroswerTools MCP"已开始调试此浏览器` ，有这个显示说明就成功了。

8. 如果还是有问题，请复查后上面的步骤是否已经执行成功了，以及阅读官方文档：https://browsertools.agentdesk.ai/installation
