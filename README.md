# VocabMeld - 沉浸式语言学习 Chrome 插件

<p align="center">
  <img src="public/icons/icon.svg" width="128" height="128" alt="VocabMeld Logo">
</p>

<p align="center">
  <strong>智能替换网页词汇，创造沉浸式双语学习环境，在日常浏览中自然习得语言。</strong><br>
  <sub>基于「可理解性输入」理论，让语言学习融入日常生活</sub>
</p>

<p align="center">
  <img src="preview.png" alt="VocabMeld Preview" width="100%">
</p>

---

## 核心设计理念

VocabMeld 基于语言学家 Stephen Krashen 的「**可理解性输入 (Comprehensible Input)**」理论设计：

> 语言习得发生在我们理解比当前水平稍高一点的输入时 (i+1)

**核心逻辑**：在用户浏览母语内容时，将部分词汇智能替换为学习语言，反之亦然。这种方式：
- 保持内容可理解性（大部分词汇保持原文）
- 在上下文中接触新词汇（自然语境记忆）
- 控制语言接触压力（细水长流，避免认知负荷）

---

## 安装方法

### Chrome / Edge 浏览器

#### 方式1：开发者模式加载（推荐）

1. 下载本项目代码
2. 打开浏览器扩展页面
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 文件夹

#### 方式2：从源码构建

```bash
# 安装依赖
npm install

# 构建扩展
npm run build

# 加载 dist 目录到浏览器
```

### 配置 API

1. 点击扩展图标，进入设置页面
2. 选择预设服务（推荐 DeepSeek）或自定义配置
3. 填入 API 密钥
4. 点击"测试连接"确认配置正确

---

## 完整功能清单

### 1. AI 智能翻译引擎

#### 1.1 LLM 集成
- **OpenAI 兼容 API**：支持任何 OpenAI 格式的 API（OpenAI、DeepSeek、Moonshot、Groq、Ollama 等）
- **自定义配置**：用户可配置 API 端点、密钥、模型名称
- **连接测试**：提供一键测试 API 连通性功能

#### 1.2 智能词汇选择
LLM 根据以下规则选择替换词汇：
- **避免替换**：专有名词、数字、代码、URL、小于5字符的英文单词
- **优先选择**：常用词汇、有学习价值的词汇
- **难度评估**：为每个词汇标注 CEFR 等级（A1-C2）
- **动态数量**：根据用户设置的单词量（低/中/高）动态调整翻译数量

#### 1.3 双向翻译
- **母语页面**：将母语词汇替换为学习语言（如 中文 → English）
- **学习语言页面**：将学习语言词汇替换为母语（如 English → 中文）
- **自动检测**：根据页面主要语言自动决定翻译方向

### 2. CEFR 六级难度系统

| 等级 | 描述 | 词汇特征 |
|------|------|----------|
| A1 | 入门级 | 最基础的日常词汇，如 hello, thank you |
| A2 | 初级 | 简单日常交流词汇，如 weather, family |
| B1 | 中级 | 一般性话题词汇，如 opinion, experience |
| B2 | 中高级 | 抽象概念词汇，如 consequence, implement |
| C1 | 高级 | 专业/学术词汇，如 ubiquitous, paradigm |
| C2 | 精通级 | 罕见/文学词汇，如 ephemeral, quintessential |

**难度过滤逻辑**：用户选择 B2 时，系统显示 B2、C1、C2 难度的词汇（即该等级及以上），避免过于简单的词汇干扰。

### 3. 替换强度控制

三档强度设置：

| 强度 | 每段最大替换数 | 使用场景 |
|------|---------------|----------|
| 较少 | 4 词 | 轻度学习，保持阅读流畅 |
| 适中 | 8 词 | 日常学习，平衡阅读与学习 |
| 较多 | 14 词 | 强化学习，最大化词汇接触 |

### 4. 热词缓存系统

#### 4.1 缓存机制
- **容量**：最多 2000 个词汇
- **存储格式**：`原文:源语言:目标语言` 作为键
- **持久化**：使用浏览器本地存储，跨会话保留
- **LRU 淘汰**：达到上限时淘汰最早加入的词汇

#### 4.2 缓存命中逻辑
1. 发送 API 请求前，检查文本中是否有已缓存词汇
2. 已缓存词汇直接使用缓存结果，不发送给 API
3. 只将未缓存的词汇发送给 LLM 处理
4. 新词汇处理完成后加入缓存

#### 4.3 优化后的翻译流程
- **先展示缓存**：缓存结果立即显示，无需等待 API
- **异步处理**：未缓存词汇后台异步处理，不阻塞页面
- **避免重复**：已替换的词汇不会被重复替换
- **智能限制**：如果缓存已满足配置，异步替换最多1个词

### 5. 已学会词汇（白名单）

#### 5.1 功能说明
用户可将已掌握的词汇加入白名单，这些词汇：
- **不再被替换**：浏览时保持原文显示
- **不发送给 API**：从请求文本中预先移除
- **持久存储**：跨设备同步
- **难度记录**：保存词汇的难度信息，便于管理

#### 5.2 添加方式
- **页面交互**：右键点击已翻译的词汇，直接标记为"已学会"
- **自动恢复**：标记后词汇立即恢复为原文显示

#### 5.3 已学会词汇管理
- **搜索功能**：支持按单词或翻译搜索
- **难度筛选**：按 CEFR 等级（A1-C2）筛选
- **难度显示**：每个单词显示难度标签
- **删除功能**：支持单个删除已学会的词汇

### 6. 需记忆词汇列表

#### 6.1 功能说明
用户可将页面上未翻译的生词加入"需记忆"列表，便于后续复习。

#### 6.2 添加方式
- **划选/双击**：选中页面上的未翻译词汇
- **弹出提示**：显示"添加到需记忆"按钮
- **点击添加**：词汇被存入记忆列表
- **自动翻译**：添加到记忆列表后，立即触发翻译并更新页面

#### 6.3 记忆列表管理
- **搜索功能**：支持按单词或翻译搜索
- **难度筛选**：按 CEFR 等级（A1-C2）筛选
- **难度显示**：每个单词显示难度标签
- **清空功能**：一键清空记忆列表

### 7. 用户交互

#### 7.1 替换词汇样式
支持三种显示样式（可在设置中选择）：

| 样式 | 显示格式 | 说明 |
|------|---------|------|
| **译文(原文)** | `translated(original)` | 默认样式，翻译词以紫色显示，带虚线下划线 |
| **仅译文** | `translated` | 只显示译文，悬停查看原文 |
| **原文(译文)** | `original(translated)` | 原文在前，译文在后 |

所有样式都支持：
- 翻译词以紫色显示，带虚线下划线
- 原文以灰色显示（在括号中或通过悬停查看）

#### 7.2 悬停提示框
鼠标悬停在替换词汇上时显示：
- 音标（永远展示学习语言的发音）
- 难度等级徽章（如 B2）
- 提示文字："左键点击发音 · 右键标记已学会"

#### 7.3 点击交互
- **左键点击**：播放发音
- **右键点击**：标记为已学会

### 8. 快捷键支持

- `Alt+T`：快速处理当前页面
- 在任何网页上都可以使用，无需打开扩展

### 9. 学习统计

| 指标 | 说明 | 统计规则 |
|------|------|----------|
| 累计接触 | 总共接触的新词汇数 | 只计算未命中缓存的词汇 |
| 今日接触 | 当天接触的新词汇数 | 每日 0 点重置 |
| 已学会 | 白名单中的词汇数 | 用户手动标记 |
| 需记忆 | 需记忆列表中的词汇数 | 用户手动添加 |
| 已缓存 | 热词缓存中的词汇数 | 自动管理 |
| 命中率 | 缓存命中百分比 | hits / (hits + misses) |

---

## 支持的 API 服务

| 服务商 | 端点 | 推荐模型 |
|--------|------|----------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | gpt-4o-mini |
| DeepSeek | `https://api.deepseek.com/chat/completions` | deepseek-chat |
| Moonshot | `https://api.moonshot.cn/v1/chat/completions` | moonshot-v1-8k |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | llama-3.1-8b-instant |
| Ollama | `http://localhost:11434/v1/chat/completions` | qwen2.5:7b |

---

## 项目结构

```
VocabMeld/
├── dist/                   # 构建产物（可直接加载到浏览器）
│   ├── manifest.json
│   ├── popup.html
│   ├── options.html
│   ├── js/
│   │   ├── content.js      # Content Script（IIFE单文件）
│   │   ├── background.js   # Service Worker
│   │   ├── popup.js
│   │   ├── options.js
│   │   └── chunks/         # 共享模块
│   ├── css/
│   ├── icons/
│   └── _locales/
├── src/                    # 源代码（模块化）
│   ├── js/
│   │   ├── core/           # 核心模块
│   │   │   ├── config.js   # 配置管理
│   │   │   └── storage.js  # 存储服务
│   │   └── services/       # 服务模块
│   │       ├── api-service.js          # API 服务
│   │       ├── cache-service.js        # 缓存服务
│   │       ├── content-segmenter.js    # 内容分段
│   │       ├── processing-service.js   # 处理服务
│   │       ├── text-replacer.js        # 文本替换
│   │       ├── ui-overlay.js           # UI 浮层
│   │       └── background-bridge.js    # Background 通信
│   ├── css/
│   ├── popup.html
│   └── options.html
├── public/                 # 静态资源
│   ├── manifest.json
│   ├── icons/
│   ├── css/
│   └── _locales/
├── scripts/
│   └── post-build.js       # 构建后处理脚本
├── vite.config.ui.js       # Vite UI 构建配置
├── vite.config.content.js  # Vite Content 构建配置
└── package.json
```

---

## 开发说明

### 技术栈
- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6+ 模块化)
- Vite 构建系统
- CSS Variables + Modern CSS

### 本地开发

#### 安装依赖
```bash
npm install
```

#### 开发模式（UI调试）
```bash
npm run dev
```
- 启动Vite开发服务器，可以在浏览器中快速调试UI

#### 构建扩展
```bash
npm run build
```
- 构建流程：
  1. `build:ui` - 构建UI和Background（ESM，允许代码分割）
  2. `build:content` - 构建Content Script（IIFE单文件）
  3. `postbuild` - 自动修复HTML路径

#### 加载到浏览器
1. 构建完成后，在浏览器扩展页面加载 `dist/` 目录
2. 每次修改代码后，运行 `npm run build` 并刷新扩展

### 架构设计

本项目采用**模块化架构**，具有以下特点：

#### 核心优势
- **零代码重复**：所有逻辑只实现一次
- **高度模块化**：职责清晰，易于维护和测试
- **安全性增强**：避免XSS注入，API密钥安全存储
- **现代化工具链**：使用Vite实现快速构建

#### 模块分层
1. **core/** - 核心基础设施
   - `config.js` - 配置常量和工具函数
   - `storage.js` - Chrome Storage 抽象层

2. **services/** - 业务逻辑服务
   - `api-service.js` - LLM API 调用
   - `cache-service.js` - LRU 缓存管理
   - `content-segmenter.js` - 页面内容分段
   - `processing-service.js` - 处理流程编排
   - `text-replacer.js` - DOM 文本替换
   - `ui-overlay.js` - UI 浮层管理
   - `background-bridge.js` - Background 通信

3. **content.js** - 轻量入口
   - 仅负责初始化和事件绑定
   - 编排各个service模块
   - 约360行代码（相比旧版1502行）

#### 构建系统
使用Vite双配置策略：
- **UI Build** (`vite.config.ui.js`)
  - 构建 popup/options 页面和 background script
  - 输出 ES Module 格式
  - 支持代码分割（chunks）

- **Content Build** (`vite.config.content.js`)
  - 构建 content script
  - 输出 IIFE 单文件格式
  - 满足 Chrome Extension CSP 要求

---

## 使用技巧

1. **推荐配置**：母语中文 + 学习英语 + B1难度 + 适中强度
2. **快捷键**：`Alt+T` 快速处理当前页面
3. **右键标记**：遇到已掌握的词汇，右键标记为已学会，下次不再替换
4. **选中添加**：遇到想记住的生词，选中后点击"添加到需记忆"
5. **缓存加速**：第二次访问同一页面，响应速度显著提升（毫秒级）
6. **智能过滤**：自动跳过停用词和已缓存词汇，节省 API 调用

---

## 参考项目

本项目从以下优秀项目中汲取灵感：
- **Ries** - 综合效果优秀，单词难度划分合理
- **illa-helper** - 开源沉浸式翻译插件
- **qiayi** - 较早的沉浸式局部翻译插件

在这些项目基础上，VocabMeld 实现了以下改进：
1. **多 LLM 支持**：支持 OpenAI、DeepSeek、Moonshot 等主流 AI 服务
2. **智能缓存策略**：2000词 LRU 缓存，显著提升响应速度
3. **精确难度控制**：基于 CEFR 标准的六级难度体系
4. **现代化架构**：模块化设计，持续维护

---

## 开源协议

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！

开发前请先阅读：
1. 运行 `npm install` 安装依赖
2. 运行 `npm run build` 构建项目
3. 在浏览器中加载 `dist/` 目录测试
4. 提交前确保构建通过
