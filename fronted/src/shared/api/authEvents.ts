const UNAUTHORIZED_EVENT = 'auth:unauthorized';

export function emitUnauthorizedEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function subscribeUnauthorizedEvent(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  window.addEventListener(UNAUTHORIZED_EVENT, listener);
  return () => {
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  };
}

export { UNAUTHORIZED_EVENT };





