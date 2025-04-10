import { ArrowRight, ArrowUpDown } from 'lucide-react';
import { Entry } from '../eventStore';

type EventsSummaryProps = {
  msgs: Entry[];
};

export function EventsSummary({ msgs }: EventsSummaryProps) {
  const relevantMsgs = msgs.filter(
    (msg) =>
      msg.type === 'PAQ_ENTRY' ||
      msg.type === 'PAQ_NETWORK_EVENT' ||
      msg.type === 'PPAS_ENTRY' ||
      msg.type === 'PPAS_NETWORK_EVENT'
  );

  return (
    <div className="flex cursor-default items-center gap-2 overflow-hidden border-t-2 px-2 py-[5px]">
      <div className="whitespace-nowrap" title="Total number of events">
        {relevantMsgs.length} events
      </div>

      <div className="h-[90%] w-[1px] select-none border-r-2 bg-black"></div>

      <div className="flex items-center gap-[2px] whitespace-nowrap" title="_paq pushes">
        <ArrowRight className="text-green-300 opacity-80" size={18} />
        {relevantMsgs.filter((msg) => msg.type === 'PAQ_ENTRY').length} _paq
      </div>

      <div className="h-[90%] w-[1px] select-none border-r-2 bg-black"></div>

      <div className="flex items-center gap-[2px] whitespace-nowrap" title="_paq network requests">
        <ArrowUpDown className="text-green-700" size={18} />
        {relevantMsgs.filter((msg) => msg.type === 'PAQ_NETWORK_EVENT').length} requests
      </div>

      <div className="h-[90%] w-[1px] select-none border-r-2 bg-black"></div>

      <div className="flex items-center gap-[2px] whitespace-nowrap" title="_ppas pushes">
        <ArrowRight className="select-none text-purple-400" size={18} />
        {relevantMsgs.filter((msg) => msg.type === 'PPAS_ENTRY').length} _ppas
      </div>

      <div className="h-[90%] w-[1px] select-none border-r-2 bg-black"></div>

      <div className="flex items-center gap-[2px] whitespace-nowrap" title="_ppas network requests">
        <ArrowUpDown className="text-purple-700 opacity-80" size={18} />
        {relevantMsgs.filter((msg) => msg.type === 'PPAS_NETWORK_EVENT').length} requests
      </div>
    </div>
  );
}
