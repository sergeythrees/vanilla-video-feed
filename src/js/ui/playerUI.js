/**
 * @param {number} currentTime - current playback position in seconds
 * @param {number} duration - total video duration in seconds
 * @returns {number} progress percentage from 0 to 100
 */
export function getProgressPercent(currentTime, duration) {
  if (!duration || Number.isNaN(duration)) {
    return 0;
  }
  const value = (currentTime / duration) * 100;
  return Math.max(0, Math.min(100, value));
}

/**
 * @param {number} distance - distance from the active video item (0 = active, 1 = neighbour, 2+ = far)
 * @returns {"auto" | "metadata" | "none"} the preload attribute value
 */
export function getPreloadMode(distance) {
  if (distance === 0) {
    return 'auto';
  }
  if (distance === 1) {
    return 'metadata';
  }
  return 'none';
}

/**
 * @param {HTMLVideoElement} videoEl - the video element
 * @returns {{ play: { icon: string, ariaLabel: string }, mute: { icon: string, ariaLabel: string } }}
 */
export function getControlViews(videoEl) {
  return {
    play: videoEl.paused
      ? { icon: '▶', ariaLabel: 'Play video' }
      : { icon: '❚❚', ariaLabel: 'Pause video' },
    mute: videoEl.muted
      ? { icon: '🔇', ariaLabel: 'Unmute video' }
      : { icon: '🔊', ariaLabel: 'Mute video' },
  };
}
