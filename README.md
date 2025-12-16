# VocabMeld - 商业级沉浸式语言学习插件

<p align="center">
  <img src="public/icons/icon.svg" width="128" height="128" alt="VocabMeld Logo">
</p>

<p align="center">
  <strong>智能替换网页词汇，创造沉浸式双语学习环境</strong><br>
  <sub>基于可理解性输入理论 • 支持多AI配置 • SRS间隔复习 • 数据可视化</sub>
</p>

---

## ✨ 商业级功能特性

### 🚀 核心功能

- **智能词汇替换** - AI驱动的上下文感知翻译
- **多API配置** - 支持添加多个AI服务，智能切换和自动容错
- **间隔重复学习** - SM-2算法，科学复习，长期记忆
- **学习可视化** - Dashboard统计面板，追踪学习进度
- **数据管理** - 完整的导入/导出功能
- **深色模式** - 全局主题系统，保护视力

### 🎯 产品亮点

✅ **多AI Provider支持** - OpenAI、DeepSeek、Moonshot、Groq、Ollama
✅ **智能Fallback** - 主API失败自动切换备用
✅ **CEFR难度体系** - 6级难度精确控制（A1-C2）
✅ **2000词热缓存** - LRU算法，毫秒级响应
✅ **IndexedDB词库** - 高性能本地存储
✅ **现代化UI** - Material Design风格，响应式布局

---

## 🎨 界面预览

### Dashboard - 学习统计
- 实时学习数据可视化
- Chart.js趋势图
- 缓存命中率分析

### 复习模式 - SRS间隔复习
- Anki风格闪卡界面
- 快捷键操作
- 智能间隔算法

### API管理 - 多配置系统
- 卡片式配置管理
- 一键测试连接
- 拖拽排序优先级

---

## 📦 快速开始

### Chrome / Edge 安装

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/VocabMeld.git
cd VocabMeld

# 2. 安装依赖
npm install

# 3. 构建扩展
npm run build

# 4. 加载到浏览器
# Chrome: chrome://extensions/
# Edge: edge://extensions/
# 开启开发者模式 → 加载 dist/ 目录
```

### 配置API

1. 点击扩展图标打开设置
2. 滚动到"API配置管理"
3. 点击"添加API配置"
4. 填写：
   - 配置名称（如"DeepSeek主用"）
   - 选择Provider
   - 输入API Key
5. 点击"测试连接"验证
6. 保存并使用

---

## 🎓 功能使用指南

### 多API配置管理

**添加配置**：
- 支持添加多个API配置
- 每个配置独立的Key、Endpoint、Model
- 支持启用/禁用

**智能切换**：
- 手动模式：选择使用哪个配置
- Fallback模式：失败自动切换备用

### 学习Dashboard

**访问方式**：
```
打开 chrome-extension://[your-id]/dashboard.html
或在浏览器中直接打开 dist/dashboard.html
```

**功能**：
- 学习统计卡片
- 7天学习趋势图
- 缓存命中率分析
- 深色模式支持

### SRS复习系统

**访问方式**：
```
打开 chrome-extension://[your-id]/review.html
```

**使用**：
1. 系统自动生成复习队列
2. 点击卡片翻转查看答案
3. 根据掌握程度点击：困难/一般/简单
4. SM-2算法自动计算下次复习时间

**快捷键**：
- `空格` - 翻转卡片
- `1` - 困难
- `2` - 一般
- `3` - 简单

### 导入/导出

**访问方式**：
```
打开 chrome-extension://[your-id]/import-export.html
```

**支持格式**：
- JSON（推荐）- 包含完整SRS数据
- CSV - 简单词汇列表

**导出选项**：
- 已学会词汇
- 需记忆词汇
- 缓存词汇

---

## 🛠️ 技术架构

### 现代化技术栈

- **Manifest V3** - 最新扩展标准
- **ES6+ Modules** - 模块化架构
- **Vite** - 现代构建工具
- **IndexedDB** - 高性能本地数据库
- **Chart.js** - 数据可视化

### 模块化设计

```
src/
├── js/
│   ├── core/           # 核心模块
│   │   ├── config.js   # 配置
│   │   ├── storage.js  # 存储抽象
│   │   └── idb.js      # IndexedDB封装
│   ├── services/       # 业务服务
│   │   ├── llm-router.js        # API路由
│   │   ├── srs-service.js       # 复习算法
│   │   ├── import-export.js     # 数据IO
│   │   └── ... (更多服务)
│   └── types/          # 类型定义
├── css/
│   └── commercial.css  # 商业化UI样式
└── pages/              # 功能页面
    ├── dashboard.html
    ├── review.html
    └── import-export.html
```

### 安全性设计

- ✅ API Key仅存本地，不跨设备同步
- ✅ Background统一代理，Content不持有密钥
- ✅ 无innerHTML注入，使用DOM API
- ✅ CSP兼容，无eval调用

---

## 📊 性能优化

- **2000词LRU缓存** - 毫秒级响应
- **请求去重** - 避免重复API调用
- **并发控制** - 智能限流
- **IndexedDB索引** - 快速查询
- **懒加载** - 视口优先处理

---

## 🔧 开发指南

### 本地开发

```bash
# 开发模式（UI调试）
npm run dev

# 构建扩展
npm run build

# 构建流程
1. build:ui - 构建UI和Background（ESM）
2. build:content - 构建Content Script（IIFE）
3. postbuild - 自动修复HTML路径
```

### 代码规范

- ES6+ Modules
- JSDoc注释
- 函数式组件
- 单一职责原则

---

## 📖 使用技巧

1. **推荐配置**：中文+英语+B1难度+适中强度
2. **多API备用**：添加2-3个API配置，开启Fallback模式
3. **每日复习**：打开Review页面，完成SRS复习任务
4. **数据备份**：定期导出词汇数据
5. **深色模式**：晚间使用更舒适

---

## 🌟 支持的AI服务

| Provider | 推荐模型 | 特点 |
|---------|---------|------|
| **DeepSeek** | deepseek-chat | 性价比高，推荐 |
| **OpenAI** | gpt-4o-mini | 质量优秀 |
| **Moonshot** | moonshot-v1-8k | 国内服务 |
| **Groq** | llama-3.1-8b | 速度快 |
| **Ollama** | qwen2.5:7b | 本地离线 |

---

## 📄 开源协议

MIT License

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

**开发前**：
1. Fork项目
2. 运行 `npm install`
3. 运行 `npm run build` 测试
4. 提交前确保构建通过

---

## 📮 联系方式

- **Issues**: [GitHub Issues](https://github.com/yourusername/VocabMeld/issues)
- **讨论**: [GitHub Discussions](https://github.com/yourusername/VocabMeld/discussions)

---

<p align="center">
  <sub>Built with ❤️ for language learners worldwide</sub>
</p>
