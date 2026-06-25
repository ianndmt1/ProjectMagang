import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'panel';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-sans uppercase tracking-widest transition-all duration-200 font-semibold focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none rounded-[2px] select-none';

  const variants = {
    primary: 'bg-text-main text-bg border-[1.5px] border-text-main hover:bg-rust hover:border-rust hover:text-white active:scale-[0.98]',
    secondary: 'bg-tan text-bg border-[1.5px] border-tan hover:bg-text-main hover:border-text-main hover:text-white active:scale-[0.98]',
    outline: 'bg-transparent text-text-main border-[1.5px] border-text-main hover:border-rust hover:text-rust active:scale-[0.98]',
    panel: 'bg-panel text-text-main border border-border hover:bg-bg active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-2.5 text-[11px]',
    lg: 'px-8 py-3.5 text-xs',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
