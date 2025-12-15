# 🧪 VocabMeld 架构重构 - Chrome测试指南

## 📋 测试准备

**扩展位置**: `/Users/xmdbd/项目/VocabMeld/dist/`
**构建版本**: Phase 2 - 模块化重构版
**Git备份**: 旧版本保存在 `src/js/content.original.js`

---

## 🚀 加载步骤

### 1. 打开Chrome扩展页面
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角"开发者模式"开关

### 2. 移除旧版本（如果已安装）
1. 找到 VocabMeld 扩展
2. 点击"移除"按钮
3. 确认移除

### 3. 加载新版本
1. 点击"加载已解压的扩展程序"
2. 选择目录：`/Users/xmdbd/项目/VocabMeld/dist/`
3. 点击"选择"

### 4. 验证基础加载
- [ ] ✅ 扩展成功加载，卡片上无红色错误
- [ ] ✅ 扩展图标出现在工具栏
- [ ] ✅ 点击"Service Worker"链接，查看background console

**预期输出**：
```
[VocabMeld] Extension installed/updated
```

**如果看到错误**：记录错误信息，停止测试，报告给开发团队

---

## 🧪 核心功能测试（按优先级）

### Test 1: Popup基础功能（5分钟）

**操作步骤**：
1. 点击工具栏的VocabMeld图标
2. 观察popup窗口

**验证点**：
- [ ] ✅ Popup正常打开，无白屏
- [ ] ✅ 统计数据显示（初始值都是0）
- [ ] ✅ 开关状态显示"已启用"或"已禁用"
- [ ] ✅ F12查看Console，无404错误（特别是chunks/storage-*.js）

**Console预期**：无红色错误

---

### Test 2: Options基础功能（5分钟）

**操作步骤**：
1. 右键工具栏图标 → 选择"选项"
2. 或在popup中点击"设置"按钮

**验证点**：
- [ ] ✅ Options页面正常打开
- [ ] ✅ 所有标签页可正常切换（API配置/学习偏好/行为设置/站点规则/词汇管理/统计）
- [ ] ✅ 配置项正确显示默认值
- [ ] ✅ F12查看Console，无404或模块加载错误

**如果看到错误**：检查是否是相对路径问题（./assets/, ./js/）

---

### Test 3: Content Script基础加载（5分钟）

**操作步骤**：
1. 打开一个普通网页（如 `https://example.com`）
2. F12打开开发者工具
3. 查看Console标签

**验证点**：
- [ ] ✅ 看到 `[VocabMeld] Config loaded: ...`
- [ ] ✅ 看到 `[VocabMeld] Processing service initialized`
- [ ] ✅ 看到 `[VocabMeld] Event listeners registered`
- [ ] ✅ 看到 `[VocabMeld] Content script initialized successfully`
- [ ] ✅ 无红色错误（语法错误、模块加载失败）

**如果看到错误**：content.js可能有import问题或模块打包问题

---

### Test 4: Codex重点测试 - disabled→enabled（10分钟）

这是codex特别提醒的critical测试点！

**操作步骤**：
1. 在options中确保扩展是**禁用**状态（enabled=false）
2. 打开一个测试网页（保持打开）
3. 在options中**启用**扩展（enabled=true）
4. 回到测试网页，**不要刷新**
5. 点击popup中的"处理当前页面"按钮

**验证点**：
- [ ] ✅ 页面能够正常处理（词汇被替换）
- [ ] ✅ Console无错误

**如果失败**：说明监听器注册逻辑有问题

---

###  Test 5: 配置保存与加载（5分钟）

**操作步骤**：
1. 在options中填写API配置：
   - API Endpoint: `https://api.deepseek.com/chat/completions`
   - API Key: （你的真实key或测试key）
   - Model: `deepseek-chat`
2. 修改难度等级（如选择B2）
3. 关闭options页面
4. 重新打开options页面

**验证点**：
- [ ] ✅ API Key正确显示（masked）
- [ ] ✅ 其他配置正确保存
- [ ] ✅ Console无错误

---

### Test 6: API测试连接（可选，如有真实API Key）

**操作步骤**：
1. 在options的API配置section
2. 点击"测试连接"按钮

**验证点**：
- [ ] ✅ 显示"✓ 连接成功"或错误信息
- [ ] ✅ Console无critical错误

---

## 🎯 高级功能测试（如有API Key）

### Test 7: 页面处理功能（15分钟）

**操作步骤**：
1. 确保API已配置
2. 打开一个包含英文或中文的网页
3. 点击popup中的"处理当前页面"

**验证点**：
- [ ] ✅ 按钮显示"处理中..."状态
- [ ] ✅ 页面上部分词汇被替换（紫色虚线下划线）
- [ ] ✅ 替换格式正确（默认：译文(原文)）
- [ ] ✅ 1秒后按钮恢复，统计数据更新

### Test 8: Tooltip交互（5分钟）

**操作步骤**：
1. 鼠标悬停在替换的词汇上

**验证点**：
- [ ] ✅ Tooltip正常显示
- [ ] ✅ 包含：翻译、难度徽章、音标、提示文字
- [ ] ✅ 鼠标移出时tooltip消失

### Test 9: 发音功能（5分钟）

**操作步骤**：
1. 左键点击替换的词汇

**验证点**：
- [ ] ✅ 触发TTS播报（听到声音）
- [ ] ✅ Console无错误

**Codex重点**：验证发音的是translation（目标语言）还是original

### Test 10: 标记已学会（5分钟）

**操作步骤**：
1. 右键点击替换的词汇

**验证点**：
- [ ] ✅ 词汇立即恢复为原文
- [ ] ✅ 显示toast "已标记为已学会"
- [ ] ✅ 在options→已学会词汇中可以看到
- [ ] ✅ 刷新页面后，该词汇不再被替换

### Test 11: 添加到需记忆（10分钟）

**操作步骤**：
1. 在页面上选中（双击或划选）一个未翻译的词汇
2. 观察selection popup出现
3. 点击"添加到需记忆"按钮

**验证点**：
- [ ] ✅ Selection popup正常显示
- [ ] ✅ 点击后popup消失
- [ ] ✅ 显示toast "已添加到记忆列表"
- [ ] ✅ 该词汇立即被翻译并替换（如果页面上有）
- [ ] ✅ 在options→需记忆词汇中可以看到

**Codex重点**：memorizeList变更应触发processSpecificWords

### Test 12: 配置变更触发reprocess（Codex重点）

**操作步骤**：
1. 处理一个页面（有替换词汇）
2. 在options中修改"翻译显示样式"（如从"译文(原文)"改为"仅译文"）
3. 回到页面观察

**验证点**：
- [ ] ✅ 页面自动恢复并重新处理
- [ ] ✅ 新的显示样式生效
- [ ] ✅ Console无错误

**Codex重点**：也要测试apiKey变更是否触发reprocess

---

## 📊 回归测试报告模板

```markdown
## VocabMeld 重构版测试报告

**测试日期**: [填写]
**测试人**: [填写]
**Chrome版本**: [填写]
**macOS版本**: [填写]

### 构建信息
- content.js: 32.6KB, 362行源码
- 代码减少: 76% (1142行删除)

### 测试结果

#### Critical Tests（必须通过）
- [ ] Test 1: Popup基础功能
- [ ] Test 2: Options基础功能
- [ ] Test 3: Content Script基础加载
- [ ] Test 4: disabled→enabled测试

#### Important Tests（强烈建议）
- [ ] Test 5: 配置保存与加载
- [ ] Test 7: 页面处理功能
- [ ] Test 10: 标记已学会
- [ ] Test 11: 添加到需记忆
- [ ] Test 12: 配置变更reprocess

#### Optional Tests
- [ ] Test 6: API测试连接
- [ ] Test 8: Tooltip交互
- [ ] Test 9: 发音功能

### 发现的问题
[列出所有问题]

### 总体评价
[Pass / Needs Fix / Blocked]
```

---

## 🆘 故障排查

### 如果Popup/Options白屏
1. 检查Console是否有模块加载404
2. 检查HTML中的路径是否正确（./js/, ./assets/）
3. 检查dist/js/chunks/是否存在且可访问

### 如果Content Script无输出
1. 检查manifest.json中content_scripts路径
2. 检查dist/js/content.js是否存在
3. 检查是否是IIFE格式（无import/export）

### 如果功能不工作
1. 检查Console错误信息
2. 检查API配置是否正确
3. 检查enabled状态

---

## ✅ 测试完成后

请回复测试结果！如果全部通过，架构重构就大功告成了！ 🎉

如果有问题，我会与gemini和codex一起快速修复。
