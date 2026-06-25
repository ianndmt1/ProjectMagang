import React from 'react';

interface GradeStampProps {
  grade: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'vintage' | 'flat';
}

export default function GradeStamp({ grade, className = "", size = 'md', variant = 'vintage' }: GradeStampProps) {
  const sizeClasses = {
    sm: 'w-11 h-11 text-[9px]',
    md: 'w-16 h-16 text-xs',
    lg: 'w-24 h-24 text-base'
  };

  // Pseudo-random minor rotation based on the grade to make stamps look organic
  const rotationDegrees = (grade % 7) - 3.5;

  const baseClasses = variant === 'flat'
    ? `rounded-full border border-stone-300 text-stone-700 font-mono flex flex-col items-center justify-center font-bold tracking-wider leading-none select-none uppercase bg-stone-50 transition-transform duration-300 hover:scale-105`
    : `rounded-full border-2 border-dashed border-mustard/60 text-mustard font-mono flex flex-col items-center justify-center font-bold tracking-wider leading-none select-none uppercase bg-bg/95 backdrop-blur-xs transition-transform duration-300 hover:scale-105`;

  return (
    <div
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={{ transform: `rotate(${rotationDegrees}deg)` }}
    >
      <span className={variant === 'flat' ? "opacity-60 text-[7px] tracking-widest mb-0.5 text-stone-500" : "opacity-60 text-[7px] tracking-widest mb-0.5"}>COND.</span>
      <span className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-xl'} font-bold`}>{grade}%</span>
      <span className={variant === 'flat' ? "opacity-60 text-[6px] tracking-tighter mt-0.5 text-stone-500" : "opacity-60 text-[6px] tracking-tighter mt-0.5"}>APPROVED</span>
    </div>
  );
}
