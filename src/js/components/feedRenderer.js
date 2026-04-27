/**
 * @param {{ src: string, title: string, author: string, poster?: string }} videoData
 * @param {number} index
 * @param {number} total
 * @returns {HTMLElement}
 */
function buildFeedItem(videoData, index, total) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <section class="feed-item" data-index="${index}">
      <video class="feed-video" src="${videoData.src}" muted loop playsinline
             webkit-playsinline preload="none"
             aria-label="${videoData.title}. Video ${index + 1} of ${total}"
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
  `;
  return wrapper.firstElementChild;
}

/**
 * @param {HTMLElement} feedEl
 * @param {Array<{ src: string, title: string, author: string, poster?: string }>} list
 */
export function renderFeed(feedEl, list) {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < list.length; i += 1) {
    fragment.append(buildFeedItem(list[i], i, list.length));
  }
  feedEl.innerHTML = '';
  feedEl.append(fragment);
}
