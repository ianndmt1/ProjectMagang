'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  color = 'indigo',
}: StatsCardProps) {
  
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
      iconBg: 'bg-indigo-500/10 text-indigo-500',
    },
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
      iconBg: 'bg-emerald-500/10 text-emerald-500',
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
      iconBg: 'bg-amber-500/10 text-amber-500',
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
      iconBg: 'bg-rose-500/10 text-rose-500',
    },
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Light glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {value}
          </span>
        </div>
        <div className={`p-2.5 rounded-xl ${selectedColor.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
          {trend && (
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                trend.type === 'positive'
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  : trend.type === 'negative'
                  ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                  : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtext && (
            <span className="text-xs font-medium text-slate-400">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
