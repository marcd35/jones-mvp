import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary:
        'bg-retro-blue text-white hover:bg-blue-600 border-2 border-blue-800 shadow-lg',
      secondary:
        'bg-base-700 text-base-100 hover:bg-base-600 border-2 border-base-900',
      danger:
        'bg-retro-red text-white hover:bg-red-600 border-2 border-red-900 shadow-lg',
      ghost:
        'bg-transparent text-base-300 hover:text-base-100 hover:bg-base-800 border-2 border-transparent',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'focus-visible:ring-retro-blue inline-flex items-center justify-center rounded-sm px-4 py-2 text-sm font-bold transition-all focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          'tracking-wider uppercase',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
