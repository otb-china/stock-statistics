const BODY_SELECTOR = ".van-popup--bottom.van-popup--round > .popup-body"
const EDGE_TOLERANCE = 1

function updateShadow(body: HTMLElement) {
  const remaining = body.scrollHeight - body.clientHeight - body.scrollTop
  body.classList.toggle("is-scrolled", body.scrollTop > EDGE_TOLERANCE)
  body.classList.toggle("has-more", remaining > EDGE_TOLERANCE)
}

export function setupPopupScrollShadow() {
  let frame = 0
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const body = entry.target.closest<HTMLElement>(BODY_SELECTOR)
      if (body) updateShadow(body)
    })
  })

  const rescan = () => {
    frame = 0
    resizeObserver.disconnect()
    document.querySelectorAll<HTMLElement>(BODY_SELECTOR).forEach((body) => {
      resizeObserver.observe(body)
      Array.from(body.children).forEach((child) => resizeObserver.observe(child))
      updateShadow(body)
    })
  }

  new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(rescan)
  }).observe(document.body, { childList: true, subtree: true })

  document.addEventListener("scroll", (event) => {
    const target = event.target
    if (target instanceof HTMLElement && target.matches(BODY_SELECTOR)) updateShadow(target)
  }, { capture: true, passive: true })
}
