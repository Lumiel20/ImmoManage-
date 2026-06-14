import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, X, FileText, Calendar } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { Lease } from '../types';

interface TenantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTenantForDetails: any;
  leases: Lease[];
  currency: 'EUR' | 'USD' | 'FCFA';
}

export function TenantDetailsModal({
  isOpen,
  onClose,
  selectedTenantForDetails,
  leases,
  currency,
}: TenantDetailsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && selectedTenantForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
              <div className="flex items-center gap-2.5">
                <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight font-sans">
                    Tenant Profile / File
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium font-sans">Consult personal file background and lease logs history</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer bg-neutral-800 hover:bg-neutral-750 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-sans text-neutral-300 text-sm">
              {/* Header Profile Summary */}
              <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 p-5 rounded-2xl border border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div>
                  <h4 className="text-2xl font-bold text-white tracking-tight font-sans">
                    {selectedTenantForDetails.first_name} {selectedTenantForDetails.last_name}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-2 capitalize font-mono">
                    {selectedTenantForDetails.profession || 'Self-employed / Other'}
                  </span>
                </div>
                <div className="text-left md:text-right font-mono">
                  <p className="text-[10px] text-neutral-550 uppercase font-bold tracking-wider">Declared Monthly Income</p>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">
                    {formatPrice(selectedTenantForDetails.revenu_mensuel, currency)}
                    <span className="text-[11px] text-neutral-500 font-normal font-sans ml-1">/ mo</span>
                  </p>
                </div>
              </div>

              {/* Core Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 shadow-inner">
                  <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Contact Details</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-sans">Email Address</span>
                      <a 
                        href={`mailto:${selectedTenantForDetails.email}`} 
                        className="text-indigo-400 hover:underline font-medium hover:text-indigo-300 transition-colors"
                      >
                        {selectedTenantForDetails.email}
                      </a>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-sans">Phone Line</span>
                      <a 
                        href={`tel:${selectedTenantForDetails.phone}`} 
                        className="text-white hover:underline font-mono"
                      >
                        {selectedTenantForDetails.phone || 'Not specified'}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 shadow-inner">
                  <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">ID & System Credentials</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-sans">ID / Passport Reference</span>
                      <span className="text-white font-mono">{selectedTenantForDetails.cni_numero || selectedTenantForDetails.id_card || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-sans">Access Key UID</span>
                      <span className="text-neutral-400 font-mono">#{selectedTenantForDetails.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Associated Contracts Section */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pl-1">
                  <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Lease Contract History
                  </h5>
                  <span className="text-[10px] bg-neutral-800 text-neutral-500 font-bold px-2 py-0.5 rounded-full font-mono">
                    {(() => {
                      const count = leases.filter(c => 
                        c.locataire_id === selectedTenantForDetails.id || 
                        c.locataire_id === selectedTenantForDetails.user_id || 
                        c.locataire_email === selectedTenantForDetails.email
                      ).length;
                      return `${count} active lease${count > 1 ? 's' : ''}`;
                    })()}
                  </span>
                </div>

                {(() => {
                  const clientContrats = leases.filter(c => 
                    c.locataire_id === selectedTenantForDetails.id || 
                    c.locataire_id === selectedTenantForDetails.user_id || 
                    c.locataire_email === selectedTenantForDetails.email
                  );

                  if (clientContrats.length === 0) {
                    return (
                      <div className="bg-neutral-950 p-6 rounded-2xl border border-dashed border-neutral-800 text-center text-neutral-500 italic text-xs font-sans animate-fade-in">
                        No active lease or sale contract associated with this customer model at the moment.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {clientContrats.map((c) => {
                        const dateDebutFr = c.date_debut ? new Date(c.date_debut).toLocaleDateString() : 'N/A';
                        const dateFinFr = c.date_fin ? new Date(c.date_fin).toLocaleDateString() : 'Ongoing';
                        const isActif = c.statut === 'actif';

                        return (
                          <div 
                            key={c.id} 
                            className="bg-neutral-950/60 hover:bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-sm font-sans">{c.bien_titre}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase font-mono ${
                                  c.type === 'vente' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25'
                                }`}>
                                  {c.type === 'vente' ? 'Sale' : 'Rent'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                                <span className="font-sans">From {dateDebutFr} to {dateFinFr}</span>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-1 shrink-0 font-mono">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isActif 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-neutral-800 text-neutral-500 border border-neutral-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActif ? 'bg-emerald-400' : 'bg-neutral-400'}`} />
                                {isActif ? 'Active' : 'Archived'}
                              </span>
                              <p className="text-sm font-bold text-white mt-1">
                                {c.type === 'vente' 
                                  ? formatPrice(c.prix_vente, currency) 
                                  : `${formatPrice(c.loyer_mensuel, currency)} / mo`
                                }
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-800 flex justify-end bg-neutral-950/40">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-750 border border-neutral-700 transition-all cursor-pointer shadow-md"
              >
                Close File
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
