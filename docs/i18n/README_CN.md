# WebAI-MCP - cpjet64增强版

> 让您的AI工具更强大，能够与浏览器进行十倍意识和交互

[English](../../README.md) | 简体中文

WebAI-MCP是一个强大的浏览器监控和交互工具，通过Anthropic的Model Context Protocol (MCP) 使AI应用程序能够通过Chrome扩展程序捕获和分析浏览器数据。

## 🚀 此版本的新功能 (v1.4.0)

此版本包含**所有社区贡献**和主要增强功能，具有**完整功能集成**：

### ✨ **新集成功能**
- 🍪 **存储访问工具** - 访问cookies、localStorage和sessionStorage
- 🔍 **高级元素检查** - 基于CSS选择器的元素检查和计算样式
- 📸 **增强截图** - 修复了独立开发工具窗口的截图捕获
- 🧪 **审计和调试模式** - 通过Lighthouse进行综合分析工具
- 🪟 **Windows兼容性** - 完整的Windows支持和路径转换
- 🌍 **多语言文档** - 中文翻译支持
- 🤖 **自动化发布** - 专业的发布自动化和NPM发布
- 🔧 **自动化诊断** - 完整的诊断和设置工作流程
- 🛡️ **增强错误处理** - 强大的错误管理和恢复
- 🌐 **代理支持** - 完整的网络配置和代理管理
- 🖥️ **平台增强** - 跨平台兼容性和优化

### 🔧 **技术改进**
- ⚡ **最新依赖** - Express 5.x、body-parser 2.x、node-fetch 3.x
- 🐛 **错误修复** - stringSizeLimit和其他关键修复
- 🧪 **跨平台测试** - Windows、macOS、Linux自动化测试
- 📦 **专业打包** - 自动化Chrome扩展和NPM包发布
- 🔄 **完整集成** - 所有功能分支合并到统一主分支
- 🎯 **生产就绪** - 综合测试和验证基础设施

## 🚀 安装方法

选择最适合您工作流程的安装方法：

### **方法1：临时下载和运行（推荐用于测试）**

始终获取最新版本，无需永久安装：

```bash
# 1. 启动WebAI服务器（在单独的终端中运行）
npx @cpjet64/webai-server@latest

# 2. MCP服务器将在配置后由您的IDE自动启动
# 在IDE中配置：npx @cpjet64/webai-mcp@latest
```

### **方法2：全局安装（推荐用于常规使用）**

安装一次，随时运行：

```bash
# 1. 全局安装
npm install -g @cpjet64/webai-mcp@latest
npm install -g @cpjet64/webai-server@latest

# 2. 使用简单命令随时运行
webai-server
# MCP服务器在IDE调用时自动运行
```

### **方法3：本地项目安装**

安装到当前项目目录：

```bash
# 1. 安装到当前项目
npm install @cpjet64/webai-mcp@latest
npm install @cpjet64/webai-server@latest

# 2. 使用npx运行
npx webai-server
# 在IDE中配置：npx @cpjet64/webai-mcp
```

### **方法4：从发布页面下载**

1. **Chrome扩展**：从[最新发布](https://github.com/cpjet64/webai-mcp/releases/latest)下载
2. **服务器**：使用上述任何NPM方法

### **📋 设置步骤**

1. **安装Chrome扩展**：
   - 从发布页面下载`.zip`文件
   - 解压并在Chrome → 扩展程序 → 开发者模式 → 加载已解压的扩展程序中加载

2. **配置您的IDE**：
   - 将`npx @cpjet64/webai-mcp@latest`添加到您的MCP客户端配置中
   - 不同的IDE有不同的配置 - 请查看您的IDE的MCP文档

3. **启动WebAI服务器**：
   - 打开新终端并运行：`npx @cpjet64/webai-server@latest`

4. **打开开发工具**：
   - 打开Chrome开发工具 → WebAI MCP面板
   - 确保连接已建立

### **💡 重要说明**

**需要两个服务器**：
- **`@cpjet64/webai-mcp`** → 用于您的IDE的MCP服务器
- **`@cpjet64/webai-server`** → 本地中间件服务器

**故障排除**：
- 如果遇到问题，请关闭所有Chrome窗口并重新启动
- 重新启动webai-server
- 确保只有一个开发工具面板打开

完成上述步骤后，打开Chrome的开发工具并进入WebAI MCP面板。

如果仍然存在问题，请尝试以下步骤：
- 关闭浏览器。不仅仅是当前窗口，而是整个Chrome。
- 重新启动本地Node服务器（webai-server）
- 确保您的浏览器中只有一个开发工具面板处于打开状态。

如果有任何问题或建议，欢迎随时提交issue！如果您有任何改进的想法，也可以提交带有enhancement标签的issue，或者通过[@tedx_ai on x](https://x.com/tedx_ai)与我联系。

---

## 🔑 关键新增功能

| 审计类型         | 描述                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **可访问性**     | 根据WCAG标准进行颜色对比度、缺失alt文本、键盘导航陷阱、ARIA属性等检查。                                                        |
| **性能**         | 通过Lighthouse分析渲染阻塞资源、过大的DOM结构、未优化的图片等影响页面速度的因素。                                           |
| **SEO**          | 评估页面的元数据、标题、链接结构等SEO相关因素，并提出改进建议以提高搜索可见性。                                             |
| **最佳实践**     | 检查网页开发中的一般最佳实践。                                                                                                    |
| **NextJS审计**   | 注入一个提示，用于对NextJS应用进行审计。                                                                                         |
| **Audit Mode**   | 按特定顺序运行所有审计工具。如果检测到NextJS框架，将运行对应的NextJS审计。                                                     |
| **Debugger Mode**| 按特定顺序运行所有调试工具。                                                                                                       |

---

## 🛠️ 使用审计工具

### ✅ **开始前的准备**

确保您已具备：
- 浏览器中的一个**活动标签页**
- **Chrome扩展程序已启用**

### ▶️ **运行审计**

**无头浏览器自动化**：
Puppeteer自动化无头Chrome实例，加载页面并收集审计数据，即使对于SPA或通过JavaScript加载的内容也能确保结果的准确性。

无头浏览器实例在最后一次审计调用后保持活动状态**60秒**，以便高效处理连续的审计请求。

**结构化结果**：
每个审计返回结构化的JSON格式结果，包含总体评分和详细的问题列表。这使得MCP客户端可以轻松解释发现并提供可行的见解。

MCP服务器提供了运行当前页面审计的工具。以下是触发它们的示例查询：

#### 可访问性审计 (`runAccessibilityAudit`)

确保页面符合可访问性标准，如WCAG。

> **示例查询：**
>
> - "此页面是否存在可访问性问题？"
> - "运行可访问性审计。"
> - "检查此页面是否符合WCAG标准。"

#### 性能审计 (`runPerformanceAudit`)

识别性能瓶颈和加载问题。

> **示例查询：**
>
> - "为什么这个页面加载这么慢？"
> - "检查此页面的性能。"
> - "运行性能审计。"

#### SEO审计 (`runSEOAudit`)

评估页面的搜索引擎优化情况。

> **示例查询：**
>
> - "如何改进此页面的SEO？"
> - "运行SEO审计。"
> - "检查此页面的SEO。"

#### 最佳实践审计 (`runBestPracticesAudit`)

检查网页开发中的一般最佳实践。

> **示例查询：**
>
> - "运行最佳实践审计。"
> - "检查此页面的最佳实践。"
> - "此页面是否存在最佳实践问题？"

#### Audit Mode (`runAuditMode`)

按特定顺序运行所有审计工具。如果检测到NextJS框架将运行对应的NextJS审计。

> **示例查询：**
>
> - "运行审计模式。"

#### NextJS审计 (`runNextJSAudit`)

检查NextJS应用的最佳实践和SEO改进。

> **示例查询：**
>
> - "运行NextJS审计。"
> - "运行NextJS审计，我使用的是app路由。"
> - "运行NextJS审计，我使用的是page路由。"

#### Debugger Mode (`runDebuggerMode`)

按特定顺序运行所有调试工具。

> **示例查询：**
>
> - "进入调试模式。"

## 架构

共有三个核心组件用于捕获和分析浏览器数据：

1. **Chrome扩展程序**：一个浏览器扩展程序，捕获截图、控制台日志、网络活动和DOM元素。
2. **Node服务器**：作为Chrome扩展程序和MCP服务器之间的中间件。
3. **MCP服务器**：实现了Model Context Protocol，为AI客户端提供标准化工具。

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  MCP客户端  │ ──► │  MCP服务器   │ ──► │ Node服务器    │ ──► │ Chrome扩展  │
│  (例如      │ ◄── │  (协议处理)  │ ◄── │ (中间件)       │ ◄── │ 程序         │
│   Cursor)   │     │               │     │               │     │             │
└─────────────┘     └───────────────┘     └───────────────┘     └─────────────┘
```

Model Context Protocol (MCP) 是Anthropic AI模型支持的一种能力，允许创建自定义工具供兼容的客户端使用。MCP客户端如Claude Desktop、Cursor、Cline或Zed可以运行MCP服务器，这些服务器为客户端"教授"新的工具。

这些工具可以调用外部API，但在本案例中，**所有日志都仅存储在本地**机器上，绝不会发送到任何第三方服务或API。BrowserTools MCP运行一个本地的NodeJS API服务器，与Chrome扩展程序通信。

所有BrowserTools MCP服务器的使用者都可以通过相同的NodeJS API和Chrome扩展程序进行交互。

#### Chrome扩展程序

- 监控XHR请求/响应和控制台日志
- 跟踪选择的DOM元素
- 将日志和当前元素发送到BrowserTools连接器
- 通过Websocket服务器连接以捕获/发送截图
- 允许用户配置分词/截断限制和截图文件夹路径

#### Node服务器

- 担任Chrome扩展程序和MCP服务器之间的中间件
- 从Chrome扩展程序接收日志和当前选择的元素
- 处理来自MCP服务器的请求以捕获日志、截图或当前元素
- 向Chrome扩展程序发送Websocket命令以捕获截图
- 智能截断字符串和重复对象的数量，以避免分词限制
- 移除Cookie和敏感头信息，避免在与MCP客户端通信时发送

#### MCP服务器

- 实现了Model Context Protocol
- 为AI客户端提供标准化工具
- 兼容各种MCP客户端（Cursor、Cline、Zed、Claude Desktop等）

## 安装

安装步骤可在文档中找到：

- [BrowserTools MCP文档](https://browsertools.agentdesk.ai/)

## 使用

安装并配置后，该系统允许任何兼容的MCP客户端：

- 监控浏览器控制台输出
- 捕获网络流量
- 截取屏幕截图
- 分析所选元素
- 清除MCP服务器中存储的日志
- 运行可访问性、性能、SEO和最佳实践审计

## 兼容性

- 与任何兼容的MCP客户端协同工作
- 主要为Cursor IDE集成设计
- 支持其他AI编辑器和MCP客户端
