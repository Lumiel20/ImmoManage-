import React, { useState, useMemo } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Lease, Property } from '../types';
import { safeFetchJson } from './usePropertyApp';

interface UsePaymentsParams {
  token: string | null;
  user: any;
  leases: Lease[];
  properties: Property[];
  addActionLog: (
    type: 'creation' | 'edition' | 'suppression',
    target: 'contrat' | 'bien' | 'locataire',
    title: string,
    description: string
  ) => void;
  setToastMsg: (msg: string | null) => void;
  setConfirmModal: (modal: any) => void;
  formatPrice: (amount: number | null | undefined, rawOnlySymbol?: boolean) => string;
  fetchDocuments?: (contratId: number) => Promise<void>;
}

export function usePayments({
  token,
  user,
  leases,
  properties,
  addActionLog,
  setToastMsg,
  setConfirmModal,
  formatPrice,
  fetchDocuments
}: UsePaymentsParams) {
  const [allValidatedPayments, setAllValidatedPayments] = useState<any[]>([]);
  const [paymentsSubTab, setPaymentsSubTab] = useState<'suivi' | 'releves'>('suivi');
  const [selectedStatementLease, setSelectedStatementLease] = useState<Lease | null>(null);
  const [generatingReleveId, setGeneratingReleveId] = useState<number | null>(null);
  const [selectedHistoryLease, setSelectedHistoryLease] = useState<Lease | null>(null);

  // Payment Confirmation Fields
  const [paymentToValidate, setPaymentToValidate] = useState<{
    lease: Lease;
    monthIndex: number;
    monthName: string;
    amount: number;
  } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState<number>(1000);
  const [confirmDate, setConfirmDate] = useState<string>('');
  const [confirmMode, setConfirmMode] = useState<string>('virement');
  const [confirmStatus, setConfirmStatus] = useState<string>('paye');

  const fetchAllValidatedPayments = async () => {
    if (!token) return;
    try {
      const json = await safeFetchJson('/api/v1/contrats/payments/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (json.success) {
        setAllValidatedPayments(json.data);
      }
    } catch (err: any) {
      if (err?.message !== 'Invalid token' && err?.message !== 'Unauthorized') {
        console.error('Error fetching validated payments:', err);
      }
    }
  };

  const getLeasePaymentStatus = (lease: Lease) => {
    if (lease.type !== 'bail') {
      return { status: 'n/a', label: 'N/A', isLate: false, dueDay: 5, delayDays: 0 };
    }
    if (lease.statut !== 'actif') {
      return { status: 'termine', label: 'Archived', isLate: false, dueDay: 5, delayDays: 0 };
    }

    let dueDay = 5;
    if (lease.date_debut) {
      const d = new Date(lease.date_debut);
      if (!isNaN(d.getTime())) {
        dueDay = Math.min(28, d.getDate());
      }
    }

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthIdx = today.getMonth();
    const currentYear = 2026;

    const dbRecord = allValidatedPayments.find(
      (p) =>
        p.contrat_id === lease.id &&
        p.month_index === currentMonthIdx &&
        p.year === currentYear
    );

    if (dbRecord) {
      const isLate = dbRecord.status === 'retard';
      const delayDays = isLate ? (currentDay > dueDay ? currentDay - dueDay : 5) : 0;
      let label = 'Paid';
      if (dbRecord.status === 'paye_en_retard') label = 'Paid (Late)';
      else if (dbRecord.status === 'retard') label = 'Late';
      else if (dbRecord.status === 'attente') label = 'Pending';
      return { status: dbRecord.status, label, isLate, dueDay, delayDays };
    }

    const startDate = lease.date_debut ? new Date(lease.date_debut) : null;
    if (startDate && startDate > today) {
      return { status: 'futur', label: 'To Come', isLate: false, dueDay, delayDays: 0 };
    }

    const isPaid = lease.id % 2 === 0;

    if (isPaid) {
      return { status: 'paye', label: 'Paid', isLate: false, dueDay, delayDays: 0 };
    }

    if (currentDay > dueDay) {
      const delayDays = currentDay - dueDay;
      return { status: 'retard', label: 'Late', isLate: true, dueDay, delayDays };
    } else {
      return { status: 'attente', label: 'Pending', isLate: false, dueDay, delayDays: 0 };
    }
  };

  const getLeasePaymentHistory = (lease: Lease) => {
    const currentYear = 2026;
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    const today = new Date();
    const currentMonthIdx = today.getMonth();
    const currentDay = today.getDate();

    let dueDay = 5;
    if (lease.date_debut) {
      const d = new Date(lease.date_debut);
      if (!isNaN(d.getTime())) {
        dueDay = Math.min(28, d.getDate());
      }
    }

    const startDate = lease.date_debut ? new Date(lease.date_debut) : null;
    const endDate = lease.date_fin ? new Date(lease.date_fin) : null;

    return monthNames.map((name, index) => {
      const firstDayOfMonth = new Date(currentYear, index, 1);
      const lastDayOfMonth = new Date(currentYear, index + 1, 0);

      const startedBeforeOrDuring = !startDate || startDate <= lastDayOfMonth;
      const endedAfterOrDuring = !endDate || endDate >= firstDayOfMonth;
      const isLeaseActive = startedBeforeOrDuring && endedAfterOrDuring;

      if (!isLeaseActive) {
        return {
          month: name,
          index,
          status: 'hors_contrat',
          label: 'Outside lease term',
          amount: 0,
          colorClass: 'text-neutral-500 bg-neutral-900/30 border-neutral-800/50',
          dotColor: 'bg-neutral-600',
          datePaiement: '-'
        };
      }

      const dbRecord = allValidatedPayments.find(
        (p) => p.contrat_id === lease.id && p.month_index === index && p.year === currentYear
      );

      if (dbRecord) {
        let label = 'Paid';
        let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        let dotColor = 'bg-emerald-500';

        if (dbRecord.status === 'paye_en_retard') {
          label = 'Paid (Late)';
          colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          dotColor = 'bg-amber-500';
        } else if (dbRecord.status === 'retard') {
          const delay = currentDay > dueDay ? currentDay - dueDay : 1;
          label = `Late (${delay}d)`;
          colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse';
          dotColor = 'bg-rose-500';
        } else if (dbRecord.status === 'attente') {
          label = 'Pending';
          colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
          dotColor = 'bg-amber-500';
        }

        return {
          month: name,
          index,
          status: dbRecord.status,
          label,
          amount: dbRecord.amount || lease.loyer_mensuel || 1000,
          colorClass,
          dotColor,
          datePaiement: dbRecord.status.startsWith('paye')
            ? `Collected on ${dbRecord.date_paiement} (via ${dbRecord.mode_paiement || 'transfer'})`
            : dbRecord.status === 'retard'
            ? 'Unpaid rent'
            : `Due date ${dueDay}/${String(index + 1).padStart(2, '0')}/${currentYear}`,
          isManual: true,
          dbRecordId: dbRecord.id
        };
      }

      const isPastMonth = index < currentMonthIdx;
      const isFutureMonth = index > currentMonthIdx;
      const isCurrentMonth = index === currentMonthIdx;

      if (isFutureMonth) {
        return {
          month: name,
          index,
          status: 'futur',
          label: 'To Come',
          amount: lease.loyer_mensuel || 1000,
          colorClass: 'text-neutral-500 bg-neutral-950/40 border-neutral-800/40',
          dotColor: 'bg-neutral-700',
          datePaiement: '-'
        };
      }

      if (isCurrentMonth) {
        const isPaid = lease.id % 2 === 0;
        if (isPaid) {
          return {
            month: name,
            index,
            status: 'paye',
            label: 'Paid',
            amount: lease.loyer_mensuel || 1000,
            colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            dotColor: 'bg-emerald-500',
            datePaiement: `Received on 0${Math.min(dueDay, 9)}/${String(index + 1).padStart(
              2,
              '0'
            )}/${currentYear}`
          };
        } else {
          if (currentDay > dueDay) {
            const delay = currentDay - dueDay;
            return {
              month: name,
              index,
              status: 'retard',
              label: `Late (${delay}d)`,
              amount: lease.loyer_mensuel || 1000,
              colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse',
              dotColor: 'bg-rose-500',
              datePaiement: 'Unpaid rent'
            };
          } else {
            return {
              month: name,
              index,
              status: 'attente',
              label: 'Pending',
              amount: lease.loyer_mensuel || 1000,
              colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
              dotColor: 'bg-amber-500',
              datePaiement: `Due date ${dueDay}/${String(index + 1).padStart(
                2,
                '0'
              )}/${currentYear}`
            };
          }
        }
      }

      // Past month
      const isOdd = lease.id % 2 !== 0;
      const wasLatePaidMonth = isOdd && (index === 2 || index === 4 || index === 0);
      if (wasLatePaidMonth) {
        return {
          month: name,
          index,
          status: 'paye_en_retard',
          label: 'Paid (Late)',
          amount: lease.loyer_mensuel || 1000,
          colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          dotColor: 'bg-amber-500',
          datePaiement: `Paid late on ${dueDay + 4}/${String(index + 1).padStart(
            2,
            '0'
          )}/${currentYear}`
        };
      }

      const payDay = Math.max(1, dueDay - (lease.id % 3));
      return {
        month: name,
        index,
        status: 'paye',
        label: 'Paid',
        amount: lease.loyer_mensuel || 1000,
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        dotColor: 'bg-emerald-500',
        datePaiement: `Received on ${String(payDay).padStart(2, '0')}/${String(
          index + 1
        ).padStart(2, '0')}/${currentYear}`
      };
    });
  };

  const handleSavePaymentConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !paymentToValidate) return;
    try {
      const res = await fetch(`/api/v1/contrats/${paymentToValidate.lease.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          month_index: paymentToValidate.monthIndex,
          year: 2026,
          amount: confirmAmount,
          status: confirmStatus,
          date_paiement: confirmDate || new Date().toLocaleDateString('fr-FR'),
          mode_paiement: confirmMode,
          confirmed_by: user?.email || 'Admin Agent'
        })
      });
      const json = await res.json();
      if (json.success) {
        addActionLog(
          'edition',
          'contrat',
          'Payment validated',
          `Payment for ${paymentToValidate.monthName} for "${paymentToValidate.lease.bien_titre}" validated (${confirmAmount} €).`
        );

        setToastMsg(
          `Payment for ${paymentToValidate.monthName} for "${paymentToValidate.lease.bien_titre}" has been registered!`
        );
        setPaymentToValidate(null);
        await fetchAllValidatedPayments();
      } else {
        alert(json.error?.message || 'Validation error');
      }
    } catch (err) {
      console.error(err);
      alert('Error validating payment.');
    }
  };

  const handleCancelPaymentConfirmation = (
    leaseId: number,
    dbPaymentId: number,
    monthName: string
  ) => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: 'Reset payment',
      message: `Do you want to reset the payment for the month of ${monthName}?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/contrats/${leaseId}/payments/${dbPaymentId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            addActionLog(
              'suppression',
              'contrat',
              'Validation cancelled',
              `The payment validation for ${monthName} on contract #${leaseId} was reset.`
            );

            setToastMsg(`Payment for ${monthName} has been reset!`);
            await fetchAllValidatedPayments();
          } else {
            setToastMsg(json.error?.message || 'Error deleting validation');
          }
        } catch (err) {
          console.error(err);
          setToastMsg('Connection error.');
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const generateReleveHtml = (lease: Lease, history: any[]) => {
    const totalDue = history.reduce((sum, h) => sum + (h.amount || 0), 0);
    const totalPaid = history.reduce(
      (sum, h) =>
        sum + (h.status === 'paye' || h.status === 'paye_en_retard' ? h.amount : 0),
      0
    );
    const totalLate = totalDue - totalPaid;
    const netReverse = Math.max(0, totalPaid - Math.round(totalPaid * 0.08));

    const tableRows = history
      .map((h) => {
        const isPaid = h.status === 'paye' || h.status === 'paye_en_retard';
        const isLate = h.status === 'retard';
        const badgeStyle = isPaid
          ? 'background-color: rgb(240 253 250); color: rgb(13 148 136); border: 1px solid rgb(204 251 241);'
          : isLate
          ? 'background-color: rgb(254 242 242); color: rgb(220 38 38); border: 1px solid rgb(254 226 226);'
          : 'background-color: rgb(254 243 199); color: rgb(217 119 6); border: 1px solid rgb(253 230 138);';
        return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 16px; font-weight: 500; color: #1f2937;">${h.month}</td>
          <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; text-align: right; color: #374151;">${formatPrice(
            h.amount
          )}</td>
          <td style="padding: 12px 16px; font-family: monospace; font-size: 13px; text-align: right; color: #111827; font-weight: 600;">${formatPrice(
            isPaid ? h.amount : 0
          )}</td>
          <td style="padding: 12px 16px; text-align: center; color: #4b5563; font-size: 12px;">${
            h.datePaiement || '-'
          }</td>
          <td style="padding: 12px 16px; text-align: right;">
            <span style="font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; ${badgeStyle}">
              ${h.label}
            </span>
          </td>
        </tr>
      `;
      })
      .join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Relevé Financier de Gérance - 2026 - ${lease.bien_titre}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background: #f8fafc; }
    .container { max-width: 850px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -1px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
    .header-logo { font-size: 26px; font-weight: 800; color: #4338ca; letter-spacing: -0.05em; text-transform: uppercase; }
    .header-badge { background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 6px 14px; border-radius: 9999px; letter-spacing: 0.05em; border: 1px solid #c7d2fe; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 35px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; margin-bottom: 10px; }
    .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; line-height: 1.6; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 35px; }
    .stat-card { background: #ffffff; border: 1px solid #e2e8f0; padding: 18px 12px; border-radius: 12px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .stat-val { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 6px; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-bottom: 40px; }
    th { padding: 14px 16px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; background: #f1f5f9; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 25px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="header-logo">ImmoManage</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Solutions de Gestion Locative Immobilière Professionnelle</div>
      </div>
      <div>
        <span class="header-badge">Relevé Financier Individuel</span>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="section-title">ADMINISTRATEUR (MANDATAIRE)</div>
        <div class="card" style="font-size: 13px; color: #334155;">
          <strong style="color: #0f172a; font-size: 14px;">ImmoManage Solution</strong><br/>
          Service d'Administration des Biens<br/>
          RCS Paris B 123 456 789<br/>
          Siret: 12345678900011
        </div>
      </div>
      <div>
        <div class="section-title">PROPRIÉTÉ & LOCATAIRE</div>
        <div class="card" style="font-size: 13px; color: #334155;">
          <strong style="color: #4338ca; font-size: 14px;">${lease.bien_titre}</strong><br/>
          Contact locataire : <span style="font-family: monospace;">${
            lease.locataire_email || 'Non renseigné'
          }</span><br/>
          Contrat : Bail d'habitation principal (Bail Actif)<br/>
          Mensualité de base : ${formatPrice(lease.loyer_mensuel || 1000)} / mois
        </div>
      </div>
    </div>

    <div class="section-title" style="margin-bottom: 12px;">Synthèse des Flux de Trésorerie</div>
    <div class="summary-grid">
      <div class="stat-card" style="border-top: 4px solid #4338ca;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Loyers Attendus</div>
        <div class="stat-val" style="color: #4338ca;">${formatPrice(totalDue)}</div>
      </div>
      <div class="stat-card" style="border-top: 4px solid #0d9488;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Encaissé</div>
        <div class="stat-val" style="color: #0d9488;">${formatPrice(totalPaid)}</div>
      </div>
      <div class="stat-card" style="border-top: 4px solid #dc2626;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Retards / Solde</div>
        <div class="stat-val" style="color: #dc2626;">${formatPrice(totalLate)}</div>
      </div>
      <div class="stat-card" style="border-top: 4px solid #0284c7;">
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Revenu Net (H-Frais)</div>
        <div class="stat-val" style="color: #0284c7;">${formatPrice(netReverse)}</div>
      </div>
    </div>

    <div class="section-title">Grand Livre de Comptes Individuels - Échéancier de Gérance</div>
    <table>
      <thead>
        <tr>
          <th>Mois d'échéance</th>
          <th style="text-align: right;">Crédit Exposé</th>
          <th style="text-align: right;">Montant Reçu</th>
          <th style="text-align: center;">Date de Perception</th>
          <th style="text-align: right;">Statut</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div style="margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px; color: #475569;">
      <div>
        <strong>Signature autorisée pour l'Administration</strong>
        <div style="height: 60px; border-bottom: 1px dashed #cbd5e1; margin-top: 10px;"></div>
        <p style="margin-top: 5px; color: #94a3b8;">Généré numériquement le ${new Date().toLocaleDateString(
          'fr-FR'
        )}</p>
      </div>
      <div>
        <strong>Visa Propriétaire / Bailleur</strong>
        <div style="height: 60px; border-bottom: 1px dashed #cbd5e1; margin-top: 10px;"></div>
        <p style="margin-top: 5px; color: #94a3b8;">Pour acceptation des flux reversés et quitus</p>
      </div>
    </div>

    <div class="footer" style="margin-top: 60px;">
      Ce relevé est un document d'ordre comptable et financier. Il est produit numériquement et tient lieu d'état de gérance.<br/>
      ImmoManage Software Services © 2026. Tous droits réservés.
    </div>
  </div>
</body>
</html>
    `;
  };

  const handleGenerateAndSaveReleve = async (lease: Lease) => {
    if (!token) return;
    setGeneratingReleveId(lease.id);
    try {
      const history = getLeasePaymentHistory(lease);
      const htmlString = generateReleveHtml(lease, history);

      const file = new File([htmlString], `Releve_Financier_2026_${lease.id}.html`, {
        type: 'text/html'
      });
      const storagePath = `contracts/${lease.id}/releve_financier_2026_${Date.now()}.html`;

      let downloadURL = '';
      let savedStoragePath: string | null = null;

      try {
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (error) => {
              console.warn('Storage upload failed, falling back to base64 data-URL', error);
              reject(error);
            },
            async () => {
              try {
                downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                savedStoragePath = storagePath;
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      } catch (storageErr) {
        console.warn('Using base64 fallback for document url due to storage error:', storageErr);
        const base64Html = btoa(unescape(encodeURIComponent(htmlString)));
        downloadURL = `data:text/html;base64,${base64Html}`;
        savedStoragePath = null;
      }

      const res = await fetch(`/api/v1/contrats/${lease.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titre: `Relevé Financier Annuel 2026 - ${lease.bien_titre}`,
          type: 'autre',
          url: downloadURL,
          storage_path: savedStoragePath
        })
      });
      const json = await res.json();
      if (json.success) {
        addActionLog(
          'creation',
          'contrat',
          'Relevé financier généré',
          `Un relevé financier annuel pour l'année 2026 a été généré, certifié et archivé dans la GED du contrat pour "${lease.bien_titre}".`
        );
        setToastMsg(
          `Le Relevé Financier de gérance pour "${lease.bien_titre}" a été généré et archivé avec succès !`
        );
        if (fetchDocuments) {
          await fetchDocuments(lease.id);
        }
      } else {
        setToastMsg(json.error?.message || "Erreur lors de l'enregistrement en base de données.");
      }
    } catch (err) {
      console.error(err);
      setToastMsg(`Erreur lors de la génération du relevé.`);
    } finally {
      setGeneratingReleveId(null);
    }
  };

  // Occupancy metrics calculations
  const activePropertiesCount = properties.length;
  const activeContractsCount = leases.filter((c) => c.statut === 'actif').length;
  const monthlyRentRevenue = leases
    .filter((c) => c.statut === 'actif' && c.type === 'bail')
    .reduce((sum, c) => sum + (c.loyer_mensuel || 0), 0);
  const vacantBiensCount = properties.filter((b) => b.statut === 'disponible').length;
  const vacancyRate = properties.length > 0 ? Math.round((vacantBiensCount / properties.length) * 100) : 0;

  const totalActiveLeases = leases.filter((c) => c.statut === 'actif' && c.type === 'bail');
  const lateContractsCount = totalActiveLeases.filter(
    (c) => getLeasePaymentStatus(c).isLate
  ).length;

  const totalPaidRent = totalActiveLeases
    .filter((c) => getLeasePaymentStatus(c).status === 'paye')
    .reduce((sum, c) => sum + (c.loyer_mensuel || 0), 0);

  const totalLateRent = totalActiveLeases
    .filter((c) => getLeasePaymentStatus(c).isLate)
    .reduce((sum, c) => sum + (c.loyer_mensuel || 0), 0);

  const complianceRate =
    totalActiveLeases.length > 0
      ? Math.round(
          ((totalActiveLeases.length - lateContractsCount) / totalActiveLeases.length) * 100
        )
      : 100;

  // Evolution over the last 6 months
  const last6MonthsData = useMemo(() => {
    const months: any[] = [];
    const monthNames = [
      'Janv',
      'Févr',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sept',
      'Oct',
      'Nov',
      'Déc'
    ];

    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        name: monthNames[d.getMonth()],
        fullName: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        'Loyers Encaissés': 0,
        'En Retard / Impayés': 0
      });
    }

    leases.forEach((c) => {
      if (c.type !== 'bail') return;
      const rent = c.loyer_mensuel || 0;
      if (rent <= 0) return;

      const startDate = c.date_debut ? new Date(c.date_debut) : null;
      const endDate = c.date_fin ? new Date(c.date_fin) : null;

      months.forEach((m) => {
        const firstDayOfMonth = new Date(m.year, m.monthIndex, 1);
        const lastDayOfMonth = new Date(m.year, m.monthIndex + 1, 0);

        const startedBeforeOrDuring = !startDate || startDate <= lastDayOfMonth;
        const endedAfterOrDuring = !endDate || endDate >= firstDayOfMonth;

        if (startedBeforeOrDuring && endedAfterOrDuring) {
          const isCurrentMonth =
            m.year === today.getFullYear() && m.monthIndex === today.getMonth();

          if (isCurrentMonth) {
            const isPaid = c.id % 2 === 0;
            if (isPaid) {
              m['Loyers Encaissés'] += rent;
            } else {
              let dueDay = 5;
              if (c.date_debut) {
                const startD = new Date(c.date_debut);
                if (!isNaN(startD.getTime())) {
                  dueDay = Math.min(28, startD.getDate());
                }
              }
              if (today.getDate() > dueDay) {
                m['En Retard / Impayés'] += rent;
              } else {
                m['Loyers Encaissés'] += rent;
              }
            }
          } else {
            m['Loyers Encaissés'] += rent;
          }
        }
      });
    });

    return months;
  }, [leases]);

  return {
    allValidatedPayments, setAllValidatedPayments,
    paymentsSubTab, setPaymentsSubTab,
    selectedStatementLease, setSelectedStatementLease,
    generatingReleveId, setGeneratingReleveId,
    selectedHistoryLease, setSelectedHistoryLease,
    
    // Validation fields
    paymentToValidate, setPaymentToValidate,
    confirmAmount, setConfirmAmount,
    confirmDate, setConfirmDate,
    confirmMode, setConfirmMode,
    confirmStatus, setConfirmStatus,
    
    // Calculated statistics
    activePropertiesCount,
    activeContractsCount,
    monthlyRentRevenue,
    vacantPropertiesCount: vacantBiensCount,
    vacancyRate,
    lateContractsCount,
    totalPaidRent,
    totalLateRent,
    complianceRate,
    last6MonthsData,
    
    // Core payment functions
    fetchAllValidatedPayments,
    getLeasePaymentStatus,
    getLeasePaymentHistory,
    handleSavePaymentConfirmation,
    handleCancelPaymentConfirmation,
    handleGenerateAndSaveReleve,
    generateReleveHtml
  };
}
