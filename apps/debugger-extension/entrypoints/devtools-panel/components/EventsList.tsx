import { Ref } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getEventType, getPingType } from '@/lib/eventDetector';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowUpDown } from 'lucide-react';
import { Entry } from '../eventStore';

type EventsListProps = {
  msgs: Entry[];
  selectedMessage: Entry | undefined;
  setSelectedMessage: (msg: Entry | undefined) => void;
  ref: Ref<HTMLDivElement>;
};

export function EventsList({ ref, msgs, selectedMessage, setSelectedMessage }: EventsListProps) {
  return (
    <div ref={ref} className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-slate-100">
          <TableRow>
            <TableHead>Event name</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {msgs.map((msg) => (
            <EventEntryRow
              key={msg.id}
              msg={msg}
              selectedMessage={selectedMessage}
              setSelectedMessage={setSelectedMessage}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type EventEntryRowProps = {
  msg: Entry;
  selectedMessage: Entry | undefined;
  setSelectedMessage: (msg: Entry | undefined) => void;
};

function EventEntryRow({ msg, selectedMessage, setSelectedMessage }: EventEntryRowProps) {
  switch (msg.type) {
    case 'JSTC_LOADED_PAQ': {
      return (
        <TableRow>
          <TableCell colSpan={2} className="font-semibold text-green-600">
            JSTC LOADED (_paq)
          </TableCell>
        </TableRow>
      );
    }
    case 'JSTC_LOADED_PPAS': {
      return (
        <TableRow>
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
          onClick={() => setSelectedMessage(msg)}
          className={cn('cursor-default', {
            'bg-slate-300 hover:bg-slate-300': selectedMessage?.id === msg.id,
          })}
        >
          <TableCell className="flex items-center gap-1">
            <span>
              <ArrowUpDown
                className={msg.type === 'PAQ_NETWORK_EVENT' ? 'text-green-700' : 'text-purple-500'}
                size={18}
              />
            </span>
            {msg.type === 'PAQ_NETWORK_EVENT' ? '_paq ' : '_ppas'}
            {msg.payload.type === 'BATCH' ? (
              msg.payload.requestsParams.map((params, i) => {
                const eventType = getEventType(params);
                return (
                  <span
                    key={i}
                    className={cn(eventType === 'Broken Event' && 'font-bold text-red-600')}
                  >
                    {eventType === 'Ping' ? `Ping -> ${getPingType(params)}` : eventType}
                  </span>
                );
              })
            ) : (
              <span
                className={cn(
                  getEventType(msg.payload.params) === 'Broken Event' && 'font-bold text-red-600'
                )}
              >
                {getEventType(msg.payload.params) === 'Ping'
                  ? `Ping -> ${getPingType(msg.payload.params)}`
                  : getEventType(msg.payload.params)}
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
              <ArrowRight
                className={`${msg.type === 'PAQ_ENTRY' ? 'text-green-300' : 'text-purple-400'} opacity-80`}
                size={18}
              />
            </span>
            {msg.type === 'PAQ_ENTRY' ? '[_paq] ' : '[_ppas] '}
            <span>{msg.payload.data[0]}</span>
          </TableCell>
          <TableCell>{params.length === 0 ? '-' : JSON.stringify(params)}</TableCell>
        </TableRow>
      );
    }
    default: {
      // @ts-expect-error dummy check for now
      throw new Error(`unhandled event ${msg.type}`);
    }
  }
}
