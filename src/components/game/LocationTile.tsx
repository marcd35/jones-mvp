import type { CSSProperties } from 'react';
import type { Location, LocationType } from '@/types';
import {
  Building2,
  GraduationCap,
  Home,
  ShoppingCart,
  MapPin,
  Lock,
} from 'lucide-react';

interface LocationTileProps {
  location: Location;
  isCurrent: boolean;
  style: CSSProperties;
  onSelect: (id: string) => void;
}

const ICONS: Record<LocationType, typeof MapPin> = {
  work: Building2,
  education: GraduationCap,
  housing: Home,
  store: ShoppingCart,
  other: MapPin,
};

// One Location on the ring: a flat placeholder tile. Art can replace the
// contents without touching the layout.
export function LocationTile({
  location,
  isCurrent,
  style,
  onSelect,
}: LocationTileProps) {
  const closed = location.closed === true;
  const Icon = closed ? Lock : ICONS[location.type];

  return (
    <div data-cell="location" style={style} className="min-h-0 min-w-0 p-0.5">
      <button
        type="button"
        disabled={closed}
        onClick={() => onSelect(location.id)}
        className={`flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-md border p-0.5 text-center transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
          closed
            ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600'
            : isCurrent
              ? 'border-blue-500 bg-slate-700 text-white'
              : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 sm:h-6 sm:w-6" aria-hidden />
        <span className="text-[10px] leading-tight font-bold break-words sm:text-xs">
          {location.name}
        </span>
        {closed && (
          <span className="text-[9px] tracking-wide uppercase sm:text-[10px]">
            Closed
          </span>
        )}
      </button>
    </div>
  );
}
