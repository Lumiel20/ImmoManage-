import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { Property, Lease } from '../types';

interface LeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingLease: Lease | null;
  leaseType: string;
  setLeaseType: (v: string) => void;
  leaseStatus: string;
  setLeaseStatus: (v: string) => void;
  leasePropertyId: number | '';
  setLeasePropertyId: (v: number | '') => void;
  leaseTenantId: number | '';
  setLeaseTenantId: (v: number | '') => void;
  leaseStartDate: string;
  setLeaseStartDate: (v: string) => void;
  leaseEndDate: string;
  setLeaseEndDate: (v: string) => void;
  leaseMonthlyRent: number;
  setLeaseMonthlyRent: (v: number) => void;
  leaseSalePrice: number;
  setLeaseSalePrice: (v: number) => void;
  properties: Property[];
  tenants: any[];
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  attemptedSubmitOnLease: boolean;
  markTouched: (field: string) => void;
  currency: 'EUR' | 'USD' | 'FCFA';
}

export function LeaseModal({
  isOpen,
  onClose,
  onSubmit,
  editingLease,
  leaseType,
  setLeaseType,
  leaseStatus,
  setLeaseStatus,
  leasePropertyId,
  setLeasePropertyId,
  leaseTenantId,
  setLeaseTenantId,
  leaseStartDate,
  setLeaseStartDate,
  leaseEndDate,
  setLeaseEndDate,
  leaseMonthlyRent,
  setLeaseMonthlyRent,
  leaseSalePrice,
  setLeaseSalePrice,
  properties,
  tenants,
  errors,
  touched,
  attemptedSubmitOnLease,
  markTouched,
  currency,
}: LeaseModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in"
          >
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-sans">
                {editingLease ? 'Modify Lease Agreement' : 'Create Rental / Sales Contract'}
              </h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-sans text-sm text-neutral-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Contract Type</label>
                  <select 
                    value={leaseType} 
                    onChange={e => setLeaseType(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option value="bail">Rent / Lease Agreement</option>
                    <option value="vente">Direct Asset Sale</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Commencement Status</label>
                  <select 
                    value={leaseStatus} 
                    onChange={e => setLeaseStatus(e.target.value)} 
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                  >
                    <option value="actif">Active / Ongoing</option>
                    <option value="termine">Terminated / Concluded</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Select Portfolio Property</label>
                <select 
                  value={leasePropertyId} 
                  onChange={e => { setLeasePropertyId(e.target.value ? Number(e.target.value) : ''); markTouched('leasePropertyId'); }} 
                  className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 cursor-pointer ${
                    errors.bienId && (touched.leasePropertyId || attemptedSubmitOnLease)
                      ? 'border-rose-500 focus:ring-rose-500/40' 
                      : 'border-neutral-800 focus:ring-indigo-500/40'
                  }`}
                  required
                >
                  <option value="">-- Choose a property --</option>
                  {properties.map(b => (
                    <option key={b.id} value={b.id}>{b.titre} ({b.ville} - {formatPrice(b.prix, currency)})</option>
                  ))}
                </select>
                {errors.bienId && (touched.leasePropertyId || attemptedSubmitOnLease) && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.bienId}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Select Associated Client / Tenant</label>
                <select 
                  value={leaseTenantId} 
                  onChange={e => setLeaseTenantId(e.target.value ? Number(e.target.value) : '')} 
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer"
                >
                  <option value="">-- Direct Management / No Tenant --</option>
                  {tenants.map(l => (
                    <option key={l.id} value={l.user_id}>
                      {l.first_name} {l.last_name} ({l.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Start / Commencement Date</label>
                  <input 
                    type="date" 
                    value={leaseStartDate} 
                    onChange={e => { setLeaseStartDate(e.target.value); markTouched('leaseStartDate'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.dateDebut && (touched.leaseStartDate || attemptedSubmitOnLease)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    required 
                  />
                  {errors.dateDebut && (touched.leaseStartDate || attemptedSubmitOnLease) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.dateDebut}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">End / Expiration Date (If Fixed)</label>
                  <input 
                    type="date" 
                    value={leaseEndDate} 
                    onChange={e => { setLeaseEndDate(e.target.value); markTouched('leaseEndDate'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.dateFin && (touched.leaseEndDate || attemptedSubmitOnLease)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                  />
                  {errors.dateFin && (touched.leaseEndDate || attemptedSubmitOnLease) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.dateFin}</p>
                  )}
                </div>
              </div>

              {leaseType !== 'vente' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Base Monthly Rent</label>
                  <input 
                    type="number" 
                    value={leaseMonthlyRent} 
                    onChange={e => { setLeaseMonthlyRent(Number(e.target.value)); markTouched('leaseMonthlyRent'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.loyer && (touched.leaseMonthlyRent || attemptedSubmitOnLease)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    min="0" 
                    required 
                  />
                  {errors.loyer && (touched.leaseMonthlyRent || attemptedSubmitOnLease) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.loyer}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Total Purchase Sale Price</label>
                  <input 
                    type="number" 
                    value={leaseSalePrice} 
                    onChange={e => { setLeaseSalePrice(Number(e.target.value)); markTouched('leaseSalePrice'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.prixVente && (touched.leaseSalePrice || attemptedSubmitOnLease)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    min="0" 
                    required 
                  />
                  {errors.prixVente && (touched.leaseSalePrice || attemptedSubmitOnLease) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.prixVente}</p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3 font-sans">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                >
                  Validate & Save Contract
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
