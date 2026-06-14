import React from 'react';
import { Plus, AlertTriangle, CheckCircle2, Clock, Bell, Printer, Paperclip, Edit, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Lease } from '../types';
import { ContratRowSkeleton } from './Skeletons';

interface LeasesTabProps {
  openNewContrat: () => void;
  expiringBails: any[];
  notifiedContrats: number[];
  handleSendExpiryNotification: (c: any, daysRemaining: number) => void;
  loadingContrats: boolean;
  contrats: Lease[];
  formatPrice: (amount: number | null | undefined, rawOnlySymbol?: boolean) => string;
  handlePrintContrat: (contrat: Lease) => void;
  openDocModal: (contrat: Lease) => void;
  openEditContrat: (contrat: Lease) => void;
  handleDeleteContrat: (id: number) => void;
}

export function LeasesTab({
  openNewContrat,
  expiringBails,
  notifiedContrats,
  handleSendExpiryNotification,
  loadingContrats,
  contrats,
  formatPrice,
  handlePrintContrat,
  openDocModal,
  openEditContrat,
  handleDeleteContrat
}: LeasesTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
      className="space-y-6"
    >
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white tracking-tight">Leases</h2>
        <button onClick={() => openNewContrat()} className="bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer text-sans">
          <Plus className="w-4 h-4" /> New Lease
        </button>
      </header>

      {/* Alerte Expiration de Lease Banner */}
      {expiringBails.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-neutral-900 border border-amber-500/20 hover:border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-xl shadow-amber-500/5 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/25 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                  Imminent Lease Expiration warning
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    {expiringBails.length} active lease{expiringBails.length > 1 ? 's' : ''} concerned
                  </span>
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                  The following housing leases are about to expire. Click "Notify" to register/trigger the regulatory warning alert.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {expiringBails.map(c => {
              const isAlreadyNotified = notifiedContrats.includes(c.id);
              const isOverdueDate = c.daysRemaining < 0;
              
              return (
                <div key={c.id} className="bg-neutral-950/40 border border-neutral-800 hover:border-neutral-700/60 rounded-xl p-4 flex flex-col justify-between gap-3 text-xs transition-all duration-300 shadow-md">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                       <span className="font-bold text-white text-sm tracking-tight truncate max-w-[70%] font-sans">{c.bien_titre}</span>
                       <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                        isOverdueDate 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : c.daysRemaining === 7 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                       }`}>
                         {isOverdueDate 
                           ? `Expired ${Math.abs(c.daysRemaining)}d ago` 
                           : c.daysRemaining === 0 
                             ? "Today" 
                             : `${c.daysRemaining} days left`
                         }
                       </span>
                    </div>
                    <div className="space-y-1 font-sans">
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                        <span className="text-neutral-500">Tenant:</span>
                        <span className="text-neutral-300 font-medium font-mono truncate">{c.locataire_email || 'Not specified'}</span>
                      </p>
                      <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                        <span className="text-neutral-500">End date:</span>
                        <span className="text-neutral-300 font-mono">{c.date_fin ? new Date(c.date_fin).toLocaleDateString() : 'Not specified'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-850/60 pt-3 mt-1">
                    {isAlreadyNotified ? (
                      <>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 flex items-center gap-1.5 opacity-90 select-none">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Notification sent
                        </span>
                        <span className="text-[10px] text-emerald-500 font-mono font-medium">Processed</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5 select-none font-sans">
                          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          Action Required
                        </span>
                        <button
                          onClick={() => handleSendExpiryNotification(c, c.daysRemaining)}
                          className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold px-3.5 py-1.5 rounded-xl text-[11px] transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/15 font-sans"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          Notify
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {!loadingContrats && contrats.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 italic font-sans animate-fade-in">No leases found.</div>
        ) : (
          <div className="overflow-x-auto w-full scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[750px] md:min-w-0 font-sans">
              <thead>
                <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Terms</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm">
                {loadingContrats ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <ContratRowSkeleton key={i} />
                  ))
                ) : (
                  contrats.map(contrat => (
                    <tr key={contrat.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{contrat.bien_titre}</td>
                      <td className="px-6 py-4 capitalize">{contrat.type === 'bail' ? 'Rent' : contrat.type === 'vente' ? 'Sale' : contrat.type}</td>
                      <td className="px-6 py-4 font-mono text-xs">{contrat.locataire_email || 'N/A'}</td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {contrat.date_debut ? new Date(contrat.date_debut).toLocaleDateString() : 'N/A'} - <br/>
                        {contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString() : 'Ongoing'}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {contrat.type === 'vente' ? formatPrice(contrat.prix_vente) : `${formatPrice(contrat.loyer_mensuel)}/mo`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          contrat.statut === 'actif' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {contrat.statut === 'actif' ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handlePrintContrat(contrat)} className="text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Print/Export PDF">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDocModal(contrat)} className="text-indigo-400 hover:bg-indigo-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="GED Documents">
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditContrat(contrat)} className="text-amber-400 hover:bg-amber-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteContrat(contrat.id)} className="text-rose-500 hover:bg-rose-500/10 p-2 rounded-lg transition-colors cursor-pointer" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
