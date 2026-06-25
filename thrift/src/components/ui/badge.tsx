import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'rust' | 'olive' | 'mustard' | 'outline';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-panel text-text-main border border-hairline',
    rust: 'bg-rust/10 text-rust border border-rust/30',
    olive: 'bg-olive/10 text-olive border border-olive/30',
    mustard: 'bg-mustard/10 text-mustard border border-mustard/30',
    outline: 'bg-transparent text-text-muted border border-hairline',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
