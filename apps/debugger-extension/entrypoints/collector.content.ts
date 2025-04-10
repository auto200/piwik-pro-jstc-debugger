import { defineContentScript } from 'wxt/sandbox';
import { InternalMessage, Message } from '@/lib/messaging';

// proxy object created when JSTC is loaded
type _QueueProxy = { push: (args: unknown[]) => void };

function is_queueProxy(value: unknown): value is _QueueProxy {
  return typeof value === 'object' && value !== null && 'push' in value;
}

const sendMessage = (msg: Message | InternalMessage) => {
  window.postMessage(msg, '*');
};

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    sendMessage({
      source: 'JSTC_DBG',
      type: 'PAGE_METADATA',
      payload: { origin: location.origin },
    });
    function registerQueueListener({
      queueName,
      loadedEventType,
      messageEventType,
      objectName,
    }: {
      queueName: '_paq' | '_ppas';
      loadedEventType: 'JSTC_LOADED_PAQ' | 'JSTC_LOADED_PPAS';
      messageEventType: 'PAQ_ENTRY' | 'PPAS_ENTRY';
      objectName: 'Piwik' | 'PPAS';
    }) {
      let internal_queue: undefined | unknown[] | _QueueProxy;

      Object.defineProperty(window, queueName, {
        configurable: true,
        enumerable: true,

        set: function (value) {
          // ignore reassignment `_paq = _paq || []`
          if (internal_queue === value) {
            return;
          }
          // initialization `_paq = []`
          if (Array.isArray(value)) {
            internal_queue = value;
            return;
          }

          if (is_queueProxy(value)) {
            sendMessage({ type: loadedEventType, source: 'JSTC_DBG' });

            internal_queue = value;
            const originalPush = value.push;
            value.push = (args) => {
              if (!Array.isArray(args)) {
                console.log(`[JSTC DEBUGGER] some invalid value pushed to the ${queueName}`);
              } else {
                sendMessage({
                  type: messageEventType,
                  source: 'JSTC_DBG',
                  payload: {
                    data: args.map((e) => (typeof e === 'function' ? e.toString() : e)) as any,
                    stack: new Error().stack,
                  },
                });
              }
              originalPush(args);
            };
            return;
          }
          console.log(`some bogus amogus value assigned to "${queueName}":`, value);

          internal_queue = value;
        },
        get: function () {
          return internal_queue;
        },
      });

      let internalObjectName: undefined | Record<string, unknown>;
      // JSTC initialization
      Object.defineProperty(window, objectName, {
        configurable: true,
        enumerable: true,

        // First thing that JSTC does after loading and processing the queue is setting global
        // Piwik/PPAS object, when that object is defined we are sure that JSTC has loaded
        set: function (value) {
          if (Array.isArray(internal_queue)) {
            // TODO: send message that JSTC has been initialized
            internal_queue.forEach((args) => {
              if (!Array.isArray(args)) {
                return;
              }
              sendMessage({
                source: 'JSTC_DBG',
                type: messageEventType,
                payload: {
                  data: args.map((e) => (typeof e === 'function' ? e.toString() : e)) as any,
                  stack: new Error().stack,
                },
              });
            });
          }
          internalObjectName = value;
        },
        get: function () {
          return internalObjectName;
        },
      });
    }

    registerQueueListener({
      queueName: '_paq',
      loadedEventType: 'JSTC_LOADED_PAQ',
      messageEventType: 'PAQ_ENTRY',
      objectName: 'Piwik',
    });

    registerQueueListener({
      queueName: '_ppas',
      loadedEventType: 'JSTC_LOADED_PPAS',
      messageEventType: 'PPAS_ENTRY',
      objectName: 'PPAS',
    });
  },
});
