import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

export function Button({
  className,
  variant = 'default',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition disabled:opacity-50',
        variant === 'default' && 'border border-[#2a3142] bg-[#161b26] hover:border-[#e11d48]',
        variant === 'primary' && 'bg-[#e11d48] text-white hover:bg-[#be123c]',
        variant === 'ghost' && 'bg-transparent hover:bg-[#161b26]',
        variant === 'danger' && 'border border-red-900 bg-red-950 hover:bg-red-900',
        className,
      )}
      {...props}
    />
  );
}
