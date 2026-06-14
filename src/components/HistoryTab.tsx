import React from 'react';
import { Trash2, Calendar, X, Plus, Edit, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { ActionLog } from '../types';

interface HistoryTabProps {
  setConfirmModal: (modal: any) => void;
  setActionLogs: React.Dispatch<React.SetStateAction<ActionLog[]>>;
  setToastMsg: (msg: string | null) => void;
  historyFilter: string;
  setHistoryFilter: (filter: string) => void;
  historyStartDate: string;
  setHistoryStartDate: (date: string) => void;
  historyEndDate: string;
  setHistoryEndDate: (date: string) => void;
  filteredLogs: ActionLog[];
}

export function HistoryTab({
  setConfirmModal,
  setActionLogs,
  setToastMsg,
  historyFilter,
  setHistoryFilter,
  historyStartDate,
  setHistoryStartDate,
  historyEndDate,
  setHistoryEndDate,
  filteredLogs,
}: HistoryTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
      className="space-y-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Activity Log</h2>
          <p className="text-neutral-400">Audit trail of system events and database operations.</p>
        </div>
        <button
          onClick={() => {
            setConfirmModal({
              isOpen: true,
              title: "Clear Activity history",
              message: "Are you sure you want to empty the activity log? This operation is irreversible.",
              onConfirm: () => {
                const defaultLog = [
                  {
                    id: 'log-default',
                    type: 'creation' as const,
                    target: 'contrat' as const,
                    title: 'Logs reference DB cleared',
                    description: 'Audit logs collection has been truncated or reset to first state.',
                    timestamp: "Just now",
                    date: new Date().toLocaleDateString()
                  }
                ];
                setActionLogs(defaultLog);
                localStorage.setItem('property_action_logs', JSON.stringify(defaultLog));
                setToastMsg("Activity logs have been successfully cleared!");
                setConfirmModal(null);
              }
            });
          }}
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold px-4 py-2.5 rounded-xl text-neutral-300 hover:text-white transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
        >
          <Trash2 className="w-4 h-4 text-neutral-400" />
          Clear Logs
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 bg-neutral-900 border border-neutral-800 rounded-2xl items-center shadow-md font-sans">
        {/* Left: Category Filters */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 font-bold tracking-wider font-mono uppercase">Filter by entity</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['all', 'contrat', 'bien', 'locataire'].map(f => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border capitalize cursor-pointer transition-all shrink-0 bg-transparent ${
                  historyFilter === f 
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-sm shadow-indigo-500/5 font-bold' 
                    : 'bg-neutral-950/40 text-neutral-400 border-neutral-850 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {f === 'all' ? 'All Activities' : f === 'locataire' ? 'Tenants' : f === 'bien' ? 'Properties' : 'Leases'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Date Range Selector */}
        <div className="lg:col-span-5 space-y-2.5 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 font-bold tracking-wider font-mono uppercase">Specific date span</span>
            {(historyStartDate || historyEndDate) && (
              <button 
                onClick={() => {
                  setHistoryStartDate('');
                  setHistoryEndDate('');
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-350 font-bold flex items-center gap-1 cursor-pointer transition-colors border-0 bg-transparent p-0"
              >
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 bg-neutral-950/60 p-2 rounded-xl border border-neutral-800 focus-within:border-neutral-700 transition-colors h-[38px]">
            <Calendar className="w-4 h-4 text-neutral-500 shrink-0 ml-1" />
            
            <div className="flex items-center gap-2 w-full text-xs">
              <input 
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="bg-transparent border-0 text-white placeholder-neutral-650 focus:ring-0 focus:outline-none w-full text-xs font-medium cursor-pointer [color-scheme:dark]"
                placeholder="Start"
              />
              
              <span className="text-neutral-600 font-bold text-xs shrink-0">-</span>
              
              <input 
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="bg-transparent border-0 text-white placeholder-neutral-650 focus:ring-0 focus:outline-none w-full text-xs font-medium cursor-pointer [color-scheme:dark]"
                placeholder="End"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-xl">
        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-neutral-500 italic text-sm font-sans animate-fade-in">No activities recorded matching the filters.</div>
        ) : (
          <div className="relative border-l border-neutral-800 pr-1 pl-6 ml-3 space-y-8 py-2 font-sans">
            {filteredLogs.map((log) => {
              let icon = <Plus className="w-3.5 h-3.5 text-emerald-400" />;
              let colorBg = 'bg-emerald-500/10 border-emerald-500/20';
              if (log.type === 'edition') {
                icon = <Edit className="w-3.5 h-3.5 text-amber-400" />;
                colorBg = 'bg-amber-500/10 border-amber-500/20';
              } else if (log.type === 'suppression') {
                icon = <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
                colorBg = 'bg-rose-500/10 border-rose-500/20';
              }

              return (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative space-y-1.5"
                >
                  <div className={`absolute -left-[37px] top-0.5 w-[22px] h-[22px] rounded-full border ${colorBg} flex items-center justify-center bg-neutral-900 shadow-sm z-10`}>
                    {icon}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-xs font-bold text-white tracking-tight">{log.title}</span>
                    <span className="text-[10px] text-neutral-500 font-semibold font-mono" title={log.date}>{log.timestamp} ({log.date})</span>
                  </div>
                  
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">{log.description}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
