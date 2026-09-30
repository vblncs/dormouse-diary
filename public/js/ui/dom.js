// Small DOM helpers.

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for use inside HTML markup and attributes. */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** querySelector shorthand. */
export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

let toastTimer;
/**
 * Shows a short message at the bottom of the screen, optionally with one action button
 * (e.g. "Undo"). Messages with an action stay a little longer so there is time to tap it.
 * @param {string} message
 * @param {{ label: string, onClick: () => void }} [action]
 */
export function showToast(message, action) {
  const element = qs("#toast");
  if (!element) return;
  element.innerHTML = `<span>${escapeHtml(message)}</span>${
    action ? `<button type="button" class="toast-action">${escapeHtml(action.label)}</button>` : ""
  }`;
  element.hidden = false;
  const hide = () => (element.hidden = true);
  if (action) {
    qs(".toast-action", element).addEventListener("click", () => {
      hide();
      action.onClick();
    });
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hide, action ? 6000 : 2600);
}

/** Hides the message, e.g. when a panel opens (it would cover the panel's buttons). */
export function hideToast() {
  const element = qs("#toast");
  if (element) element.hidden = true;
  clearTimeout(toastTimer);
}

/** Calls `fn` once typing has paused for `wait` ms; `flush()` runs a pending call immediately. */
export function debounce(fn, wait = 500) {
  let timer = null;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
  debounced.flush = () => {
    if (timer == null) return;
    clearTimeout(timer);
    timer = null;
    fn();
  };
  return debounced;
}
