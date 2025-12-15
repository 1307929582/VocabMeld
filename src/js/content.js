/**
 * VocabMeld Content Script
 * 轻量入口 - 编排services模块，处理用户交互
 * 重构版 - Phase 2
 */

import { storage } from './core/storage.js';
import { DEFAULT_CONFIG } from './core/config.js';
import { processingService } from './services/processing-service.js';
import { uiOverlay } from './services/ui-overlay.js';
import { backgroundBridge } from './services/background-bridge.js';
import { textReplacer } from './services/text-replacer.js';

// ============ 最小状态管理 ============
let config = null;
let initialized = false;
let unsubscribeStorage = null;
let reprocessTimer = null;

// ============ 工具函数 ============
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ============ 消息监听 ============
function registerRuntimeMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!initialized) {
      sendResponse({ success: false, error: 'Not initialized' });
      return false;
    }

    const { action } = message;

    switch (action) {
      case 'processPage':
        (async () => {
          try {
            const result = await processingService.processPage({ viewportOnly: false });
            sendResponse({ success: true, ...result });
          } catch (error) {
            console.error('[VocabMeld] processPage error:', error);
            sendResponse({ success: false, error: error.message });
          }
        })();
        return true; // async response

      case 'restorePage':
        try {
          processingService.restorePage();
          uiOverlay.hideTooltip();
          uiOverlay.hideSelectionPopup();
          sendResponse({ success: true });
        } catch (error) {
          console.error('[VocabMeld] restorePage error:', error);
          sendResponse({ success: false, error: error.message });
        }
        return false;

      case 'processSpecificWords':
        (async () => {
          try {
            const words = message.words || [];
            const result = await processingService.processSpecificWords(words);
            sendResponse({ success: true, ...result });
          } catch (error) {
            console.error('[VocabMeld] processSpecificWords error:', error);
            sendResponse({ success: false, error: error.message });
          }
        })();
        return true;

      case 'getStatus':
        sendResponse({
          success: true,
          initialized,
          enabled: config?.enabled,
          isProcessing: processingService.isProcessing || false
        });
        return false;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
        return false;
    }
  });
}

// ============ 存储变更监听 ============
function registerStorageListener() {
  unsubscribeStorage = storage.addChangeListener(async (changes, areaName) => {
    if (areaName !== 'sync' && areaName !== 'local') return;

    // 重新加载配置
    const oldConfig = { ...config };
    config = await storage.getConfig();

    // Policy 1: enabled 变化
    if (changes.enabled) {
      if (!config.enabled) {
        // 禁用 - 立即恢复页面
        processingService.restorePage();
        uiOverlay.hideTooltip();
        uiOverlay.hideSelectionPopup();
        return;
      } else if (!oldConfig.enabled && config.enabled) {
        // 从禁用到启用 - 触发处理
        if (config.autoProcess && config.apiKey) {
          debounceReprocess();
        }
        return;
      }
    }

    // Policy 2: 需要reprocess的配置项（包括apiKey）
    const reprocessKeys = ['difficultyLevel', 'intensity', 'translationStyle', 'nativeLanguage', 'targetLanguage', 'modelName', 'apiEndpoint', 'apiKey'];
    const shouldReprocess = reprocessKeys.some(key => changes[key]);

    if (shouldReprocess && config.enabled) {
      processingService.restorePage();
      debounceReprocess();
    }

    // Policy 3: memorizeList 增量处理
    if (changes.memorizeList && config.enabled) {
      const oldList = oldConfig.memorizeList || [];
      const newList = config.memorizeList || [];
      const newWords = extractNewMemorizeWords(oldList, newList);

      if (newWords.length > 0) {
        processingService.processSpecificWords(newWords);
      }
    }
  });
}

/**
 * 提取新增的记忆词汇
 */
function extractNewMemorizeWords(oldList, newList) {
  const oldSet = new Set((oldList || []).map(w => (w.word || '').toLowerCase().trim()).filter(Boolean));
  const newWords = [];

  for (const item of (newList || [])) {
    const word = (item.word || '').toLowerCase().trim();
    if (word && !oldSet.has(word)) {
      newWords.push(item.word); // 保持原始大小写
    }
  }

  return newWords;
}

/**
 * 防抖重新处理
 */
function debounceReprocess(delay = 300) {
  clearTimeout(reprocessTimer);
  reprocessTimer = setTimeout(async () => {
    if (config?.enabled && config?.apiKey) {
      await processingService.processPage();
    }
  }, delay);
}

// ============ DOM事件绑定 ============
function registerDomEventHandlers() {
  const body = document.body;

  // 鼠标悬停 - 显示tooltip
  body.addEventListener('mouseover', (event) => {
    const wordElement = event.target.closest('.vocabmeld-translated');
    if (!wordElement) return;

    uiOverlay.showTooltip(wordElement, {
      translation: wordElement.getAttribute('data-translation'),
      original: wordElement.getAttribute('data-original'),
      phonetic: config.showPhonetic ? wordElement.getAttribute('data-phonetic') : '',
      difficulty: wordElement.getAttribute('data-difficulty')
    });
  });

  // 鼠标移出 - 隐藏tooltip
  body.addEventListener('mouseout', (event) => {
    const wordElement = event.target.closest('.vocabmeld-translated');
    if (!wordElement) return;
    uiOverlay.hideTooltip();
  });

  // 左键点击 - 发音（使用translation，因为用户想听目标语言的发音）
  body.addEventListener('click', async (event) => {
    const wordElement = event.target.closest('.vocabmeld-translated');
    if (!wordElement) return;

    // 发音使用translation（目标语言）而不是original
    const word = wordElement.getAttribute('data-translation') || wordElement.getAttribute('data-original');
    try {
      await backgroundBridge.speak(word);
    } catch (error) {
      console.error('[VocabMeld] Speak error:', error);
    }
  });

  // 右键点击 - 标记已学会
  body.addEventListener('contextmenu', async (event) => {
    const wordElement = event.target.closest('.vocabmeld-translated');
    if (!wordElement) return;

    event.preventDefault();

    const original = wordElement.getAttribute('data-original');
    const translation = wordElement.getAttribute('data-translation');
    const difficulty = wordElement.getAttribute('data-difficulty');

    try {
      // 添加到白名单
      await storage.addToWhitelist({
        original,
        word: translation,
        difficulty,
        addedAt: Date.now()
      });

      // 恢复该元素
      textReplacer.restoreOriginal(wordElement);

      uiOverlay.showToast(`"${original}" 已标记为已学会`);
    } catch (error) {
      console.error('[VocabMeld] Mark as learned error:', error);
    }
  });

  // 文本选择 - 显示添加到记忆按钮
  document.addEventListener('mouseup', (event) => {
    // 忽略overlay区域的点击
    if (event.target.closest('.vocabmeld-overlay-container')) return;
    if (event.target.closest('.vocabmeld-translated')) return;

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
      uiOverlay.showSelectionPopup(event.clientX, event.clientY, selectedText);
    } else {
      uiOverlay.hideSelectionPopup();
    }
  });

  // 绑定selection popup的按钮事件
  const selectionButton = uiOverlay.getSelectionPopupButton();
  if (selectionButton) {
    selectionButton.addEventListener('click', async () => {
      const popup = document.querySelector('.vocabmeld-selection-popup');
      const word = popup?.dataset.word;
      if (!word) return;

      try {
        // 添加到memorizeList
        const list = config.memorizeList || [];
        if (!list.some(w => w.word === word)) {
          list.push({ word, addedAt: Date.now() });
          await storage.set({ memorizeList: list });
          config.memorizeList = list;

          uiOverlay.hideSelectionPopup();
          uiOverlay.showToast(`"${word}" 已添加到记忆列表`);

          // 立即处理该词（触发翻译和替换）
          await processingService.processSpecificWords([word]);
        } else {
          uiOverlay.showToast(`"${word}" 已在记忆列表中`);
        }
      } catch (error) {
        console.error('[VocabMeld] Add to memorize error:', error);
      }
    });
  }

  // 点击页面其他地方 - 隐藏selection popup
  document.addEventListener('mousedown', (event) => {
    if (!event.target.closest('.vocabmeld-selection-popup')) {
      uiOverlay.hideSelectionPopup();
    }
  });

  // 滚动 - 隐藏tooltip（避免tooltip留在错误位置）
  window.addEventListener('scroll', () => {
    uiOverlay.hideTooltip();
  }, { passive: true });
}

// ============ 初始化 ============
async function init() {
  if (initialized) {
    console.log('[VocabMeld] Already initialized, skipping');
    return;
  }

  try {
    initialized = true;

    // 1. 加载配置
    config = await storage.getConfig();
    console.log('[VocabMeld] Config loaded:', config.enabled ? 'enabled' : 'disabled');

    // 2. 初始化服务（即使disabled也要初始化，以便后续启用）
    await processingService.init(config);
    console.log('[VocabMeld] Processing service initialized');

    // 3. 注册监听器（即使disabled也要注册，否则启用后无法响应）
    registerRuntimeMessageListener();
    registerStorageListener();
    registerDomEventHandlers();
    console.log('[VocabMeld] Event listeners registered');

    // 4. 自动处理（仅在enabled时执行）
    if (config.enabled && config.autoProcess && config.apiKey) {
      setTimeout(async () => {
        try {
          await processingService.processPage();
          console.log('[VocabMeld] Auto-processing complete');
        } catch (error) {
          console.error('[VocabMeld] Auto-processing error:', error);
        }
      }, 1000);
    } else {
      console.log('[VocabMeld] Auto-processing skipped:', {
        enabled: config.enabled,
        autoProcess: config.autoProcess,
        hasApiKey: !!config.apiKey
      });
    }

    console.log('[VocabMeld] Content script initialized successfully');
  } catch (error) {
    console.error('[VocabMeld] Initialization error:', error);
    initialized = false;
  }
}

// ============ 启动 ============
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

// 暴露清理方法（用于测试或重载）
window.__vocabmeld_destroy = () => {
  if (unsubscribeStorage) {
    unsubscribeStorage();
    unsubscribeStorage = null;
  }
  clearTimeout(reprocessTimer);
  uiOverlay.destroy();
  processingService.destroy?.();
  initialized = false;
};
