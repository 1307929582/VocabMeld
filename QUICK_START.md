# 🚀 VocabMeld 商业级功能 - 快速开始指南

## 立即开始测试！

### 第1步：加载扩展

```bash
# 如果已经加载过，直接刷新
1. 打开 chrome://extensions/
2. 找到 VocabMeld
3. 点击"刷新"按钮 🔄

# 如果是第一次
1. 打开 chrome://extensions/
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择：/Users/xmdbd/项目/VocabMeld/dist/
```

---

## 🎯 新功能快速体验

### 方式1：通过Popup（最简单）⭐

1. **点击扩展图标**
2. 你会看到3个新的快捷入口按钮：
   - 📊 **Dashboard** - 学习统计
   - 📚 **复习模式** - SRS复习
   - 📦 **数据管理** - 导入导出
3. 点击任意按钮即可打开对应功能！

### 方式2：通过Options

1. 点击Popup中的"设置"按钮
2. 滚动到页面底部
3. 找到"**API配置管理**"section
4. 点击"**+ 添加API配置**"

---

## ✨ 核心新功能测试

### 1️⃣ 多API配置（最重要！）

**为什么重要**：支持多个AI服务，一个挂了自动切换另一个！

**测试步骤**：
1. 打开Options（点击Popup的"设置"）
2. 滚动到底部"API配置管理"
3. 点击"+ 添加API配置"
4. 填写：
   ```
   配置名称: DeepSeek主用
   Provider: 选择 DeepSeek
   API Key: 你的DeepSeek key
   ```
5. 点击"保存"
6. 看到卡片出现！

**再添加一个备用**：
1. 再次点击"+ 添加API配置"
2. 填写OpenAI或其他Provider
3. 现在你有2个API配置了！

**切换使用**：
- 点击任意卡片的"使用此配置"按钮
- 该卡片会显示"当前使用"标签

---

### 2️⃣ Dashboard统计面板

**打开方式**：
- 点击Popup的"📊 Dashboard"按钮
- 或在浏览器直接打开：`file:///Users/xmdbd/项目/VocabMeld/dist/dashboard.html`

**你会看到**：
- ✅ 4个统计卡片（已学会、需记忆、今日新词、缓存命中率）
- ✅ 学习趋势折线图
- ✅ 右上角深色模式切换按钮

**测试深色模式**：
1. 点击右上角"🌙 深色模式"
2. 页面变暗，眼睛更舒适
3. 刷新页面，主题保持

---

### 3️⃣ SRS复习模式（Anki风格）

**打开方式**：
- 点击Popup的"📚 复习模式"按钮

**你会看到**：
- ✅ 大号单词卡片
- ✅ 点击卡片翻转查看翻译
- ✅ 3个评分按钮：困难/一般/简单
- ✅ 顶部进度条

**快捷键**：
- `空格` = 翻转卡片
- `1` = 困难
- `2` = 一般
- `3` = 简单

---

### 4️⃣ 数据导入导出

**打开方式**：
- 点击Popup的"📦 数据管理"按钮

**导出数据**：
1. 勾选要导出的内容（已学会/需记忆/缓存）
2. 点击"导出为JSON"
3. 文件自动下载

**导入数据**：
1. 点击"选择文件"
2. 选择之前导出的JSON
3. 预览后点击"确认导入"

---

## 🎮 所有页面访问方式总结

| 功能 | 通过Popup | 直接打开文件 |
|------|----------|-------------|
| Dashboard | 点击"📊 Dashboard" | `dist/dashboard.html` |
| 复习模式 | 点击"📚 复习模式" | `dist/review.html` |
| 数据管理 | 点击"📦 数据管理" | `dist/import-export.html` |
| 设置 | 点击"设置"按钮 | `dist/options.html` |

---

## 🔧 如果某功能不工作

### Console调试方法

**在Options页面按F12，然后Console中输入**：

```javascript
// 测试API Profile系统
const profiles = await storage.getApiProfiles();
console.log('当前所有API配置:', profiles);

// 手动添加一个测试配置
await storage.upsertApiProfile({
  id: 'test-' + Date.now(),
  name: 'Console测试',
  provider: 'deepseek',
  endpoint: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  apiKeyRef: 'test-key-' + Date.now(),
  enabled: true,
  priority: 50
});

// 刷新页面查看效果
location.reload();
```

---

## ✅ 测试成功标准

完成以下操作即代表成功：

- [ ] ✅ 在Popup看到3个快捷入口按钮
- [ ] ✅ 点击按钮能打开对应页面
- [ ] ✅ 能添加至少1个API配置
- [ ] ✅ Dashboard显示统计数据
- [ ] ✅ 深色模式能切换
- [ ] ✅ 复习模式卡片能翻转
- [ ] ✅ 能导出JSON数据

---

## 🎊 完整功能列表

### 已实现的商业级功能

**基础功能**：
- ✅ 智能词汇替换
- ✅ CEFR难度控制（6级）
- ✅ 替换强度控制
- ✅ 2000词LRU缓存
- ✅ 已学会词汇管理
- ✅ 需记忆词汇列表

**商业级新功能**：
- ✅ 多API配置管理（无限个API）
- ✅ 智能路由和自动Fallback
- ✅ Profile健康状态追踪
- ✅ 学习Dashboard可视化
- ✅ Chart.js趋势图
- ✅ SRS间隔复习系统（SM-2算法）
- ✅ Anki风格复习界面
- ✅ 数据导入导出（JSON/CSV）
- ✅ 深色模式（全局）
- ✅ IndexedDB高性能词库
- ✅ Popup快捷入口
- ✅ Material Design UI

---

## 🚀 开始使用

**第一次使用**：
1. 刷新扩展
2. 点击扩展图标
3. 点击"设置"
4. 添加你的第一个API配置
5. 点击Popup的快捷入口探索新功能！

**有问题？**
- 参考 `TESTING_GUIDE.md` 详细测试步骤
- 使用Console调试方法
- 随时反馈问题，我会立即修复！

---

**所有商业级功能已完成！现在开始体验吧！** 🎉
