import { describe, it, expect, beforeEach } from 'vitest'
import { VideoPlayer } from './VideoPlayer.js'

function createItemEl({
  dataSrc = 'https://example.com/video.mp4',
  index = 0,
} = {}) {
  const el = document.createElement('div')
  el.innerHTML = `
    <section class="feed-item" data-index="${index}">
      <video class="feed-video" data-src="${dataSrc}" muted loop playsinline
             webkit-playsinline preload="none"
             aria-label="Test video. Video ${index + 1} of 10">
      </video>
      <div class="video-loading">Loading...</div>
      <div class="video-overlay">
        <div class="video-meta">
          <h2 class="video-title">Test</h2>
          <p class="video-subtitle">Author</p>
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
  return el.firstElementChild
}

describe('VideoPlayer — deferred src loading & unloading', () => {
  /** @type {HTMLElement} */
  let itemEl
  /** @type {HTMLVideoElement} */
  let videoEl
  /** @type {VideoPlayer} */
  let player

  beforeEach(() => {
    itemEl = createItemEl()
    videoEl = itemEl.querySelector('.feed-video')
    player = new VideoPlayer(itemEl)
  })

  describe('_loadSrc (deferred loading)', () => {
    it('should NOT have src attribute set initially (deferred)', () => {
      expect(videoEl.hasAttribute('src')).toBe(false)
    })

    it('should have data-src with the original URL', () => {
      expect(videoEl.dataset.src).toBe('https://example.com/video.mp4')
    })

    it('should set src from data-src when called via setDistance(0) [active]', () => {
      player.setDistance(0)

      expect(videoEl.hasAttribute('src')).toBe(true)
      expect(videoEl.getAttribute('src')).toBe('https://example.com/video.mp4')
    })

    it('should set src from data-src when called via setDistance(1) [neighbour]', () => {
      player.setDistance(1)

      expect(videoEl.hasAttribute('src')).toBe(true)
      expect(videoEl.getAttribute('src')).toBe('https://example.com/video.mp4')
    })

    it('should set src from data-src when called via setDistance(2) [buffer edge]', () => {
      player.setDistance(2)

      expect(videoEl.hasAttribute('src')).toBe(true)
      expect(videoEl.getAttribute('src')).toBe('https://example.com/video.mp4')
    })
  })

  describe('_unloadSrc (unloading distant videos)', () => {
    it('should remove src when called via setDistance(3) [outside buffer]', () => {
      player.setDistance(0)
      expect(videoEl.hasAttribute('src')).toBe(true)

      player.setDistance(3)
      expect(videoEl.hasAttribute('src')).toBe(false)
    })

    it('should reset progress when unloading', () => {
      player.setDistance(0)
      videoEl.currentTime = 10
      videoEl.dispatchEvent(new Event('timeupdate'))

      player.setDistance(3)
      expect(itemEl.querySelector('.js-progress').style.width).toBe('0px')
    })

    it('should be a no-op if called again after already unloaded', () => {
      player.setDistance(0)
      expect(videoEl.hasAttribute('src')).toBe(true)

      player.setDistance(3)
      expect(videoEl.hasAttribute('src')).toBe(false)

      expect(() => player.setDistance(5)).not.toThrow()
      expect(videoEl.hasAttribute('src')).toBe(false)
    })

    it('should re-load src when video comes back into buffer zone', () => {
      player.setDistance(0)
      expect(videoEl.hasAttribute('src')).toBe(true)

      player.setDistance(5)
      expect(videoEl.hasAttribute('src')).toBe(false)

      player.setDistance(2)
      expect(videoEl.hasAttribute('src')).toBe(true)
      expect(videoEl.getAttribute('src')).toBe('https://example.com/video.mp4')
    })

    it('should not unload items at distance 2 (buffer edge)', () => {
      player.setDistance(2)
      expect(videoEl.hasAttribute('src')).toBe(true)

      player.setDistance(2)
      expect(videoEl.hasAttribute('src')).toBe(true)
    })
  })

  describe('full lifecycle (render → buffer → out → back)', () => {
    it('should properly load, unload and reload src across the full cycle', () => {
      expect(videoEl.hasAttribute('src')).toBe(false)
      expect(videoEl.dataset.src).toBe('https://example.com/video.mp4')

      player.setDistance(1)
      expect(videoEl.hasAttribute('src')).toBe(true)
      expect(videoEl.getAttribute('src')).toBe(videoEl.dataset.src)

      player.setDistance(0)
      expect(videoEl.hasAttribute('src')).toBe(true)
      expect(videoEl.preload).toBe('auto')

      player.setDistance(5)
      expect(videoEl.hasAttribute('src')).toBe(false)

      player.setDistance(1)
      expect(videoEl.hasAttribute('src')).toBe(true)
      expect(videoEl.getAttribute('src')).toBe('https://example.com/video.mp4')
    })
  })
})
