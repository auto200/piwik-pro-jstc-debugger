import type { Ref } from 'react';
import { ArrowRight, ArrowUpDown, CircleX, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Filters } from '../App';

type HeaderProps = {
  ref: Ref<HTMLDivElement>;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  reset: () => void;
  onHardReload: () => void;
};

export function Header({ ref, filters, onFiltersChange, reset, onHardReload }: HeaderProps) {
  const handleFilterChange = (filter: Filters[number] | undefined) => {
    if (!filter) {
      onFiltersChange([]);
      return;
    }

    if (filters.includes(filter)) {
      onFiltersChange(filters.filter((f) => f !== filter));
      return;
    }

    onFiltersChange([...filters, filter]);
  };

  return (
    <div ref={ref} className="flex items-center overflow-hidden p-[2px]">
      <Button variant="outline" size="sm" onClick={reset} className="mr-1 h-7">
        <CircleX /> clear
      </Button>

      <Button variant="outline" size="sm" onClick={onHardReload} className="h-7">
        <RefreshCcw /> reload
      </Button>

      {/* filters */}
      <div className="ml-5 flex select-none items-center gap-1">
        <Badge
          variant="outline"
          className={cn(
            filters.length === 0 ? 'bg-blue-200' : 'hover:bg-slate-300',
            'cursor-pointer'
          )}
          onClick={() => handleFilterChange(undefined)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z" />
          </svg>
          All
        </Badge>
        <div className="h-4 w-[1px] bg-slate-600">⠀</div>
        <Badge
          variant="outline"
          className={cn(
            filters.includes('PAQ_ENTRY') ? 'bg-blue-200' : 'hover:bg-slate-300',
            'cursor-pointer'
          )}
          onClick={() => handleFilterChange('PAQ_ENTRY')}
        >
          <ArrowRight size={12} className="text-green-500" />
          _paq
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            filters.includes('PAQ_NETWORK_EVENT') ? 'bg-blue-200' : 'hover:bg-slate-300',
            'cursor-pointer'
          )}
          onClick={() => handleFilterChange('PAQ_NETWORK_EVENT')}
        >
          <ArrowUpDown size={12} className="text-green-700" /> _paq
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            filters.includes('PPAS_ENTRY') ? 'bg-blue-200' : 'hover:bg-slate-300',
            'cursor-pointer'
          )}
          onClick={() => handleFilterChange('PPAS_ENTRY')}
        >
          <ArrowRight size={12} className="text-purple-400" />
          _ppas
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            filters.includes('PPAS_NETWORK_EVENT') ? 'bg-blue-200' : 'hover:bg-slate-300',
            'cursor-pointer'
          )}
          onClick={() => handleFilterChange('PPAS_NETWORK_EVENT')}
        >
          <ArrowUpDown size={12} className="text-purple-500" /> _ppas
        </Badge>
      </div>
    </div>
  );
}
