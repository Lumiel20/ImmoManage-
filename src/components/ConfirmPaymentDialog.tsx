import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ConfirmPaymentDialogProps {
  paymentToValidate: any;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  confirmStatus: string;
  setConfirmStatus: (v: string) => void;
  confirmAmount: number;
  setConfirmAmount: (v: number) => void;
  confirmDate: string;
  setConfirmDate: (v: string) => void;
  confirmMode: string;
  setConfirmMode: (v: string) => void;
}

export function ConfirmPaymentDialog({
  paymentToValidate,
  onClose,
  onSubmit,
  confirmStatus,
  setConfirmStatus,
  confirmAmount,
  setConfirmAmount,
  confirmDate,
  setConfirmDate,
  confirmMode,
  setConfirmMode,
}: ConfirmPaymentDialogProps) {
  if (!paymentToValidate) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
        >
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
            <div>
              <h3 className="text-base font-bold text-white font-sans">Collect Rental Receipt</h3>
              <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                {paymentToValidate.monthName} 2026 — {paymentToValidate.lease?.bien_titre}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800/80 rounded-xl transition-all cursor-pointer border border-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {/* Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-550 uppercase tracking-wider mb-2 font-sans">Payment Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmStatus('paye')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center font-sans ${
                    confirmStatus === 'paye'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  Paid on time
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmStatus('paye_en_retard')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center font-sans ${
                    confirmStatus === 'paye_en_retard'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  Paid with arrears
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-neutral-550 uppercase tracking-wider mb-1.5 font-sans font-sans">Amount Received</label>
              <input
                type="number"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(Number(e.target.value))}
                required
                min="1"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-sans font-mono"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-550 uppercase tracking-wider mb-1.5 font-sans">Reconciliation Date</label>
              <input
                type="text"
                placeholder="10/06/2026"
                value={confirmDate}
                onChange={(e) => setConfirmDate(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors font-sans font-mono"
              />
              <p className="text-[10px] text-neutral-550 mt-1 pl-1 font-sans">Format DD/MM/YYYY (e.g. 05/06/2026)</p>
            </div>

            {/* Mode of payment */}
            <div>
              <label className="block text-xs font-semibold text-neutral-550 uppercase tracking-wider mb-1.5 font-sans">Payment Method</label>
              <select
                value={confirmMode}
                onChange={(e) => setConfirmMode(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-sans"
              >
                <option value="virement">Direct Bank Transfer</option>
                <option value="especes">Cash Receipt</option>
                <option value="cheque">Cheque Deposit</option>
                <option value="carte">Credit Card</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-sans">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10 transition-colors cursor-pointer font-sans"
              >
                Reconcile
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
