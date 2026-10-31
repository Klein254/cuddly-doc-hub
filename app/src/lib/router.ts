import { useSyncExternalStore } from 'react';

const read = () => window.location.hash.replace(/^#\/?/, '');

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

/** Current route without the leading "#/", e.g. "invoice" or "doc/<id>". */
export const useRoute = () => useSyncExternalStore(subscribe, read);

export const go = (path: string) => {
  window.location.hash = '/' + path;
};

export const back = (fallback: string) => {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
};
