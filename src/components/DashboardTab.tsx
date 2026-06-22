import React from 'react';
import { 
  Plus, 
  Users, 
  FileText, 
  MapPin, 
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { User, Property, Lease } from '../types';
import { StatCard, ActionButton } from './UIComponents';

interface DashboardTabProps {
  user: User | null;
  expiringBails: any[];
  notifiedContrats: number[];
  handleSendExpiryNotification: (c: any, daysRemaining: number) => void;
  activeBiensCount: number;
  locatairesCount: number;
  activeContractsCount: number;
  monthlyRentRevenue: number;
  vacancyRate: number;
  theme: 'dark' | 'light';
  last6MonthsData: any[];
  biens: Property[];
  formatPrice: (amount: number | null | undefined, rawOnlySymbol?: boolean) => string;
  setActiveTab: (tab: string) => void;
  openNewBien: () => void;
  openNewLocataire: () => void;
  openNewContrat: (type?: string) => void;
}

export function DashboardTab({
  user,
  expiringBails,
  notifiedContrats,
  handleSendExpiryNotification,
  activeBiensCount,
  locatairesCount,
  activeContractsCount,
  monthlyRentRevenue,
  vacancyRate,
  theme,
  last6MonthsData,
  biens,
  formatPrice,
  setActiveTab,
  openNewBien,
  openNewLocataire,
  openNewContrat
}: DashboardTabProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} 
      className="space-y-8 animate-fade-in"
    >
      <header className="flex justify-between items-end font-sans">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Welcome, {user?.first_name || 'Admin'}</h2>
          <p className="text-neutral-400 font-sans">Here is the current state of your property portfolio.</p>
        </div>
      </header>

      {/* Alerte Expiration Bail Banner */}
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
                <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2 font-sans">
                  Lease Expiration warning
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                    {expiringBails.length} {expiringBails.length === 1 ? 'lease' : 'leases'} at J-7 or less
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 font-sans">
                  The following lease contracts are about to expire soon. Take appropriate measures or notify the tenants.
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
                  <div className="space-y-1.5 font-sans">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white text-sm tracking-tight truncate max-w-[70%]">{c.bien_titre}</span>
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
                    <div className="space-y-1">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
        <StatCard label="Active properties" value={activeBiensCount.toString()} color="indigo" />
        <StatCard label="Registered tenants" value={locatairesCount.toString()} color="cyan" />
        <StatCard label="Active leases" value={activeContractsCount.toString()} color="violet" />
        <StatCard label="Monthly revenue" value={formatPrice(monthlyRentRevenue)} color="emerald" />
        <StatCard label="Vacancy rate" value={`${vacancyRate}%`} color="rose" />
      </div>

      {/* Evolution of Rents Bar Chart */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-sans">
          <div>
            <h3 className="text-lg font-semibold text-white">Rental Income Trend</h3>
            <p className="text-xs text-neutral-400">Financial reconciliation of collected rent vs. arrears (Past 6 Months)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-neutral-300">Collected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-neutral-300">Unpaid / Arrears</span>
            </div>
          </div>
        </div>
        <div className="h-[280px] w-full font-sans text-xs">
          {(() => {
            const isDark = theme === 'dark';
            const gridStroke = isDark ? '#262626' : '#e2e8f0';
            const axisStroke = isDark ? '#737373' : '#94a3b8';
            const tickColor = isDark ? '#a3a3a3' : '#475569';
            const cursorFill = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={last6MonthsData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={true} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={axisStroke} 
                    tick={{ fill: tickColor }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={axisStroke} 
                    tick={{ fill: tickColor }}
                    tickFormatter={(v) => formatPrice(v)}
                    tickLine={false}
                    axisLine={false}
                    width={85}
                  />
                  <Tooltip 
                    cursor={{ fill: cursorFill }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dataObj = payload[0].payload;
                        return (
                          <div className="bg-neutral-950/95 border border-neutral-800 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 font-sans backdrop-blur-md min-w-[200px]">
                            <p className="font-bold text-white border-b border-neutral-800 pb-1.5 mb-1.5 flex justify-between items-center">
                              <span>{dataObj.fullName}</span>
                              <span className="text-[10px] text-neutral-500 font-normal">Income Summary</span>
                            </p>
                            {payload.map((entry: any, i: number) => {
                              const isCollected = entry.dataKey === 'Loyers Encaissés' || entry.name === 'Collected';
                              const labelName = isCollected ? 'Collected' : 'Arrears';
                              const labelColor = isCollected ? 'text-indigo-400' : 'text-rose-400';
                              const dotColor = isCollected ? 'bg-indigo-500' : 'bg-rose-500';
                              
                              return (
                                <div key={i} className="flex items-center justify-between gap-4 py-0.5">
                                  <span className="flex items-center gap-1.5 text-neutral-400">
                                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                    {labelName} :
                                  </span>
                                  <span className={`font-semibold font-mono ${labelColor}`}>
                                    {formatPrice(entry.value)}
                                  </span>
                                </div>
                              );
                            })}
                            <div className="pt-2 mt-1.5 border-t border-neutral-800/60 flex justify-between font-bold text-white">
                              <span className="text-neutral-300">Total Expected:</span>
                              <span className="font-mono text-emerald-400">
                                {formatPrice((dataObj['Loyers Encaissés'] || 0) + (dataObj['En Retard / Impayés'] || 0))}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="Loyers Encaissés" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={45}
                    name="Collected"
                  />
                  <Bar 
                    dataKey="En Retard / Impayés" 
                    fill="#f43f5e" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={45}
                    name="Arrears"
                  />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 font-sans">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Recently added properties</h3>
            <button onClick={() => setActiveTab('biens')} className="text-xs text-indigo-400 hover:underline cursor-pointer">View all</button>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {biens.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 italic">No properties found.</div>
            ) : (
              <div className="overflow-x-auto w-full scrollbar-none">
                <table className="w-full text-left border-collapse min-w-[550px] md:min-w-0 font-sans">
                  <thead>
                    <tr className="border-b border-neutral-800 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">City</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-sm">
                    {biens.slice(0, 5).map(bien => (
                      <tr key={bien.id} onClick={() => { setActiveTab('biens'); }} className="hover:bg-neutral-800/40 transition-colors cursor-pointer">
                        <td className="px-6 py-4 font-medium text-white">{bien.titre}</td>
                        <td className="px-6 py-4 capitalize">{bien.type === 'appartement' ? 'Apartment' : bien.type === 'bureau' ? 'Office' : 'House'}</td>
                        <td className="px-6 py-4 flex items-center gap-1"><MapPin className="w-3 h-3 opacity-40"/> {bien.ville}</td>
                        <td className="px-6 py-4 font-mono">{formatPrice(bien.prix)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            bien.statut === 'disponible' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {bien.statut === 'disponible' ? 'Available' : 'Occupied'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="space-y-3">
            <ActionButton icon={<Plus/>} label="Add property" color="indigo" onClick={openNewBien} />
            <ActionButton icon={<Users/>} label="Add tenant" color="neutral" onClick={openNewLocataire} />
            <ActionButton icon={<FileText/>} label="Generate Lease" color="neutral" onClick={() => openNewContrat('bail')} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
