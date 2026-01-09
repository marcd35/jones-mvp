import { Location } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  GraduationCap,
  Home,
  ShoppingCart,
  MapPin,
} from 'lucide-react';

interface LocationTileProps {
  location: Location;
  isCurrent: boolean;
  onMove: (id: string) => void;
  onInteract: () => void;
  disabled: boolean;
}

const ICONS = {
  work: Building2,
  education: GraduationCap,
  housing: Home,
  store: ShoppingCart,
};

export function LocationTile({
  location,
  isCurrent,
  onMove,
  onInteract,
  disabled,
}: LocationTileProps) {
  const Icon = ICONS[location.type] || MapPin;

  return (
    <Card
      className={`relative flex h-64 flex-col items-center justify-between p-6 transition-all duration-300 ${isCurrent ? 'bg-slate-800 ring-2 ring-blue-500' : 'opacity-80 hover:scale-105 hover:bg-slate-800 hover:opacity-100'}`}
    >
      {/* Visual Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={`rounded-full p-4 ${isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
        >
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">{location.name}</h3>
        <p className="line-clamp-2 text-xs text-slate-400">
          {location.description}
        </p>
      </div>

      {/* Action Area */}
      <div className="mt-4 w-full">
        {isCurrent ? (
          <Button
            onClick={onInteract}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Enter
          </Button>
        ) : (
          <Button
            onClick={() => onMove(location.id)}
            disabled={disabled}
            variant="secondary"
            className="w-full"
          >
            Travel Here (1hr)
          </Button>
        )}
      </div>

      {isCurrent && (
        <span className="absolute top-2 right-2 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
        </span>
      )}
    </Card>
  );
}
