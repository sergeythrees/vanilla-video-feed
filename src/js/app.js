import { loadVideosFromDrive } from './data/videos.js';
import { renderFeed } from './components/feedRenderer.js';
import { VideoPlayer } from './components/VideoPlayer.js';
import { FeedObserver } from './components/feedObserver.js';
import { InputController } from './controls/input.js';

class App {
  /**
   * @param {HTMLElement} feedEl - the feed container element
   * @param {HTMLElement} emptyStateEl - the empty-state fallback element
   */
  constructor(feedEl, emptyStateEl) {
    /** @type {HTMLElement} */
    this._feedEl = feedEl;
    /** @type {HTMLElement} */
    this._emptyStateEl = emptyStateEl;
    /** @type {VideoPlayer[]} */
    this._players = [];
    /** @type {HTMLElement[]} */
    this._itemEls = [];
    /** @type {number} */
    this._activeIndex = 0;
    /** @type {FeedObserver | null} */
    this._observerController = null;
    /** @type {InputController | null} */
    this._eventsController = null;
  }

  /**
   * @param {string} message
   */
  _showEmpty(message) {
    this._feedEl.classList.add('hidden');
    this._emptyStateEl.textContent = message;
    this._emptyStateEl.classList.remove('hidden');
  }

  async init() {
    const videos = await loadVideosFromDrive();

    if (!Array.isArray(videos) || videos.length === 0) {
      this._showEmpty('No videos were found in the Google Drive folder.');
      return;
    }

    renderFeed(this._feedEl, videos);

    this._itemEls = Array.from(this._feedEl.querySelectorAll('.feed-item'));
    this._players = this._itemEls.map((itemEl) => new VideoPlayer(itemEl));
    this._activeIndex = 0;

    this._observerController = new FeedObserver(this._itemEls, (nextIndex) =>
      this._applyPlaybackState(nextIndex),
    );

    this._eventsController = new InputController(
      this._feedEl,
      (direction) => this._navigate(direction),
      () => this._players[this._activeIndex]?.pause(),
    );

    this._applyPlaybackState(0);

    window.addEventListener('beforeunload', () => {
      this._observerController?.disconnect();
      this._eventsController?.cleanup();
    });
  }

  /**
   * @param {number} nextIndex - the index to activate
   */
  _applyPlaybackState(nextIndex) {
    this._activeIndex = nextIndex;
    for (let i = 0; i < this._players.length; i++) {
      const player = this._players[i];
      player.setDistance(Math.abs(i - nextIndex));
      if (i === nextIndex) {
        player.play();
      } else {
        player.pause();
      }
    }
  }

  /**
   * @param {number} direction - scroll direction (1 for forward, -1 for backward)
   */
  _navigate(direction) {
    const nextIndex = Math.max(
      0,
      Math.min(this._itemEls.length - 1, this._activeIndex + direction),
    );
    if (nextIndex === this._activeIndex) {
      return;
    }
    this._itemEls[nextIndex].scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  }
}

/** @type {HTMLElement | null} */
const feedEl = document.querySelector('#feed');
/** @type {HTMLElement | null} */
const emptyStateEl = document.querySelector('#emptyState');

if (!feedEl || !emptyStateEl) {
  throw new Error('Required DOM nodes are missing.');
}

const app = new App(feedEl, emptyStateEl);
app.init().catch(() => {
  app._showEmpty('Unable to load videos from Google Drive.');
});
