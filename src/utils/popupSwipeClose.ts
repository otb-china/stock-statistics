const POPUP_SELECTOR = ".van-popup--bottom"
const HEADER_SELECTOR = ":scope > .popup-body > .popup-head, :scope > .van-picker > .van-picker__toolbar"
const CLOSE_DISTANCE = 110
const CLOSE_VELOCITY = 0.5
const DECIDE_DISTANCE = 8
const VELOCITY_WINDOW = 100
const SETTLE_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)"
const CLOSE_EASING = "cubic-bezier(0.32, 0.72, 0, 1)"

interface DragState {
  popup: HTMLElement
  overlay: HTMLElement | null
  startX: number
  startY: number
  offset: number
  height: number
  active: boolean
  decided: boolean
  frame: number
  samples: { y: number; time: number }[]
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

function clearStyles(popup: HTMLElement, overlay: HTMLElement | null) {
  for (const el of [popup, overlay]) {
    if (!el) continue
    el.style.transition = ""
    el.style.transform = ""
    el.style.opacity = ""
    el.style.animation = ""
    el.style.willChange = ""
  }
}

function applyOffset(state: DragState) {
  state.frame = 0
  state.popup.style.transform = "translate3d(0, " + state.offset + "px, 0)"
  if (state.overlay) state.overlay.style.opacity = String(1 - Math.min(1, state.offset / state.height) * 0.9)
}

function animateTo(state: DragState, offset: number, duration: number, easing: string, done: () => void) {
  const { popup, overlay } = state
  const transition = "transform " + duration + "ms " + easing
  popup.style.transition = transition
  if (overlay) overlay.style.transition = "opacity " + duration + "ms " + easing
  popup.style.transform = offset ? "translate3d(0, " + offset + "px, 0)" : "translate3d(0, 0, 0)"
  if (overlay) overlay.style.opacity = offset ? "0" : "1"

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    popup.removeEventListener("transitionend", onEnd)
    done()
  }
  const onEnd = (event: TransitionEvent) => {
    if (event.target === popup && event.propertyName === "transform") finish()
  }
  popup.addEventListener("transitionend", onEnd)
  window.setTimeout(finish, duration + 60)
}

function waitUntilHidden(popup: HTMLElement, timeout: number) {
  return new Promise<boolean>((resolve) => {
    const start = performance.now()
    const check = () => {
      if (!popup.isConnected || getComputedStyle(popup).display === "none") return resolve(true)
      if (performance.now() - start > timeout) return resolve(false)
      requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

function cancelDrag() {
  if (!drag) return
  if (drag.frame) cancelAnimationFrame(drag.frame)
  if (drag.active) clearStyles(drag.popup, drag.overlay)
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
    overlay: null,
    startX: touch.clientX,
    startY: touch.clientY,
    offset: 0,
    height: 1,
    active: false,
    decided: false,
    frame: 0,
    samples: [],
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
    const { popup } = drag
    drag.active = true
    drag.startY = touch.clientY
    drag.overlay = findOverlay(popup)
    drag.height = Math.max(1, popup.offsetHeight)
    const active = document.activeElement as HTMLElement | null
    if (active && popup.contains(active)) active.blur()
    popup.style.transition = "none"
    popup.style.willChange = "transform"
    if (drag.overlay) {
      drag.overlay.style.transition = "none"
      drag.overlay.style.willChange = "opacity"
    }
  }

  if (!drag.active) return
  event.preventDefault()
  const now = performance.now()
  drag.offset = Math.max(0, touch.clientY - drag.startY)
  drag.samples.push({ y: touch.clientY, time: now })
  while (drag.samples.length > 2 && now - drag.samples[0].time > VELOCITY_WINDOW) drag.samples.shift()
  if (!drag.frame) {
    const state = drag
    drag.frame = requestAnimationFrame(() => applyOffset(state))
  }
}

function releaseVelocity(state: DragState) {
  const now = performance.now()
  const samples = state.samples.filter((sample) => now - sample.time <= VELOCITY_WINDOW)
  if (samples.length < 2) return 0
  const first = samples[0]
  const last = samples[samples.length - 1]
  return (last.y - first.y) / Math.max(1, last.time - first.time)
}

function onTouchEnd() {
  if (!drag) return
  const state = drag
  drag = null
  if (!state.active) return
  if (state.frame) cancelAnimationFrame(state.frame)
  applyOffset(state)

  const { popup, overlay, offset, height } = state
  const velocity = releaseVelocity(state)
  const shouldClose =
    overlay !== null &&
    velocity > -0.2 &&
    (offset > Math.min(CLOSE_DISTANCE, height * 0.3) || (velocity > CLOSE_VELOCITY && offset > 20))

  if (!shouldClose) {
    animateTo(state, 0, 280, SETTLE_EASING, () => clearStyles(popup, overlay))
    return
  }

  const remaining = Math.max(0, height - offset)
  const speed = Math.max(velocity, 1.2)
  const duration = Math.round(Math.min(280, Math.max(140, remaining / speed)))
  animateTo(state, height + 20, duration, CLOSE_EASING, async () => {
    popup.style.transition = "none"
    popup.style.animation = "none"
    overlay!.style.transition = "none"
    overlay!.style.animation = "none"
    overlay!.click()
    if (await waitUntilHidden(popup, 400)) {
      clearStyles(popup, overlay)
      return
    }
    popup.style.animation = ""
    overlay!.style.animation = ""
    animateTo(state, 0, 280, SETTLE_EASING, () => clearStyles(popup, overlay))
  })
}

export function setupPopupSwipeClose() {
  document.addEventListener("touchstart", onTouchStart, { passive: true })
  document.addEventListener("touchmove", onTouchMove, { passive: false })
  document.addEventListener("touchend", onTouchEnd)
  document.addEventListener("touchcancel", cancelDrag)
}
