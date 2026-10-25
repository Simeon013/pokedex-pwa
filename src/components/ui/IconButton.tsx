import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  badge?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton({ label, children, badge, className = '', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`glass relative grid size-11 shrink-0 place-items-center rounded-2xl transition-[background-color,transform] hover:bg-surface-2 active:scale-95 ${className}`}
      {...rest}
    >
      {children}
      {badge ? (
        <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] leading-5 font-bold text-accent-fg" aria-hidden>
          {badge}
        </span>
      ) : null}
    </button>
  );
});
