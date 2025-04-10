import { InternalMessage, Message } from '@/lib/messaging';
import { defineContentScript } from 'wxt/sandbox';
import { sendMessage } from 'webext-bridge/content-script';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  main() {
    window.addEventListener('message', (ev: MessageEvent<Message | InternalMessage>) => {
      if (ev.data.source === 'JSTC_DBG') {
        sendMessage('JSTC_EVENT', ev.data, 'devtools');
      }
    });
  },
});
