/**
 * Renders only a sliding window of feed items (active index ± buffer).
 */
export class VirtualFeed {
  /**
   * @param {HTMLElement} feedEl - the feed container
   * @param {Array<{src: string, title: string, author: string, poster?: string}>} items
   * @param {number} [bufferSize=2] - number of extra items to render above/below active
   */
  constructor(feedEl, items, bufferSize = 2) {
    /** @type {HTMLElement} */
    this._feedEl = feedEl
    /** @type {Array} */
    this._items = items
    /** @type {number} */
    this._bufferSize = bufferSize
    /** @type {number} */
    this._total = items.length

    /** @type {{ start: number, end: number }} */
    this._range = { start: -1, end: -1 }

    /** @type {HTMLElement | null} */
    this._topSpacer = null
    /** @type {HTMLElement | null} */
    this._bottomSpacer = null
    /** @type {HTMLElement | null} */
    this._content = null

    this._init()
  }

  /** @returns {number} */
  get total() {
    return this._total
  }

  /**
   * @returns {number} the height of a single feed item in pixels.
   */
  _getItemHeight() {
    return this._feedEl.clientHeight || window.innerHeight
  }

  _init() {
    this._feedEl.innerHTML = ''

    this._topSpacer = document.createElement('div')
    this._topSpacer.className = 'feed-spacer'

    this._content = document.createElement('div')
    this._content.className = 'feed-content'

    this._bottomSpacer = document.createElement('div')
    this._bottomSpacer.className = 'feed-spacer'

    this._feedEl.append(this._topSpacer, this._content, this._bottomSpacer)

    const initialEnd = Math.min(this._bufferSize, this._total - 1)
    this._renderRange(0, initialEnd)

    this._onResize = () => this._updateSpacers()
    window.addEventListener('resize', this._onResize)
  }

  /**
   * @param {{ src: string, title: string, author: string, poster?: string }} videoData
   * @param {number} index
   * @returns {HTMLElement}
   */
  _createItemElement(videoData, index) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = `
      <section class="feed-item" data-index="${index}">
        <video class="feed-video" data-src="${videoData.src}" muted loop playsinline
               webkit-playsinline preload="none"
               aria-label="${videoData.title}. Video ${index + 1} of ${this._total}"
               ${videoData.poster ? `poster="${videoData.poster}"` : ''}>
        </video>
        <div class="video-loading">Loading...</div>
        <div class="video-overlay">
          <div class="video-meta">
            <h2 class="video-title">${videoData.title}</h2>
            <p class="video-subtitle">${videoData.author}</p>
          </div>
          <div class="video-controls">
            <button class="control-btn js-play-toggle" type="button" aria-label="Pause video">❚❚</button>
            <button class="control-btn js-mute-toggle" type="button" aria-label="Unmute video">🔇</button>
            <div class="video-progress" aria-hidden="true">
              <span class="video-progress-value js-progress"></span>
            </div>
          </div>
        </div>
      </section>
    `
    return wrapper.firstElementChild
  }

  /**
   * Set spacer heights to preserve total scroll height.
   */
  _updateSpacers() {
    const itemHeight = this._getItemHeight()
    const { start, end } = this._range

    this._topSpacer.style.height = `${start * itemHeight}px`
    this._bottomSpacer.style.height = `${(this._total - end - 1) * itemHeight}px`
  }

  /**
   * Fully replace content div with items in [start, end].
   * @param {number} start
   * @param {number} end
   */
  _renderRange(start, end) {
    this._range = { start, end }
    this._content.innerHTML = ''

    const fragment = document.createDocumentFragment()
    for (let i = start; i <= end; i++) {
      fragment.append(this._createItemElement(this._items[i], i))
    }
    this._content.append(fragment)

    this._updateSpacers()
  }

  /**
   * Update the rendered window to centre around `activeIndex`.
   * @param {number} activeIndex
   * @returns {{ added: number[], removed: number[] }}
   */
  update(activeIndex) {
    const { _bufferSize: bs, _total: total, _range: range } = this
    const newStart = Math.max(0, activeIndex - bs)
    const newEnd = Math.min(total - 1, activeIndex + bs)

    if (range.start === newStart && range.end === newEnd) {
      return { added: [], removed: [] }
    }

    const oldSet = new Set()
    for (let i = range.start; i <= range.end; i++) oldSet.add(i)

    const newSet = new Set()
    for (let i = newStart; i <= newEnd; i++) newSet.add(i)

    const removed = []
    for (let i = range.start; i <= range.end; i++) {
      if (!newSet.has(i)) removed.push(i)
    }

    const added = []
    for (let i = newStart; i <= newEnd; i++) {
      if (!oldSet.has(i)) added.push(i)
    }

    for (const index of removed) {
      const el = this._content.querySelector(
        `.feed-item[data-index="${index}"]`,
      )
      if (el) el.remove()
    }

    for (const index of added) {
      const el = this._createItemElement(this._items[index], index)

      let insertBefore = null
      for (const child of this._content.children) {
        if (Number(child.dataset.index) > index) {
          insertBefore = child
          break
        }
      }

      if (insertBefore) {
        this._content.insertBefore(el, insertBefore)
      } else {
        this._content.append(el)
      }
    }

    this._range = { start: newStart, end: newEnd }
    this._updateSpacers()

    return { added, removed }
  }

  /**
   * @returns {HTMLElement[]} all currently rendered feed-item elements.
   */
  getItemElements() {
    return Array.from(this._content.querySelectorAll('.feed-item'))
  }

  destroy() {
    window.removeEventListener('resize', this._onResize)
  }
}
