import { ComponentRef, useEffect, useRef, useState } from 'react';
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
import { ArrowRight, ArrowUpDown, CircleX, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Entry = Message & { id: string };

export function App() {
  const [msgs, setMsgs] = useState<Entry[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Entry | undefined>();

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
        console.log(e.key);
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

  console.log(localStorage);

  return (
    <div ref={containerRef}>
      {/* header */}
      <div ref={headerRef}>
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
      </div>
      {/* content */}
      <PanelGroup direction="horizontal" autoSaveId="JSTC_DBG_PANELS">
        {/* left panel */}
        <Panel order={1} minSize={25}>
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event name</TableHead>
                  <TableHead>Payload</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {msgs.map((msg, i) => {
                  switch (msg.type) {
                    case 'JSTC_LOADED': {
                      return (
                        <TableRow key={i}>
                          <TableCell colSpan={2} className="font-semibold text-purple-500">
                            JSTC LOADED
                          </TableCell>
                        </TableRow>
                      );
                    }
                    case 'NETWORK_EVENT': {
                      const eventType = getEventType(msg.payload.params);
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
                              <ArrowUpDown className="text-blue-300" size={18} />
                            </span>{' '}
                            <span
                              className={cn(
                                eventType === 'Broken Event' && 'font-bold text-red-600'
                              )}
                            >
                              {eventType}
                            </span>
                          </TableCell>
                          <TableCell>{msg.payload.url}</TableCell>
                        </TableRow>
                      );
                    }
                    case 'PAQ_ENTRY': {
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
                            </span>{' '}
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
              <div className="h-full overflow-auto bg-red-200 p-2">
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMessage(undefined)}>
                    <XCircle />
                  </Button>
                </div>
                {selectedMessage.type === 'PAQ_ENTRY' ? (
                  <>
                    <div>
                      Event name{' '}
                      <span className="font-bold">{selectedMessage.payload.data[0]}</span>
                    </div>
                    <div>
                      parameters:{' '}
                      {JSON.stringify(
                        selectedMessage.payload.data.slice(1, selectedMessage.payload.data.length)
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="font-bold">Why was this event triggered?</div>
                      <pre>
                        {selectedMessage.payload.stack
                          ?.split('\n')
                          .slice(1, selectedMessage.payload.stack.split('\n').length)
                          .join('\n')}
                      </pre>
                    </div>
                  </>
                ) : selectedMessage.type === 'NETWORK_EVENT' ? (
                  <div>
                    network event:{' '}
                    <span className="font-bold">
                      {getEventType(selectedMessage.payload.params)}
                    </span>
                    <div>
                      {selectedMessage.payload.params.map((e, i) => (
                        <div key={i}>
                          {e.name}: <span className="font-bold">{e.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
