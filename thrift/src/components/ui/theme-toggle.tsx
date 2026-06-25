'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  /** Visual size variant */
  size?: 'sm' | 'md';
  /** Additional classes */
  className?: string;
}

export default function ThemeToggle({ size = 'md', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  // Avoid hydration mismatch — don't render icon until mounted on client
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  // Render a placeholder skeleton during SSR/hydration to prevent mismatch
  if (!mounted) {
    return (
      <div
        className={`${sizeClasses[size]} border border-hairline bg-panel flex items-center justify-center ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`${sizeClasses[size]} border border-hairline bg-panel hover:border-mustard/60 hover:bg-mustard/10 transition-all duration-200 flex items-center justify-center group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-mustard/40 ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      <span className="theme-icon-enter">
        {isDark ? (
          <Sun className={`${iconSize} text-mustard group-hover:rotate-12 transition-transform duration-300`} />
        ) : (
          <Moon className={`${iconSize} text-text-muted group-hover:-rotate-12 transition-transform duration-300`} />
        )}
      </span>
    </button>
  );
}
