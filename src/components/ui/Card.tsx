import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Industrial Skeuomorphic Look:
        // - Thick border
        // - Subtle inner bevel (ring-inset)
        // - Flat background
        'border-base-700 bg-base-800 text-base-100 rounded-sm border-2 shadow-xl',
        'ring-1 ring-white/5',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export { Card };
