import { loadVideosFromDrive } from './data/videos.js';
import { VirtualFeed } from './components/virtualFeed.js';
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

    /** @type {VirtualFeed | null} */
    this._virtualFeed = null;

    /** @type {Map<number, VideoPlayer>} */
    this._players = new Map();

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

    this._virtualFeed = new VirtualFeed(this._feedEl, videos);

    this._itemEls = this._virtualFeed.getItemElements();
    for (const itemEl of this._itemEls) {
      const index = Number(itemEl.dataset.index);
      this._players.set(index, new VideoPlayer(itemEl));
    }

    this._activeIndex = 0;

    this._observerController = new FeedObserver(
      this._itemEls,
      (nextIndex) => this._applyPlaybackState(nextIndex),
      0,
    );

    this._eventsController = new InputController(
      this._feedEl,
      (direction) => this._navigate(direction),
      () => this._players.get(this._activeIndex)?.pause(),
    );

    this._applyPlaybackState(0);

    window.addEventListener('beforeunload', () => {
      this._observerController?.disconnect();
      this._eventsController?.cleanup();
      this._virtualFeed?.destroy();
    });
  }

  /**
   * @param {number} nextIndex - the index to activate
   */
  _applyPlaybackState(nextIndex) {
    this._activeIndex = nextIndex;

    const { added, removed } = this._virtualFeed.update(nextIndex);

    for (const index of removed) {
      this._players.delete(index);
    }

    const currentItemEls = this._virtualFeed.getItemElements();
    for (const index of added) {
      const itemEl = currentItemEls.find(
        (el) => Number(el.dataset.index) === index,
      );
      if (itemEl) {
        this._players.set(index, new VideoPlayer(itemEl));
      }
    }

    this._itemEls = currentItemEls;

    this._observerController?.disconnect();
    this._observerController = new FeedObserver(
      this._itemEls,
      (nextIdx) => this._applyPlaybackState(nextIdx),
      nextIndex,
    );

    for (const [index, player] of this._players) {
      player.setDistance(Math.abs(index - nextIndex));
      if (index === nextIndex) {
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
    const total = this._virtualFeed
      ? this._virtualFeed.total
      : this._itemEls.length;

    const nextIndex = Math.max(
      0,
      Math.min(total - 1, this._activeIndex + direction),
    );

    if (nextIndex === this._activeIndex) {
      return;
    }

    // The target element may not be in the DOM yet if the user jumped
    // more than the buffer size (e.g. PageUp / PageDown).
    // Update the virtual feed first to ensure it exists.
    this._applyPlaybackState(nextIndex);

    const targetEl = this._feedEl.querySelector(
      `.feed-item[data-index="${nextIndex}"]`,
    );
    if (targetEl) {
      targetEl.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }
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
