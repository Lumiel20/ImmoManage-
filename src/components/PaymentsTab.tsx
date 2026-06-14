import React from 'react';
import { Euro, History, FileSpreadsheet, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Lease } from '../types';

interface PaymentsTabProps {
  paymentsSubTab: 'suivi' | 'releves';
  setPaymentsSubTab: (tab: 'suivi' | 'releves') => void;
  lateContractsCount: number;
  totalPaidRent: number;
  complianceRate: number;
  totalLateRent: number;
  contrats: Lease[];
  getContratPaymentStatus: (c: Lease) => {
    isLate: boolean;
    delayDays?: number;
    label: string;
    status: string;
    dueDay?: string | number;
  };
  getContratPaymentHistory: (c: Lease) => any[];
  setSelectedHistoryContrat: (c: Lease | null) => void;
  setSelectedReleveContrat: (c: Lease | null) => void;
  formatPrice: (amount: number | null | undefined, rawOnlySymbol?: boolean) => string;
}

export function PaymentsTab({
  paymentsSubTab,
  setPaymentsSubTab,
  lateContractsCount,
  totalPaidRent,
  complianceRate,
  totalLateRent,
  contrats,
  getContratPaymentStatus,
  getContratPaymentHistory,
  setSelectedHistoryContrat,
  setSelectedReleveContrat,
  formatPrice
}: PaymentsTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
      className="space-y-6"
    >
      <header className="flex justify-between items-center text-sans">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Payments & Accounting</h2>
          <p className="text-neutral-400">Track collected rent, unpaid balances and generate performance statements.</p>
        </div>
      </header>

      {/* Sub-tab Navigation */}
      <div className="flex gap-2 border-b border-neutral-800 pb-px text-sans">
        <button
          type="button"
          onClick={() => setPaymentsSubTab('suivi')}
          className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 bg-transparent ${
            paymentsSubTab === 'suivi'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Payment Tracking
        </button>
        <button
          type="button"
          onClick={() => setPaymentsSubTab('releves')}
          className={`px-4 py-2 text-xs font-bold transition-all cursor-pointer border-b-2 bg-transparent ${
            paymentsSubTab === 'releves'
              ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-500/5'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Financial Statements (GED & Accounting)
        </button>
      </div>

      {paymentsSubTab === 'suivi' ? (
        <div className="space-y-6">
          {lateContractsCount > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sans">
              <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 mt-0.5 shrink-0 animate-pulse">
                <Euro className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Late Rent Payment Warning!</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  The billing engine has identified <strong className="text-rose-400 font-semibold">{lateContractsCount} lease{lateContractsCount > 1 ? 's' : ''}</strong> in payment arrears/late status for this month. Reminders should be dispatched immediately.
                </p>
              </div>
            </div>
          )}

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn text-sans">
            <div className="p-4 bg-neutral-950 border border-neutral-800/60 rounded-xl">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Collected (Month)</p>
              <p className="text-2xl font-bold text-white font-mono">
                {formatPrice(totalPaidRent)}
              </p>
            </div>
            <div className="p-4 bg-neutral-950 border border-neutral-800/60 rounded-xl">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Payments Collection Rate</p>
              <p className="text-2xl font-bold text-white font-mono">{complianceRate}%</p>
            </div>
            <div className="p-4 bg-neutral-950 border border-neutral-800/60 rounded-xl">
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Arrears / Unpaid Rent</p>
              <p className="text-2xl font-bold text-white font-mono">{formatPrice(totalLateRent)}</p>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto w-full scrollbar-none">
              <table className="w-full text-left border-collapse min-w-[750px] md:min-w-0 font-sans">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Lease / Tenant</th>
                    <th className="px-6 py-4">Month / Term</th>
                    <th className="px-6 py-4">Rent Price</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Rent Status</th>
                    <th className="px-6 py-4 text-right">Accounting History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {contrats.filter(c => c.type === 'bail').map((c, idx) => {
                    const pStatus = getContratPaymentStatus(c);
                    return (
                      <tr 
                        key={c.id || idx} 
                        onClick={() => setSelectedHistoryContrat(c)}
                        className="hover:bg-neutral-800/60 transition-colors cursor-pointer group"
                        title="Click to view full payment history logs for the current year"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-white group-hover:text-indigo-400 transition-colors font-sans">{c.bien_titre}</p>
                          <p className="text-xs text-neutral-500 font-mono">{c.locataire_email || 'Direct management'}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono uppercase text-neutral-300">
                          {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-200">{formatPrice(c.loyer_mensuel || 1000)}</td>
                        <td className="px-6 py-4 text-neutral-400 text-xs">Bank Transfer / SEPA</td>
                        <td className="px-6 py-4">
                          {pStatus.isLate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse inline-flex items-center gap-1 font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Arrears ({pStatus.delayDays}d)
                            </span>
                          ) : pStatus.status === 'paye' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1 font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Paid
                            </span>
                          ) : pStatus.status === 'attente' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1 font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Due (Day {pStatus.dueDay})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1 font-sans">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {pStatus.label === 'Payé' ? 'Paid' : pStatus.label === 'Retard' ? 'Late' : pStatus.label}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedHistoryContrat(c)}
                            className="text-xs text-indigo-400 font-semibold bg-indigo-500/5 group-hover:bg-indigo-500/15 group-hover:text-indigo-300 border border-indigo-500/10 group-hover:border-indigo-500/30 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer font-sans"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {contrats.filter(c => c.type === 'bail').length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-neutral-500 italic font-sans">No payments tracked (register a lease first).</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Explanatory introduction banner */}
          <div className="bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 p-5 rounded-2xl flex items-start gap-3.5 relative overflow-hidden text-sans">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-sm">Financial Statements & Accounting Reports</h4>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
                Generate, print and archive professional financial statements for each active housing lease. Statements integrate full ledger sheets, consolidating collected rent, outstanding balances, and an automatic management fee audit (8.00%).
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl pb-2">
            <div className="overflow-x-auto w-full scrollbar-none">
              <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0 font-sans">
                <thead>
                  <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Tenant</th>
                    <th className="px-6 py-4">Fiscal Year</th>
                    <th className="px-6 py-4">Collected / Expected Rent</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-sm">
                  {contrats.filter(c => c.type === 'bail').map((c, idx) => {
                    const history = getContratPaymentHistory(c);
                    const totalDue = history.reduce((sum, h) => sum + (h.amount || 0), 0);
                    const totalPaid = history.reduce((sum, h) => sum + (h.status === 'paye' || h.status === 'paye_en_retard' ? h.amount : 0), 0);
                    const isFullyPaid = totalPaid === totalDue && totalDue > 0;
                    
                    return (
                      <tr key={c.id || idx} className="hover:bg-neutral-850/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white font-sans">{c.bien_titre}</p>
                          <p className="text-xs text-neutral-500 font-mono">Monthly Rent: {formatPrice(c.loyer_mensuel || 1000)}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-neutral-300">
                          {c.locataire_email || 'Direct owner'}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-neutral-400 font-mono">
                          Year 2026
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className="font-mono text-xs font-bold text-neutral-200">
                              {formatPrice(totalPaid)} / {formatPrice(totalDue)}
                            </span>
                            <div className="w-28 bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isFullyPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${totalDue > 0 ? (totalPaid / totalDue) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReleveContrat(c)}
                              className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer font-sans"
                              title="Review Statement"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300" />
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {contrats.filter(c => c.type === 'bail').length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-neutral-500 italic font-sans animate-fade-in">No leases registered to generate statements.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
