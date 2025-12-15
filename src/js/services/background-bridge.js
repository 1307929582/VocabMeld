/**
 * VocabMeld Background Bridge 模块
 * 封装与background script的消息通信
 */

/**
 * Background通信桥接类
 * 提供类型安全的消息发送接口
 */
class BackgroundBridge {
  /**
   * 发送消息到background script
   * @param {string} action - 动作类型
   * @param {object} payload - 消息载荷
   * @returns {Promise<any>}
   * @private
   */
  async _sendMessage(action, payload = {}) {
    return new Promise((resolve, reject) => {
      const message = { action, ...payload };

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(`[BackgroundBridge] Message error for action "${action}":`, chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve(response);
      });
    });
  }

  /**
   * 语音播报
   * @param {string} text - 要播报的文本
   * @returns {Promise<void>}
   */
  async speak(text) {
    try {
      await this._sendMessage('speak', { text });
    } catch (error) {
      console.error('[BackgroundBridge] Speak failed:', error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   * @returns {Promise<{totalWords: number, todayWords: number, learnedCount: number, memorizeCount: number, cacheHits: number, cacheMisses: number}>}
   */
  async getStats() {
    try {
      const response = await this._sendMessage('getStats');
      return response || {
        totalWords: 0,
        todayWords: 0,
        learnedCount: 0,
        memorizeCount: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    } catch (error) {
      console.error('[BackgroundBridge] getStats failed:', error);
      return {
        totalWords: 0,
        todayWords: 0,
        learnedCount: 0,
        memorizeCount: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    }
  }

  /**
   * 获取缓存统计
   * @returns {Promise<{size: number, maxSize: number}>}
   */
  async getCacheStats() {
    try {
      const response = await this._sendMessage('getCacheStats');
      return response || { size: 0, maxSize: 2000 };
    } catch (error) {
      console.error('[BackgroundBridge] getCacheStats failed:', error);
      return { size: 0, maxSize: 2000 };
    }
  }

  /**
   * 清空缓存
   * @returns {Promise<void>}
   */
  async clearCache() {
    try {
      await this._sendMessage('clearCache');
    } catch (error) {
      console.error('[BackgroundBridge] clearCache failed:', error);
      throw error;
    }
  }

  /**
   * 清空已学会词汇列表
   * @returns {Promise<void>}
   */
  async clearLearnedWords() {
    try {
      await this._sendMessage('clearLearnedWords');
    } catch (error) {
      console.error('[BackgroundBridge] clearLearnedWords failed:', error);
      throw error;
    }
  }

  /**
   * 清空需记忆词汇列表
   * @returns {Promise<void>}
   */
  async clearMemorizeList() {
    try {
      await this._sendMessage('clearMemorizeList');
    } catch (error) {
      console.error('[BackgroundBridge] clearMemorizeList failed:', error);
      throw error;
    }
  }

  /**
   * 测试API配置
   * @param {{apiEndpoint: string, apiKey: string, modelName: string}} config - API配置
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async testApi(config) {
    try {
      const response = await this._sendMessage('testApi', { payload: config });
      return response || { success: false, error: 'No response' };
    } catch (error) {
      console.error('[BackgroundBridge] testApi failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// 导出单例
export const backgroundBridge = new BackgroundBridge();
export default backgroundBridge;
