import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-[#2a3142] bg-[#0e1118] px-3 py-2 text-sm outline-none focus:border-[#e11d48]',
        className,
      )}
      {...props}
    />
  );
}
