export class FeedObserver {
  /**
   * @param {HTMLElement[]} items - array of feed item elements to observe
   * @param {(index: number) => void} onActiveChange - callback invoked when active item changes
   */
  constructor(items, onActiveChange, initialIndex = -1) {
    /** @type {number} */
    this._activeIndex = initialIndex;
    /** @type {(index: number) => void} */
    this._onActiveChange = onActiveChange;

    this._observer = new IntersectionObserver(
      (entries) => this._handleIntersection(entries),
      {
        root: null,
        threshold: [0.25, 0.6, 0.9],
      },
    );

    items.forEach((item) => this._observer.observe(item));
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   */
  _handleIntersection(entries) {
    let candidate = this._activeIndex;
    let maxRatio = 0;

    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      if (entry.intersectionRatio > maxRatio) {
        maxRatio = entry.intersectionRatio;
        candidate = Number(entry.target.dataset.index);
      }
    }

    if (candidate !== this._activeIndex && candidate >= 0) {
      this._activeIndex = candidate;
      this._onActiveChange(this._activeIndex);
    }
  }

  disconnect() {
    this._observer.disconnect();
  }
}
