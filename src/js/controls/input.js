export class InputController {
  _handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      this._onNavigate(1)
      event.preventDefault()
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      this._onNavigate(-1)
      event.preventDefault()
    }
  }

  _handleVisibility = () => {
    if (document.hidden) {
      this._onPauseActive()
    }
  }

  /**
   * @param {HTMLElement} feedEl - the feed container element
   * @param {(direction: number) => void} onNavigate - callback for keyboard navigation
   * @param {() => void} onPauseActive - callback to pause the active video
   */
  constructor(feedEl, onNavigate, onPauseActive) {
    this._onNavigate = onNavigate
    this._onPauseActive = onPauseActive

    window.addEventListener('keydown', this._handleKeyDown)
    document.addEventListener('visibilitychange', this._handleVisibility)
  }

  cleanup() {
    window.removeEventListener('keydown', this._handleKeyDown)
    document.removeEventListener('visibilitychange', this._handleVisibility)
  }
}
