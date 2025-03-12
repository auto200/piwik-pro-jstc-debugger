import { Fragment, ComponentRef, useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import '@/assets/tailwind.css';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Message } from '@/lib/messaging';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getEventType } from '@/lib/eventDetector';
import { ArrowRight, ArrowUpDown, CircleX, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useExtensionVersionMaybeNotLatest } from './hooks/useExtensionVersionMaybeNotLatest';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

type Entry = Message & { id: string };

export function App() {
  const [msgs, setMsgs] = useState<Entry[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Entry | undefined>();
  const extensionMaybeNotLatest = useExtensionVersionMaybeNotLatest();

  const containerRef = useRef<ComponentRef<'div'>>(null);
  const headerRef = useRef<ComponentRef<'div'>>(null);

  useEffect(() => {
    const port = browser.runtime.connect({ name: 'devtools' });

    port.onMessage.addListener(function (msg) {
      console.log('[panel]: Message from background script:', msg);

      setMsgs((msgs) => [...msgs, { ...(msg as any), id: crypto.randomUUID() }]);
    });

    const abortController = new AbortController();
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape' || e.key === '`') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setSelectedMessage(undefined);
        }
      },
      { signal: abortController.signal }
    );

    function handleResize() {
      if (headerRef.current && containerRef.current) {
        const headerHeight = headerRef.current.getBoundingClientRect().height;
        containerRef.current.style.height = `${window.innerHeight - headerHeight - 1}px`;
      }
    }

    window.addEventListener('resize', handleResize, { signal: abortController.signal });
    handleResize();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div ref={containerRef}>
      {/* header */}
      <div ref={headerRef} className="flex">
        <Button
          variant="outline"
          onClick={() => {
            setMsgs([]);
            setSelectedMessage(undefined);
          }}
        >
          <CircleX />
          <span>reset</span>
        </Button>

        {extensionMaybeNotLatest && (
          <div className="ml-auto mr-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" className="bg-yellow-300 hover:bg-yellow-200" asChild>
                    <a
                      href="https://github.com/auto200/piwik-pro-jstc-debugger/releases"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Info />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Your extension: <b>{extensionMaybeNotLatest.current}</b> may be outdated. Latest
                  version: <b>{extensionMaybeNotLatest.latest}</b>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      {/* content */}
      <PanelGroup direction="horizontal" autoSaveId="JSTC_DBG_PANELS">
        {/* left panel */}
        <Panel order={1} minSize={25}>
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-100">
                <TableRow>
                  <TableHead>Event name</TableHead>
                  <TableHead>Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {msgs.map((msg, i) => {
                  switch (msg.type) {
                    case 'JSTC_LOADED_PAQ': {
                      return (
                        <TableRow key={i}>
                          <TableCell colSpan={2} className="font-semibold text-green-600">
                            JSTC LOADED (_paq)
                          </TableCell>
                        </TableRow>
                      );
                    }
                    case 'JSTC_LOADED_PPAS': {
                      return (
                        <TableRow key={i}>
                          <TableCell colSpan={2} className="font-semibold text-purple-600">
                            JSTC LOADED (_ppas)
                          </TableCell>
                        </TableRow>
                      );
                    }
                    case 'PAQ_NETWORK_EVENT':
                    case 'PPAS_NETWORK_EVENT': {
                      return (
                        <TableRow
                          key={i}
                          onClick={() => setSelectedMessage(msg)}
                          className={cn('cursor-default', {
                            'bg-slate-300 hover:bg-slate-300': selectedMessage?.id === msg.id,
                          })}
                        >
                          <TableCell className="flex items-center gap-1">
                            <span>
                              <ArrowUpDown className="text-green-700" size={18} />
                            </span>
                            {msg.type === 'PAQ_NETWORK_EVENT' ? '_paq ' : '_ppas'}
                            {msg.payload.type === 'BATCH' ? (
                              msg.payload.requestsParams.map((params, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    getEventType(params) === 'Broken Event' &&
                                      'font-bold text-red-600'
                                  )}
                                >
                                  {getEventType(params)}
                                </span>
                              ))
                            ) : (
                              <span
                                className={cn(
                                  getEventType(msg.payload.params) === 'Broken Event' &&
                                    'font-bold text-red-600'
                                )}
                              >
                                {getEventType(msg.payload.params)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{msg.payload.url}</TableCell>
                        </TableRow>
                      );
                    }
                    case 'PAQ_ENTRY':
                    case 'PPAS_ENTRY': {
                      const params = msg.payload.data.slice(1, msg.payload.data.length);
                      return (
                        <TableRow
                          key={i}
                          onClick={() => setSelectedMessage(msg)}
                          className={cn('cursor-default', {
                            'bg-slate-300 hover:bg-slate-300': selectedMessage?.id === msg.id,
                          })}

                          // onClick={() => {
                          //   browser.devtools.panels.openResource(
                          //     'chrome-extension://lheofohbkhphjehlmohenmocgcojbalm/content-scripts/collector.js',
                          //     67,
                          //     44
                          //   );
                          // }}
                        >
                          <TableCell className="flex items-center gap-1">
                            <span>
                              <ArrowRight className="text-green-300 opacity-80" size={18} />
                            </span>
                            {msg.type === 'PAQ_ENTRY' ? '[_paq] ' : '[_ppas] '}
                            <span>{msg.payload.data[0]}</span>
                          </TableCell>
                          <TableCell>
                            {params.length === 0 ? '-' : JSON.stringify(params)}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    default: {
                      // @ts-expect-error dummy check for now
                      throw new Error(`unhandled event ${msg.type}`);
                    }
                  }
                })}
              </TableBody>
            </Table>
          </div>
        </Panel>
        {/* right panel */}
        {selectedMessage && (
          <>
            <PanelResizeHandle className="basis-[0.15rem] bg-slate-400" />
            <Panel order={2}>
              <div className="h-full overflow-auto bg-slate-100">
                <div className="sticky top-0 border-b-2 border-slate-300 bg-slate-100">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(undefined)}>
                    <XCircle />
                  </Button>
                </div>
                <div className="p-2">
                  {(selectedMessage.type === 'PAQ_NETWORK_EVENT' ||
                    selectedMessage.type === 'PPAS_NETWORK_EVENT') &&
                    selectedMessage.payload.type === 'BATCH' && (
                      <div className="my-3 font-bold">
                        <p>Batch of events</p>
                        <p>Count: {selectedMessage.payload.requestsParams.length}</p>
                      </div>
                    )}
                  {(() => {
                    switch (selectedMessage.type) {
                      case 'PAQ_ENTRY':
                      case 'PPAS_ENTRY': {
                        return (
                          <>
                            <div>
                              Event name{' '}
                              <span className="font-bold">{selectedMessage.payload.data[0]}</span>
                            </div>
                            <div>
                              parameters:{' '}
                              {JSON.stringify(
                                selectedMessage.payload.data.slice(
                                  1,
                                  selectedMessage.payload.data.length
                                )
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="font-bold">What triggered this event?</div>
                              <pre>
                                {selectedMessage.payload.stack
                                  ?.split('\n')
                                  .slice(1, selectedMessage.payload.stack.split('\n').length)
                                  .join('\n')}
                              </pre>
                            </div>
                          </>
                        );
                      }
                      case 'PAQ_NETWORK_EVENT':
                      case 'PPAS_NETWORK_EVENT': {
                        if (selectedMessage.payload.type === 'SINGLE') {
                          return (
                            <div>
                              network event:{' '}
                              <span className="font-bold">
                                {getEventType(selectedMessage.payload.params)}
                              </span>
                              {getEventType(selectedMessage.payload.params) === 'Broken Event' &&
                                selectedMessage.payload.params.length == 0 && (
                                  <div className="mt-2 font-bold">
                                    This may be Last heartbeat ping, these are currently not
                                    supported and displayed as broken events.
                                  </div>
                                )}
                              <div>
                                {selectedMessage.payload.params.map((e, i) => (
                                  <div key={i}>
                                    {e.name}: <span className="font-bold">{e.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          return selectedMessage.payload.requestsParams.map((params, i) => (
                            <Fragment key={i}>
                              <div>
                                network event:{' '}
                                <span className="font-bold">{getEventType(params)}</span>
                                {getEventType(params) === 'Broken Event' && params.length == 0 && (
                                  <div className="mt-2 font-bold">
                                    This may be Last heartbeat ping, these are currently not
                                    supported and displayed as broken events.
                                  </div>
                                )}
                                <div>
                                  {params.map((e, i) => (
                                    <div key={i}>
                                      {e.name}: <span className="font-bold">{e.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <Separator className="my-3" />
                            </Fragment>
                          ));
                        }
                      }
                      default: {
                        return null;
                      }
                    }
                  })()}
                </div>
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
