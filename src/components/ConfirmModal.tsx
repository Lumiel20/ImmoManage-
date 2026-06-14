import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-white bg-neutral-850 hover:bg-neutral-800/80 rounded-xl transition-all cursor-pointer border border-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-neutral-300 leading-relaxed">
                {message}
              </p>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10 transition-colors cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
