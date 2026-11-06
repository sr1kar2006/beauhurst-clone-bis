import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'outline' | 'yellow' | 'ghost';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: 'md' | 'sm'; tourKey?: string }

const styles: Record<Variant, string> = {
  primary: 'bg-primary text-white border border-primary hover:bg-primary-hover hover:border-primary-hover disabled:bg-[#BDBDBD] disabled:border-[#BDBDBD] disabled:cursor-not-allowed',
  outline: 'bg-white text-primary border border-primary hover:bg-primary-light disabled:opacity-50',
  yellow: 'bg-tour-yellow text-ink border border-ink hover:brightness-95',
  ghost: 'bg-transparent text-primary border border-transparent hover:underline',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = 'primary', size = 'md', className = '', tourKey, ...rest }, ref) {
  const h = size === 'md' ? 'h-[30px] px-[15px] text-[15px]' : 'h-[26px] px-[10px] text-[13px]';
  return (
    <button
      ref={ref}
      type="button"
      data-tour={tourKey}
      className={`inline-flex items-center justify-center gap-1.5 rounded-btn font-semibold whitespace-nowrap transition-colors ${h} ${styles[variant]} ${className}`}
      {...rest}
    />
  );
});
