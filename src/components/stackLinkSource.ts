import type {StackLinkSource} from './stackState';

/** Subscribe first; a live URL wins over a slower initial URL query. */
export function observeStackLinks(
  source: StackLinkSource,
  receive: (url: string) => void,
  handleInitialURL = true,
): () => void {
  let active = true;
  let receivedURL = false;
  const unsubscribe = source.subscribe(url => {
    receivedURL = true;
    if (active) receive(url);
  });
  if (handleInitialURL) {
    // Defer the call so synchronous provider failures also become rejections.
    void Promise.resolve().then(() => active ? source.getInitialURL() : null).then(url => {
      if (active && !receivedURL && url) receive(url);
    }).catch(() => { /* Leave the current history intact if the source is unavailable. */ });
  }
  return () => { active = false; unsubscribe(); };
}
