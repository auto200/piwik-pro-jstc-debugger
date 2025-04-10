import { defineBackground } from 'wxt/sandbox';
import { onMessage } from 'webext-bridge/background';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  // browser.tabs seems to be not available in devtools panel in firefox
  onMessage('RELOAD', () => {
    return browser.tabs.reload();
  });
});
