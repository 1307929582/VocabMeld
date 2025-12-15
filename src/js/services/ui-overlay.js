/**
 * VocabMeld UI Overlay 模块
 * 管理所有浮层UI元素（tooltip/toast/selectionPopup）
 */

/**
 * @typedef {object} TooltipContent
 * @property {string} translation - 翻译文本
 * @property {string} original - 原始词汇
 * @property {string} [phonetic] - 音标（可选）
 * @property {string} difficulty - CEFR难度等级
 */

/**
 * UI浮层管理类
 * 提供tooltip、toast、selection popup的统一管理
 */
class UIOverlay {
  /** @type {HTMLElement|null} */
  #tooltipElement = null;
  /** @type {HTMLElement|null} */
  #toastElement = null;
  /** @type {HTMLElement|null} */
  #selectionPopupElement = null;
  /** @type {number|null} */
  #toastTimeout = null;

  constructor() {
    // 确保overlay容器存在
    let overlayContainer = document.getElementById('vocabmeld-overlay-container');
    if (!overlayContainer) {
      overlayContainer = this._createElementWithClass('div', 'vocabmeld-overlay-container');
      overlayContainer.id = 'vocabmeld-overlay-container';
      document.body.appendChild(overlayContainer);
    }
    this.overlayContainer = overlayContainer;

    // 初始化元素（隐藏状态）
    this.#tooltipElement = this.createTooltip();
    this.#toastElement = this.createToast();
    this.#selectionPopupElement = this.createSelectionPopup();
  }

  /**
   * 创建tooltip元素（初始隐藏）
   * @returns {HTMLElement}
   */
  createTooltip() {
    if (this.#tooltipElement) return this.#tooltipElement;

    const tooltip = this._createElementWithClass('div', 'vocabmeld-tooltip');
    tooltip.style.position = 'fixed';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '2147483647';

    // 内容容器
    const content = this._createElementWithClass('div', 'tooltip-content');

    // 翻译行（翻译+难度徽章）
    const translationLine = this._createElementWithClass('div', 'translation-line');
    const translationSpan = this._createElementWithClass('span', 'translation');
    const difficultyBadge = this._createElementWithClass('span', 'difficulty-badge');
    translationLine.appendChild(translationSpan);
    translationLine.appendChild(difficultyBadge);

    // 音标行
    const phoneticDiv = this._createElementWithClass('div', 'phonetic');

    // 提示行
    const hintDiv = this._createElementWithClass('div', 'hint');
    hintDiv.textContent = '左键点击发音 · 右键标记已学会';

    content.appendChild(translationLine);
    content.appendChild(phoneticDiv);
    content.appendChild(hintDiv);
    tooltip.appendChild(content);

    this.overlayContainer.appendChild(tooltip);
    return tooltip;
  }

  /**
   * 显示tooltip在指定元素附近
   * @param {HTMLElement} targetElement - 目标元素
   * @param {TooltipContent} content - tooltip内容
   */
  showTooltip(targetElement, { translation, original, phonetic, difficulty }) {
    if (!this.#tooltipElement) this.createTooltip();

    const tooltip = this.#tooltipElement;
    const translationSpan = tooltip.querySelector('.translation');
    const difficultyBadge = tooltip.querySelector('.difficulty-badge');
    const phoneticDiv = tooltip.querySelector('.phonetic');

    // 使用textContent避免XSS
    if (translationSpan) translationSpan.textContent = translation || '';
    if (difficultyBadge) {
      difficultyBadge.textContent = difficulty || 'B1';
      difficultyBadge.className = `difficulty-badge cefr-${(difficulty || 'B1').toLowerCase()}`;
    }
    if (phoneticDiv) {
      phoneticDiv.textContent = phonetic ? `[${phonetic}]` : '';
      phoneticDiv.style.display = phonetic ? 'block' : 'none';
    }

    // 定位tooltip（元素下方5px）
    const rect = targetElement.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    tooltip.style.top = `${rect.bottom + scrollY + 5}px`;
    tooltip.style.left = `${rect.left + scrollX}px`;
    tooltip.style.display = 'block';

    // 确保不超出视口右边界
    setTimeout(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
      }
    }, 0);
  }

  /**
   * 隐藏tooltip
   */
  hideTooltip() {
    if (this.#tooltipElement) {
      this.#tooltipElement.style.display = 'none';
    }
  }

  /**
   * 创建toast元素（初始隐藏）
   * @returns {HTMLElement}
   */
  createToast() {
    if (this.#toastElement) return this.#toastElement;

    const toast = this._createElementWithClass('div', 'vocabmeld-toast');
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.display = 'none';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    toast.style.zIndex = '2147483647';

    const messageSpan = this._createElementWithClass('span', 'toast-message');
    toast.appendChild(messageSpan);

    this.overlayContainer.appendChild(toast);
    return toast;
  }

  /**
   * 显示toast提示消息
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长（毫秒）
   */
  showToast(message, duration = 2000) {
    if (!this.#toastElement) this.createToast();

    clearTimeout(this.#toastTimeout);
    const toast = this.#toastElement;
    const messageSpan = toast.querySelector('.toast-message');
    if (messageSpan) messageSpan.textContent = message || '';

    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);

    this.#toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 300);
    }, duration);
  }

  /**
   * 创建selection popup元素（初始隐藏）
   * @returns {HTMLElement}
   */
  createSelectionPopup() {
    if (this.#selectionPopupElement) return this.#selectionPopupElement;

    const popup = this._createElementWithClass('div', 'vocabmeld-selection-popup');
    popup.style.position = 'fixed';
    popup.style.display = 'none';
    popup.style.zIndex = '2147483647';

    const addButton = this._createElementWithClass('button', 'add-to-memorize-btn');
    addButton.type = 'button';
    addButton.textContent = '添加到需记忆';

    popup.appendChild(addButton);

    this.overlayContainer.appendChild(popup);
    return popup;
  }

  /**
   * 显示selection popup在指定坐标
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} word - 选中的词汇
   */
  showSelectionPopup(x, y, word) {
    if (!this.#selectionPopupElement) this.createSelectionPopup();

    const popup = this.#selectionPopupElement;

    // 存储word到dataset供外部使用
    popup.dataset.word = word || '';

    // 定位popup
    popup.style.top = `${y}px`;
    popup.style.left = `${x}px`;
    popup.style.display = 'block';
  }

  /**
   * 隐藏selection popup
   */
  hideSelectionPopup() {
    if (this.#selectionPopupElement) {
      this.#selectionPopupElement.style.display = 'none';
      delete this.#selectionPopupElement.dataset.word;
    }
  }

  /**
   * 获取selection popup的按钮元素（供外部绑定事件）
   * @returns {HTMLElement|null}
   */
  getSelectionPopupButton() {
    if (!this.#selectionPopupElement) return null;
    return this.#selectionPopupElement.querySelector('.add-to-memorize-btn');
  }

  /**
   * 销毁所有overlay元素
   */
  destroy() {
    if (this.#tooltipElement && this.#tooltipElement.parentNode) {
      this.#tooltipElement.parentNode.removeChild(this.#tooltipElement);
      this.#tooltipElement = null;
    }
    if (this.#toastElement && this.#toastElement.parentNode) {
      this.#toastElement.parentNode.removeChild(this.#toastElement);
      this.#toastElement = null;
      clearTimeout(this.#toastTimeout);
    }
    if (this.#selectionPopupElement && this.#selectionPopupElement.parentNode) {
      this.#selectionPopupElement.parentNode.removeChild(this.#selectionPopupElement);
      this.#selectionPopupElement = null;
    }
    if (this.overlayContainer && this.overlayContainer.parentNode) {
      this.overlayContainer.parentNode.removeChild(this.overlayContainer);
      this.overlayContainer = null;
    }
  }

  /**
   * 内部辅助方法：创建带class的元素
   * @param {string} tagName - 元素标签名
   * @param {string} className - class名称
   * @returns {HTMLElement}
   * @private
   */
  _createElementWithClass(tagName, className = '') {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    return element;
  }
}

// 导出单例
export const uiOverlay = new UIOverlay();
export default uiOverlay;
