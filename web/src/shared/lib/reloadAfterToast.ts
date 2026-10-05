// Reloading right after toast() tears the page down before the toast paints,
// so give the toast time to be seen first.
const TOAST_VISIBLE_MS = 1500

export function reloadAfterToast() {
  setTimeout(() => window.location.reload(), TOAST_VISIBLE_MS)
}
