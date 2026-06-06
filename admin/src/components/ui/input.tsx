import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-red-900/80 bg-[#0f0303]/80 px-3 py-2 text-sm text-orange-50 placeholder:text-red-300/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
