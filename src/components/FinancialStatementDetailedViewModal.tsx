import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, FileCode } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { Lease } from '../types';

interface ReleveFinancierDetailedViewModalProps {
  selectedReleveContrat: Lease | null;
  history: any[];
  onClose: () => void;
  currency: 'EUR' | 'USD' | 'FCFA';
  onPrint: () => void;
  onArchive: () => void;
  generatingReleveId: number | null;
}

export function FinancialStatementDetailedViewModal({
  selectedReleveContrat,
  history,
  onClose,
  currency,
  onPrint,
  onArchive,
  generatingReleveId,
}: ReleveFinancierDetailedViewModalProps) {
  if (!selectedReleveContrat) return null;

  const totalDue = history.reduce((sum, h) => sum + (h.amount || 0), 0);
  const totalPaid = history.reduce((sum, h) => sum + (h.status === 'paye' || h.status === 'paye_en_retard' ? h.amount : 0), 0);
  const totalLate = totalDue - totalPaid;
  const netReverse = Math.max(0, totalPaid - Math.round(totalPaid * 0.08));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-start justify-between bg-neutral-950/40">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 inline-block font-mono uppercase tracking-widest">
                Management Summary Statement
              </span>
              <h3 className="text-xl font-bold text-white pt-1 font-sans">Individual Financial Statement 2026</h3>
              <p className="text-xs text-neutral-400 font-sans">
                Accrual ledger matching for <strong className="text-neutral-200">{selectedReleveContrat.bien_titre}</strong>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800 rounded-xl transition-all cursor-pointer border border-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sans">
            {/* Summary grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center">
                <p className="text-[9px] text-neutral-550 font-bold uppercase tracking-wider font-mono">Expected</p>
                <p className="text-sm font-bold text-indigo-400 mt-1 font-mono">{formatPrice(totalDue, currency)}</p>
              </div>
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center">
                <p className="text-[9px] text-neutral-550 font-bold uppercase tracking-wider font-mono">Collected</p>
                <p className="text-sm font-bold text-emerald-400 mt-1 font-mono">{formatPrice(totalPaid, currency)}</p>
              </div>
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center">
                <p className="text-[9px] text-neutral-550 font-bold uppercase tracking-wider font-mono">Arrears</p>
                <p className="text-sm font-bold text-rose-400 mt-1 font-mono">{formatPrice(totalLate, currency)}</p>
              </div>
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 text-center col-span-2 sm:col-span-1">
                <p className="text-[9px] text-neutral-550 font-bold uppercase tracking-wider font-mono">Net Payout</p>
                <p className="text-sm font-bold text-sky-400 mt-1 font-mono">{formatPrice(netReverse, currency)}</p>
              </div>
            </div>

            {/* Mandat Info Card */}
            <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-400">
              <div className="font-sans">
                <p className="font-bold text-neutral-300 uppercase tracking-wider text-[9px] mb-1 font-mono">PROPERTY MANAGER</p>
                <p className="text-white font-semibold">ImmoManage Solution</p>
                <p className="mt-0.5">Siret ID: 12345678900011</p>
                <p>Applied Fees: 8.00 %</p>
              </div>
              <div className="font-sans">
                <p className="font-bold text-neutral-300 uppercase tracking-wider text-[9px] mb-1 font-mono">LANDLORD RECIPIENT</p>
                <p className="text-white font-semibold">{selectedReleveContrat.locataire_email || 'Direct management'}</p>
                <p className="mt-0.5">Lease Commencement: {selectedReleveContrat.date_debut ? new Date(selectedReleveContrat.date_debut).toLocaleDateString() : 'Not specified'}</p>
                <p>Base Monthly Rent: {formatPrice(selectedReleveContrat.loyer_mensuel || 1000, currency)} / mo</p>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Book of Accounts Ledger</p>
              <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-850 bg-neutral-900/40 text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none">
                      <th className="p-3">Period Month</th>
                      <th className="p-3 text-right">Debit Exposed</th>
                      <th className="p-3 text-right">Ref. Credit</th>
                      <th className="p-3 text-center">Collected At</th>
                      <th className="p-3 text-right">Rent Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850 font-sans">
                    {history.map((m) => {
                      const isPaid = m.status === 'paye' || m.status === 'paye_en_retard';
                      // Translate label helper
                      let labelText = m.label;
                      if (m.label === 'Payé') labelText = 'Paid';
                      else if (m.label === 'En Retard' || m.label === 'Retard') labelText = 'Arrears';
                      else if (m.label === 'À venir') labelText = 'Future';
                      else if (m.label === 'Pas commencé' || m.label === 'Hors contrat') labelText = 'Outside';

                      return (
                        <tr key={m.index} className="hover:bg-neutral-900/30">
                          <td className="p-3 font-semibold text-white">{m.month}</td>
                          <td className="p-3 text-right font-mono text-neutral-400">{formatPrice(m.amount, currency)}</td>
                          <td className="p-3 text-right font-mono text-white font-bold">{formatPrice(isPaid ? m.amount : 0, currency)}</td>
                          <td className="p-3 text-center text-neutral-400 font-mono text-[10px]">{m.datePaiement || '-'}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${m.colorClass}`}>
                              {labelText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer and interactions */}
          <div className="p-6 bg-neutral-955 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
            <div className="flex gap-2 w-full sm:w-auto font-sans">
              <button
                type="button"
                onClick={onPrint}
                className="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/10 font-sans"
              >
                <Printer className="w-4 h-4" />
                Print / Download
              </button>
              <button
                type="button"
                disabled={generatingReleveId === selectedReleveContrat.id}
                onClick={onArchive}
                className="flex-1 sm:flex-none justify-center bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-neutral-800 transition-all cursor-pointer flex items-center gap-2 font-sans"
              >
                {generatingReleveId === selectedReleveContrat.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin font-sans" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    Archive in GED (PDF)
                  </>
                )}
              </button>
            </div>
            <button 
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-850 hover:bg-neutral-800 text-neutral-300 transition-all cursor-pointer text-center font-sans"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
