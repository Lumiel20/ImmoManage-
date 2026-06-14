import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Check } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { Lease } from '../types';

interface DetailPaymentHistoryModalProps {
  selectedHistoryContrat: Lease | null;
  history: any[];
  onClose: () => void;
  currency: 'EUR' | 'USD' | 'FCFA';
  handleCancelPaymentConfirmation: (contratId: number, recordId: any, month: string) => void;
  onValidatePaymentClick: (monthName: string, monthIndex: number) => void;
}

export function DetailPaymentHistoryModal({
  selectedHistoryContrat,
  history,
  onClose,
  currency,
  handleCancelPaymentConfirmation,
  onValidatePaymentClick,
}: DetailPaymentHistoryModalProps) {
  if (!selectedHistoryContrat) return null;

  const activeMonths = history.filter(m => m.status !== 'hors_contrat');
  const expectedAnnual = activeMonths.reduce((sum, m) => sum + m.amount, 0);
  const collectedAnnual = history
    .filter(m => m.status === 'paye' || m.status === 'paye_en_retard')
    .reduce((sum, m) => sum + m.amount, 0);
  const percentCollected = expectedAnnual > 0 ? Math.round((collectedAnnual / expectedAnnual) * 100) : 0;
  const paidMonthsCount = history.filter(m => m.status === 'paye' || m.status === 'paye_en_retard').length;
  const totalMonthsCount = activeMonths.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 inline-block font-mono">
                Payment History 2026
              </span>
              <h3 className="text-xl font-bold text-white pt-2 font-sans">{selectedHistoryContrat.bien_titre}</h3>
              <p className="text-xs text-neutral-400 font-sans">
                Tenant: <strong className="text-neutral-200">{selectedHistoryContrat.locataire_email || 'Direct management'}</strong>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800/80 rounded-xl transition-all cursor-pointer border border-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 shadow-inner">
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Monthly Rent</p>
                <p className="text-2xl font-bold text-indigo-400 mt-1 font-mono">{formatPrice(selectedHistoryContrat.loyer_mensuel || 1000, currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Global Status</p>
                <p className="text-xs font-semibold text-emerald-400 mt-1 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block font-sans">
                  {selectedHistoryContrat.statut === 'actif' ? 'Active' : 'Archived'}
                </p>
              </div>
            </div>

            {/* Barre de progression des loyers de l'année */}
            <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800/50 space-y-3.5 shadow-md">
              <div className="flex justify-between items-center font-sans">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Collected rent this fiscal year</p>
                  <p className="text-sm font-semibold text-neutral-300">
                    <span className="text-white font-bold font-mono text-base">{formatPrice(collectedAnnual, currency)}</span>
                    <span className="text-neutral-500 font-normal"> / {formatPrice(expectedAnnual, currency)} expected</span>
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block font-mono">Collection rate</span>
                  <span className="text-indigo-400 font-bold font-mono text-base">{percentCollected}%</span>
                </div>
              </div>

              {/* Animated progress bar */}
              <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden border border-neutral-800 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentCollected}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-500 relative"
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-medium font-sans">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {paidMonthsCount} / {totalMonthsCount} months paid
                </span>
                <span className="text-neutral-550 font-mono">2026</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-bold text-neutral-400 tracking-wider uppercase pl-1 font-mono">Schedule & Ledger (2026)</p>
              
              <div className="divide-y divide-neutral-800/50 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-inner font-sans">
                {history.map((m) => {
                  const isManual = (m as any).isManual;
                  const dbRecordId = (m as any).dbRecordId;

                  // Translate label helper
                  let labelText = m.label;
                  if (m.label === 'Payé') labelText = 'Paid';
                  else if (m.label === 'En Retard' || m.label === 'Retard') labelText = 'Arrears';
                  else if (m.label === 'À venir') labelText = 'Future';
                  else if (m.label === 'Pas commencé' || m.label === 'Hors contrat') labelText = 'Out of span';

                  return (
                    <div key={m.index} className="flex items-center justify-between p-3.5 hover:bg-neutral-900/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${m.dotColor}`} />
                        <div>
                          <p className="font-semibold text-sm text-white font-sans">{m.month}</p>
                          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{m.datePaiement}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {m.amount > 0 && (
                          <span className="font-mono text-xs font-semibold text-neutral-300">
                            {formatPrice(m.amount, currency)}
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono ${m.colorClass}`}>
                          {labelText}
                        </span>

                        {isManual ? (
                          <button
                            onClick={() => handleCancelPaymentConfirmation(selectedHistoryContrat.id, dbRecordId, m.month)}
                            className="p-1 text-rose-500 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                            title="Reset payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          m.status !== 'hors_contrat' && m.status !== 'futur' && (
                            <button
                              onClick={() => onValidatePaymentClick(m.month, m.index)}
                              className="p-1 px-2.5 text-[10px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg transition-all flex items-center gap-1 cursor-pointer font-semibold font-sans"
                              title="Mark as paid"
                            >
                              <Check className="w-3 h-3" />
                              <span>Collect</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-950/60 border-t border-neutral-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 text-white transition-all cursor-pointer shadow-lg shadow-indigo-650/15 font-sans"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
