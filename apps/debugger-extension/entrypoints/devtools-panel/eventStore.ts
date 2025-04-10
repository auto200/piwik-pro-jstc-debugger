import { Message } from '@/lib/messaging';
import { browser } from 'wxt/browser';
import { onMessage } from 'webext-bridge/devtools';

export type Entry = Message & { id: string };

type Listener = () => void;
let listeners: Listener[] = [];

let messages: Entry[] = [];
let pageOrigin = '';
const _paqTrackingEndpoints: string[] = [];
const _ppasTrackingEndpoints: string[] = [];

function paqNetworkHandler(request: any) {
  const msg = _paqTrackingEndpoints.includes(request.request.url)
    ? getNetworkEntry(request, 'PAQ_NETWORK_EVENT')
    : undefined;
  if (msg) {
    messages = [...messages, msg];
    emitChange();
  }
}
function ppasNetworkHandler(request: any) {
  const msg = _ppasTrackingEndpoints.includes(request.request.url)
    ? getNetworkEntry(request, 'PPAS_NETWORK_EVENT')
    : undefined;
  if (msg) {
    messages = [...messages, msg];
    emitChange();
  }
}

function handleJSTCLoaded(queueName: 'JSTC_LOADED_PAQ' | 'JSTC_LOADED_PPAS') {
  const queueTrackingEndpoints =
    queueName === 'JSTC_LOADED_PAQ' ? _paqTrackingEndpoints : _ppasTrackingEndpoints;
  const networkEventName: 'PAQ_NETWORK_EVENT' | 'PPAS_NETWORK_EVENT' =
    queueName === 'JSTC_LOADED_PAQ' ? 'PAQ_NETWORK_EVENT' : 'PPAS_NETWORK_EVENT';

  // reprocess queue
  const newMessages: Entry[] = [];
  for (const request of allRequests) {
    const msg = queueTrackingEndpoints.includes(request.request.url)
      ? getNetworkEntry(request, networkEventName)
      : undefined;
    if (msg) {
      newMessages.push(msg);
    }
  }
  if (newMessages.length) {
    messages = [...messages, ...newMessages];
    emitChange();
  }
  if (queueName === 'JSTC_LOADED_PAQ') {
    browser.devtools.network.onRequestFinished.removeListener(paqNetworkHandler);
    browser.devtools.network.onRequestFinished.addListener(paqNetworkHandler);
  } else {
    browser.devtools.network.onRequestFinished.removeListener(ppasNetworkHandler);
    browser.devtools.network.onRequestFinished.addListener(ppasNetworkHandler);
  }
}

onMessage('JSTC_EVENT', function ({ data: msg }) {
  if (msg.source !== 'JSTC_DBG') return;
  if (msg.type === 'PAGE_METADATA') {
    pageOrigin = msg.payload.origin;
    allRequests.length = 0;
    return;
  }

  messages = [...messages, { ...msg, id: crypto.randomUUID() }];
  emitChange();

  if (msg.type === 'JSTC_LOADED_PAQ' || msg.type === 'JSTC_LOADED_PPAS') {
    handleJSTCLoaded(msg.type);
    return;
  }

  if (msg.type !== 'PAQ_ENTRY' && msg.type !== 'PPAS_ENTRY') return;

  const [name, trackerUrl] = msg.payload.data;
  if (name !== 'setTrackerUrl') return;
  if (typeof trackerUrl !== 'string') return;

  let parsedUrl = '';

  if (trackerUrl.startsWith('//')) {
    parsedUrl = new URL(pageOrigin).protocol + trackerUrl;
  } else if (trackerUrl.startsWith('/')) {
    parsedUrl = pageOrigin + trackerUrl;
  } else if (trackerUrl.startsWith('http')) {
    parsedUrl = trackerUrl;
  } else {
    parsedUrl = new URL(pageOrigin).origin + '/' + trackerUrl;
  }

  if (!parsedUrl) return;

  if (msg.type === 'PAQ_ENTRY') {
    if (!_paqTrackingEndpoints.includes(parsedUrl)) {
      _paqTrackingEndpoints.push(parsedUrl);
    }
  } else {
    if (!_ppasTrackingEndpoints.includes(parsedUrl)) {
      _ppasTrackingEndpoints.push(parsedUrl);
    }
  }
  return;
});

const allRequests: any[] = [];

browser.devtools.network.onRequestFinished.addListener((request: any) => {
  allRequests.push(request);
});

export const eventStore = {
  subscribe: (listener: Listener) => {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
  getSnapshot: () => {
    return messages;
  },
  clear: () => {
    messages = [];
    pageOrigin = '';
    allRequests.length = 0;
    emitChange();
    // browser.devtools.network.onRequestFinished.removeListener(paqNetworkHandler);
    // browser.devtools.network.onRequestFinished.removeListener(ppasNetworkHandler);
  },
};

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getNetworkEntry(
  request: any,
  eventType: 'PAQ_NETWORK_EVENT' | 'PPAS_NETWORK_EVENT'
): Entry {
  const isBatchRequest = request.request.postData?.text.startsWith('{"requests":[');

  if (isBatchRequest) {
    return {
      source: 'JSTC_DBG',
      type: eventType,
      payload: {
        type: 'BATCH',
        url: request.request.url,
        requestsParams: (JSON.parse(request.request.postData?.text).requests as string[]).map((r) =>
          [...new URLSearchParams(r).entries()].map(([name, value]) => ({ name, value }))
        ),
      },
      id: crypto.randomUUID(),
    };
  } else {
    return {
      source: 'JSTC_DBG',
      type: eventType,
      payload: {
        type: 'SINGLE',
        url: request.request.url,
        params: request.request.postData?.params ?? [],
      },
      id: crypto.randomUUID(),
    };
  }
}
