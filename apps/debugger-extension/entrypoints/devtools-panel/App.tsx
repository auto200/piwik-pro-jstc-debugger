import {
  ComponentRef,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Header } from './components/Header';
import { Entry, eventStore } from './eventStore';
import { EventsList } from './components/EventsList';
import { EventDetails } from './components/EventDetails';
import { EventsSummary } from './components/EventsSummary';
import { useEventsListAutoscroll } from './hooks/useEventsListAutoscroll';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { sendMessage } from 'webext-bridge/devtools';

export type Filters = Array<
  'PAQ_ENTRY' | 'PPAS_ENTRY' | 'PAQ_NETWORK_EVENT' | 'PPAS_NETWORK_EVENT'
>;

export function App() {
  const _msgs = useSyncExternalStore(eventStore.subscribe, eventStore.getSnapshot);
  const [selectedMessage, setSelectedMessage] = useState<Entry | undefined>();
  const [filters, setFilters] = useState<Filters>([]);

  const containerRef = useRef<ComponentRef<'div'>>(null);
  const headerRef = useRef<ComponentRef<'div'>>(null);
  const msgs = useMemo(() => {
    if (filters.length === 0) return _msgs;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return _msgs.filter((msg) => filters.includes(msg.type));
  }, [_msgs, filters]);
  const { eventListContainerRef } = useEventsListAutoscroll(msgs, filters);

  useLayoutEffect(() => {
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

  const handleHardReload = async () => {
    setSelectedMessage(undefined);
    setFilters([]);
    eventStore.clear();
    sendMessage('RELOAD', undefined, 'background');
  };

  return (
    <div ref={containerRef}>
      <Header
        ref={headerRef}
        filters={filters}
        onFiltersChange={(filters) => {
          setSelectedMessage(undefined);
          setFilters(filters);
        }}
        reset={() => {
          eventStore.clear();
          setSelectedMessage(undefined);
        }}
        onHardReload={handleHardReload}
      />

      <PanelGroup direction="horizontal" autoSaveId="JSTC_DBG_PANELS">
        <Panel order={1} id="event-list" minSize={25} className="flex flex-col">
          {_msgs.length ? (
            <>
              <EventsList
                ref={eventListContainerRef}
                msgs={msgs}
                selectedMessage={selectedMessage}
                setSelectedMessage={setSelectedMessage}
              />
              <EventsSummary msgs={msgs} />
            </>
          ) : (
            <div className="flex flex-col items-center p-3">
              <div className="text-xl font-bold">Waiting for messages</div>
              <div className="text-center text-sm">
                If this message does not disappear, check if Piwik PRO is set up, or try reloading
                the page
              </div>
              <Button className="mt-3" variant="secondary" onClick={handleHardReload}>
                <RefreshCcw /> Reload page
              </Button>
            </div>
          )}
        </Panel>

        {selectedMessage && (
          <>
            <PanelResizeHandle className="basis-[0.15rem] bg-slate-400" />
            <Panel order={2} id="event-details">
              <EventDetails
                selectedMessage={selectedMessage}
                onClose={() => setSelectedMessage(undefined)}
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
