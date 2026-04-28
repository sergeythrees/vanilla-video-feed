import {
  getControlViews,
  getPreloadMode,
  getProgressPercent,
} from '../ui/playerUI.js'

/**
 * Attempts playback while swallowing autoplay-policy rejections.
 */
function safePlay(videoEl) {
  const maybePromise = videoEl.play()
  if (maybePromise && typeof maybePromise.catch === 'function') {
    maybePromise.catch(() => {})
  }
}

function updateProgress(videoEl, progressEl) {
  const value = getProgressPercent(videoEl.currentTime, videoEl.duration)
  progressEl.style.width = `${Math.max(0, Math.min(100, value))}%`
}

function preloadForDistance(videoEl, distance) {
  videoEl.preload = getPreloadMode(distance)
}

export class VideoPlayer {
  /**
   * @param {HTMLElement} itemEl - the feed card element containing video and controls
   */
  constructor(itemEl) {
    /** @type {HTMLElement} */
    this._itemEl = itemEl
    /** @type {HTMLVideoElement} */
    this._videoEl = itemEl.querySelector('.feed-video')
    /** @type {HTMLElement} */
    this._loadingEl = itemEl.querySelector('.video-loading')
    /** @type {HTMLElement} */
    this._playBtn = itemEl.querySelector('.js-play-toggle')
    /** @type {HTMLElement} */
    this._muteBtn = itemEl.querySelector('.js-mute-toggle')
    /** @type {HTMLElement} */
    this._progressEl = itemEl.querySelector('.js-progress')

    this._setupListeners()
    this._syncButtons()
  }

  _togglePlay() {
    if (this._videoEl.paused) {
      safePlay(this._videoEl)
    } else {
      this._videoEl.pause()
    }
    this._syncButtons()
  }

  _hideLoading() {
    this._loadingEl.classList.add('hidden')
  }

  _showError() {
    this._loadingEl.classList.add('hidden')
    const errorEl = document.createElement('div')
    errorEl.className = 'video-error'
    errorEl.textContent = 'Unable to load this video.'
    this._itemEl.append(errorEl)
  }

  _syncButtons() {
    const { play, mute } = getControlViews(this._videoEl)
    this._playBtn.textContent = play.icon
    this._playBtn.setAttribute('aria-label', play.ariaLabel)
    this._muteBtn.textContent = mute.icon
    this._muteBtn.setAttribute('aria-label', mute.ariaLabel)
  }

  _setupListeners() {
    this._videoEl.addEventListener('loadeddata', () => this._hideLoading(), {
      once: true,
    })
    this._videoEl.addEventListener('error', () => this._showError())
    this._videoEl.addEventListener('timeupdate', () =>
      updateProgress(this._videoEl, this._progressEl),
    )

    this._playBtn.addEventListener('click', (event) => {
      event.stopPropagation()
      this._togglePlay()
    })

    this._muteBtn.addEventListener('click', (event) => {
      event.stopPropagation()
      this._videoEl.muted = !this._videoEl.muted
      this._syncButtons()
    })

    this._itemEl.addEventListener('click', () => this._togglePlay())
  }

  play() {
    safePlay(this._videoEl)
    this._syncButtons()
  }

  pause() {
    this._videoEl.pause()
    this._syncButtons()
  }

  resetProgress() {
    this._progressEl.style.width = '0'
  }

  _loadSrc() {
    const dataSrc = this._videoEl.dataset.src
    if (dataSrc && !this._videoEl.hasAttribute('src')) {
      this._videoEl.setAttribute('src', dataSrc)
    }
  }

  _unloadSrc() {
    if (!this._videoEl.hasAttribute('src')) return

    this._videoEl.pause()
    this._videoEl.removeAttribute('src')
    this.resetProgress()
    this._syncButtons()
  }

  /**
   * @param {number} distance - distance from the active feed item
   */
  setDistance(distance) {
    preloadForDistance(this._videoEl, distance)

    if (distance <= 2) {
      this._loadSrc()
    } else {
      this._unloadSrc()
    }
  }

  /**
   * @returns {boolean} whether the video element is currently paused
   */
  isPaused() {
    return this._videoEl.paused
  }
}
