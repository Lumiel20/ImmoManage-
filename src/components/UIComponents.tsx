import React from 'react';
import { motion } from 'motion/react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

export function SidebarItem({ icon, label, active, onClick, badge }: SidebarItemProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group ${
        active 
          ? 'bg-indigo-500/10 text-white shadow-sm font-semibold pl-3' 
          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 pl-3'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="activeSidebarIndicator"
          className="absolute left-0 top-2 bottom-2 w-[3.5px] bg-indigo-500 rounded-r-md"
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        />
      )}
      <div className="flex items-center gap-3 relative z-10">
        <span className={`${active ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-300'} transition-colors duration-200`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        </span>
        {label}
      </div>
      {badge !== undefined && (
        <span className="bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 animate-pulse relative z-10">
          {badge}
        </span>
      )}
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: 'indigo' | 'cyan' | 'violet' | 'emerald' | 'rose';
}

export function StatCard({ label, value, color }: StatCardProps) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    cyan: 'from-cyan-500/10 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
    violet: 'from-violet-500/10 to-violet-500/5 text-violet-400 border-violet-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-400 border-rose-500/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`p-6 rounded-2xl bg-gradient-to-br border bg-neutral-900 ${colors[color]} relative overflow-hidden group shadow-md hover:shadow-lg`}
    >
      <div className="relative z-10">
        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{label}</p>
        <p className="text-3xl font-bold text-white tracking-tighter">{value}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
    </motion.div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: 'indigo' | 'neutral';
  onClick?: () => void;
}

export function ActionButton({ icon, label, color, onClick }: ActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
        color === 'indigo' 
          ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20' 
          : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
      }`}
    >
      <span className="p-1.5 bg-white/10 rounded-lg">{icon}</span>
      {label}
    </button>
  );
}
