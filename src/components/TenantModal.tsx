import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editingTenant: any;
  tenantFirstName: string;
  setTenantFirstName: (v: string) => void;
  tenantLastName: string;
  setTenantLastName: (v: string) => void;
  tenantEmail: string;
  setTenantEmail: (v: string) => void;
  tenantPhone: string;
  setTenantPhone: (v: string) => void;
  tenantProfession: string;
  setTenantProfession: (v: string) => void;
  tenantIncome: number;
  setTenantIncome: (v: number) => void;
  tenantIdCard: string;
  setTenantIdCard: (v: string) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  attemptedSubmitOnTenant: boolean;
  markTouched: (field: string) => void;
}

export function TenantModal({
  isOpen,
  onClose,
  onSubmit,
  editingTenant,
  tenantFirstName,
  setTenantFirstName,
  tenantLastName,
  setTenantLastName,
  tenantEmail,
  setTenantEmail,
  tenantPhone,
  setTenantPhone,
  tenantProfession,
  setTenantProfession,
  tenantIncome,
  setTenantIncome,
  tenantIdCard,
  setTenantIdCard,
  errors,
  touched,
  attemptedSubmitOnTenant,
  markTouched,
}: TenantModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-sans">
                {editingTenant ? 'Edit Tenant' : 'New Tenant Registration'}
              </h3>
              <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto font-sans text-sm text-neutral-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">First Name</label>
                  <input 
                    type="text" 
                    value={tenantFirstName} 
                    onChange={e => { setTenantFirstName(e.target.value); markTouched('tenantFirstName'); }} 
                    onBlur={() => markTouched('tenantFirstName')}
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.firstName && (touched.tenantFirstName || attemptedSubmitOnTenant)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="John" 
                    required 
                  />
                  {errors.firstName && (touched.tenantFirstName || attemptedSubmitOnTenant) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Last Name</label>
                  <input 
                    type="text" 
                    value={tenantLastName} 
                    onChange={e => { setTenantLastName(e.target.value); markTouched('tenantLastName'); }} 
                    onBlur={() => markTouched('tenantLastName')}
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.lastName && (touched.tenantLastName || attemptedSubmitOnTenant)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="Doe" 
                    required 
                  />
                  {errors.lastName && (touched.tenantLastName || attemptedSubmitOnTenant) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Email Address</label>
                  <input 
                    type="email" 
                    value={tenantEmail} 
                    onChange={e => { setTenantEmail(e.target.value); markTouched('tenantEmail'); }} 
                    onBlur={() => markTouched('tenantEmail')}
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.email && (touched.tenantEmail || attemptedSubmitOnTenant)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="john.doe@email.com" 
                    required 
                  />
                  {errors.email && (touched.tenantEmail || attemptedSubmitOnTenant) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-semibold text-neutral-400">Phone</label>
                  <input 
                    type="text" 
                    value={tenantPhone} 
                    onChange={e => { setTenantPhone(e.target.value); markTouched('tenantPhone'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.phone && (touched.tenantPhone || attemptedSubmitOnTenant)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="+33 6 12 34 56 78" 
                  />
                  {errors.phone && (touched.tenantPhone || attemptedSubmitOnTenant) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400">Profession</label>
                  <input 
                    type="text" 
                    value={tenantProfession} 
                    onChange={e => { setTenantProfession(e.target.value); markTouched('tenantProfession'); }} 
                    onBlur={() => markTouched('tenantProfession')}
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.profession && (touched.tenantProfession || attemptedSubmitOnTenant)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    placeholder="Engineer, Artisan, Consultant..." 
                    required 
                  />
                  {errors.profession && (touched.tenantProfession || attemptedSubmitOnTenant) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.profession}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-400 font-sans">Monthly Income</label>
                  <input 
                    type="number" 
                    value={tenantIncome} 
                    onChange={e => { setTenantIncome(Number(e.target.value)); markTouched('tenantIncome'); }} 
                    className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                      errors.revenu && (touched.tenantIncome || attemptedSubmitOnTenant)
                        ? 'border-rose-500 focus:ring-rose-500/40' 
                        : 'border-neutral-800 focus:ring-indigo-500/40'
                    }`}
                    min="0" 
                    required 
                  />
                  {errors.revenu && (touched.tenantIncome || attemptedSubmitOnTenant) && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.revenu}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">ID Card / Passport Reference</label>
                <input 
                  type="text" 
                  value={tenantIdCard} 
                  onChange={e => { setTenantIdCard(e.target.value); markTouched('tenantIdCard'); }} 
                  onBlur={() => markTouched('tenantIdCard')}
                  className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${
                    errors.cni && (touched.tenantIdCard || attemptedSubmitOnTenant)
                      ? 'border-rose-500 focus:ring-rose-500/40' 
                      : 'border-neutral-800 focus:ring-indigo-500/40'
                  }`}
                  placeholder="9401XYZ789" 
                />
                {errors.cni && (touched.tenantIdCard || attemptedSubmitOnTenant) && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.cni}</p>
                )}
              </div>

              <p className="text-[11px] text-neutral-500 leading-relaxed italic bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                ⚠️ Note: Creating a tenant automatically generates a tenant access portal credential with a provisional default password of <span className="text-indigo-400 font-mono">tenant123</span>.
              </p>

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
                  Save Tenant
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
