const POPUP_SELECTOR = ".van-popup--bottom"
const HEADER_SELECTOR = ":scope > .popup-body > .popup-head, :scope > .van-picker > .van-picker__toolbar"
const CLOSE_DISTANCE = 110
const CLOSE_VELOCITY = 0.6
const DECIDE_DISTANCE = 8

interface DragState {
  popup: HTMLElement
  startX: number
  startY: number
  startTime: number
  offset: number
  active: boolean
  decided: boolean
}

let drag: DragState | null = null

function findOverlay(popup: HTMLElement) {
  let node = popup.previousElementSibling
  while (node) {
    if (node.classList.contains("van-overlay")) return node as HTMLElement
    node = node.previousElementSibling
  }
  return null
}

function resetPopup(popup: HTMLElement) {
  popup.style.transition = ""
  popup.style.transform = ""
}

function cancelDrag() {
  if (drag?.active) resetPopup(drag.popup)
  drag = null
}

function onTouchStart(event: TouchEvent) {
  cancelDrag()
  if (event.touches.length !== 1) return
  const target = event.target
  if (!(target instanceof Element)) return
  const popup = target.closest<HTMLElement>(POPUP_SELECTOR)
  if (!popup) return

  const touch = event.touches[0]
  if (target === popup) {
    const top = touch.clientY - popup.getBoundingClientRect().top
    const handleHeight = parseFloat(getComputedStyle(popup).paddingTop)
    if (top < 0 || top >= handleHeight) return
  } else if (!popup.querySelector(HEADER_SELECTOR)?.contains(target)) {
    return
  }

  drag = {
    popup,
    startX: touch.clientX,
    startY: touch.clientY,
    startTime: Date.now(),
    offset: 0,
    active: false,
    decided: false,
  }
}

function onTouchMove(event: TouchEvent) {
  if (!drag) return
  const touch = event.touches[0]
  const deltaX = touch.clientX - drag.startX
  const deltaY = touch.clientY - drag.startY

  if (!drag.decided) {
    if (Math.abs(deltaX) < DECIDE_DISTANCE && Math.abs(deltaY) < DECIDE_DISTANCE) return
    drag.decided = true
    if (deltaY <= 0 || Math.abs(deltaX) > Math.abs(deltaY)) {
      drag = null
      return
    }
    drag.active = true
    drag.startY = touch.clientY
    const active = document.activeElement as HTMLElement | null
    if (active && drag.popup.contains(active)) active.blur()
    drag.popup.style.transition = "none"
  }

  if (!drag.active) return
  event.preventDefault()
  drag.offset = Math.max(0, touch.clientY - drag.startY)
  drag.popup.style.transform = "translate3d(0, " + drag.offset + "px, 0)"
}

function onTouchEnd() {
  if (!drag) return
  const { popup, offset, active, startTime } = drag
  drag = null
  if (!active) return

  const velocity = offset / Math.max(1, Date.now() - startTime)
  const shouldClose = offset > Math.min(CLOSE_DISTANCE, popup.offsetHeight * 0.3) || (velocity > CLOSE_VELOCITY && offset > 30)
  const overlay = shouldClose ? findOverlay(popup) : null

  if (!overlay) {
    popup.style.transition = "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)"
    popup.style.transform = ""
    window.setTimeout(() => resetPopup(popup), 260)
    return
  }

  popup.style.transition = "transform 0.22s ease-in"
  popup.style.transform = "translate3d(0, 100%, 0)"
  overlay.click()
  window.setTimeout(() => resetPopup(popup), 320)
}

export function setupPopupSwipeClose() {
  document.addEventListener("touchstart", onTouchStart, { passive: true })
  document.addEventListener("touchmove", onTouchMove, { passive: false })
  document.addEventListener("touchend", onTouchEnd)
  document.addEventListener("touchcancel", cancelDrag)
}
