/**
 * VocabMeld Background Service Worker
 * 处理API请求、消息路由和数据同步
 */

import { storage } from './core/storage.js';
import { llmRouter } from './services/llm-router.js';

// 监听扩展安装/更新
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[VocabMeld] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // 首次安装：初始化默认配置
    await initializeDefaultConfig();
  } else if (details.reason === 'update') {
    // 更新：执行数据迁移
    await migrateToV2();
  }

  // 创建右键菜单
  createContextMenus();
});

/**
 * 初始化默认配置
 */
async function initializeDefaultConfig() {
  // 创建默认API Profile
  const defaultProfile = {
    id: generateUUID(),
    name: 'DeepSeek Default',
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKeyRef: generateUUID(),
    enabled: true,
    priority: 10
  };

  await storage.setApiProfiles([defaultProfile]);
  await storage.setApiRouting({
    mode: 'manual',
    selectedProfileId: defaultProfile.id,
    fallbackOrder: [defaultProfile.id]
  });

  // 初始化其他默认配置
  await storage.set({
    nativeLanguage: 'zh-CN',
    targetLanguage: 'en',
    difficultyLevel: 'B1',
    intensity: 'medium',
    autoProcess: false,
    showPhonetic: true,
    translationStyle: 'translation-original',
    enabled: true,
    blacklist: [],
    whitelist: [],
    totalWords: 0,
    todayWords: 0,
    lastResetDate: new Date().toISOString().split('T')[0],
    cacheHits: 0,
    cacheMisses: 0,
    learnedWords: [],
    memorizeList: []
  });

  console.log('[VocabMeld] Default configuration initialized');
}

/**
 * 数据迁移：从V1（单API）到V2（多API Profiles）
 */
async function migrateToV2() {
  const [config, localData] = await Promise.all([
    storage.get(null),
    storage.getLocal(['apiKey', 'schemaVersion'])
  ]);

  // 检查是否已迁移
  if (localData.schemaVersion === 2) {
    console.log('[VocabMeld] Already migrated to V2');
    return;
  }

  // 检查是否有旧配置
  const hasLegacyConfig = config.apiEndpoint || config.modelName || localData.apiKey;
  const hasNewConfig = config.apiProfiles && config.apiProfiles.length > 0;

  if (!hasLegacyConfig || hasNewConfig) {
    await storage.setLocal({ schemaVersion: 2 });
    return;
  }

  console.log('[VocabMeld] Migrating to V2 schema...');

  // 创建Legacy Profile
  const legacyProfile = {
    id: generateUUID(),
    name: 'Migrated Config',
    provider: inferProvider(config.apiEndpoint || ''),
    endpoint: config.apiEndpoint || 'https://api.deepseek.com/chat/completions',
    model: config.modelName || 'deepseek-chat',
    apiKeyRef: generateUUID(),
    enabled: true,
    priority: 10
  };

  // 保存profile
  await storage.setApiProfiles([legacyProfile]);

  // 保存routing
  await storage.setApiRouting({
    mode: 'manual',
    selectedProfileId: legacyProfile.id,
    fallbackOrder: [legacyProfile.id]
  });

  // 迁移API Key
  if (localData.apiKey) {
    await storage.setApiKey(legacyProfile.apiKeyRef, localData.apiKey, legacyProfile.provider);
  }

  // 标记迁移完成
  await storage.setLocal({ schemaVersion: 2 });

  console.log('[VocabMeld] Migration to V2 complete');
}

/**
 * 根据endpoint推断provider
 */
function inferProvider(endpoint) {
  if (endpoint.includes('openai.com')) return 'openai';
  if (endpoint.includes('deepseek.com')) return 'deepseek';
  if (endpoint.includes('moonshot.cn')) return 'moonshot';
  if (endpoint.includes('groq.com')) return 'groq';
  if (endpoint.includes('localhost')) return 'ollama';
  return 'custom';
}

/**
 * 生成UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 创建右键菜单
 */
function createContextMenus() {
  chrome.contextMenus.create({
    id: 'vocabmeld-process',
    title: '处理当前页面',
    contexts: ['page']
  });
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action } = message;

  // API Profile管理
  if (action === 'profiles:list') {
    (async () => {
      const profiles = await storage.getApiProfiles();
      sendResponse({ success: true, data: profiles });
    })();
    return true;
  }

  if (action === 'profiles:upsert') {
    (async () => {
      const { profile, apiKey } = message;
      await storage.upsertApiProfile(profile);
      if (apiKey && profile.apiKeyRef) {
        await storage.setApiKey(profile.apiKeyRef, apiKey, profile.provider);
      }
      sendResponse({ success: true });
    })();
    return true;
  }

  if (action === 'profiles:delete') {
    (async () => {
      await storage.deleteApiProfile(message.profileId);
      sendResponse({ success: true });
    })();
    return true;
  }

  if (action === 'routing:get') {
    (async () => {
      const routing = await storage.getApiRouting();
      sendResponse({ success: true, data: routing });
    })();
    return true;
  }

  if (action === 'routing:set') {
    (async () => {
      await storage.setApiRouting(message.routing);
      sendResponse({ success: true });
    })();
    return true;
  }

  // LLM翻译请求（使用router）
  if (action === 'llm:translate') {
    (async () => {
      try {
        const result = await llmRouter.translate(message.request);
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message, code: error.type });
      }
    })();
    return true;
  }

  // 测试API Profile
  if (action === 'llm:testProfile') {
    (async () => {
      try {
        const result = await llmRouter.testProfile(message.profileId);
        sendResponse(result);
      } catch (error) {
        sendResponse({ success: false, message: error.message });
      }
    })();
    return true;
  }

  // 兼容旧的testApi（逐步废弃）
  if (action === 'testApi') {
    (async () => {
      try {
        const { payload } = message;
        // 临时创建profile测试
        sendResponse({ success: true, message: 'Please use new API management' });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // 语音播报
  if (action === 'speak') {
    const { text } = message;
    if (text) {
      chrome.tts.speak(text, { lang: 'en-US', rate: 0.9 });
    }
    sendResponse({ success: true });
    return false;
  }

  // 获取统计
  if (action === 'getStats') {
    (async () => {
      const config = await storage.getConfig();
      sendResponse({
        totalWords: config.totalWords || 0,
        todayWords: config.todayWords || 0,
        learnedCount: (config.learnedWords || []).length,
        memorizeCount: (config.memorizeList || []).length,
        cacheHits: config.cacheHits || 0,
        cacheMisses: config.cacheMisses || 0
      });
    })();
    return true;
  }

  // 获取缓存统计
  if (action === 'getCacheStats') {
    (async () => {
      const data = await storage.getLocal(['vocabmeld_word_cache']);
      const cache = data.vocabmeld_word_cache || [];
      sendResponse({ size: cache.length, maxSize: 2000 });
    })();
    return true;
  }

  sendResponse({ success: false, error: 'Unknown action' });
  return false;
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'vocabmeld-process') {
    chrome.tabs.sendMessage(tab.id, { action: 'processPage' });
  }
});

// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-translation') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'processPage' });
      }
    });
  }
});

console.log('[VocabMeld] Background service worker loaded');
