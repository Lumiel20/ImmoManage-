import React, { useState } from 'react';
import { Lease, Property } from '../types';
import { safeFetchJson } from './usePropertyApp';

interface UseLeasesParams {
  token: string | null;
  properties: Property[];
  tenants: any[];
  addActionLog: (
    type: 'creation' | 'edition' | 'suppression',
    target: 'contrat' | 'bien' | 'locataire',
    title: string,
    description: string
  ) => void;
  setToastMsg: (msg: string | null) => void;
  setConfirmModal: (modal: any) => void;
  formatPrice: (amount: number | null | undefined, rawOnlySymbol?: boolean) => string;
}

export function useLeases({
  token,
  properties,
  tenants,
  addActionLog,
  setToastMsg,
  setConfirmModal,
  formatPrice
}: UseLeasesParams) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loadingLeases, setLoadingLeases] = useState(false);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);

  // Form Fields
  const [leaseType, setLeaseType] = useState('bail');
  const [leasePropertyId, setLeasePropertyId] = useState<number | ''>('');
  const [leaseTenantId, setLeaseTenantId] = useState<number | ''>('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [leaseMonthlyRent, setLeaseMonthlyRent] = useState(1000);
  const [leaseSalePrice, setLeaseSalePrice] = useState(50000);
  const [leaseStatus, setLeaseStatus] = useState('actif');

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getLeaseErrors = () => {
    const errors: Record<string, string> = {};
    if (!leasePropertyId) {
      errors.propertyId = 'Please select a property.';
    }
    if (!leaseStartDate) {
      errors.startDate = "Start date is required.";
    }
    if (leaseStartDate && leaseEndDate) {
      const start = new Date(leaseStartDate);
      const end = new Date(leaseEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        errors.endDate = 'End date must be after or equal to start date.';
      }
    }
    if (leaseType !== 'vente') {
      if (leaseMonthlyRent <= 0) {
        errors.rent = 'Rent must be greater than 0.';
      }
    } else {
      if (leaseSalePrice <= 0) {
        errors.salePrice = 'Sale price must be greater than 0.';
      }
    }
    return errors;
  };

  const fetchLeases = async () => {
    if (!token) return;
    setLoadingLeases(true);
    try {
      const json = await safeFetchJson('/api/v1/contrats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (json.success) setLeases(json.data);
    } catch (err: any) {
      if (err?.message !== 'Invalid token' && err?.message !== 'Unauthorized') {
        console.error("Error fetching leases:", err);
      }
    } finally {
      setLoadingLeases(false);
    }
  };

  const openNewLease = () => {
    setTouched({});
    setAttemptedSubmit(false);
    setEditingLease(null);
    setLeaseType('bail');
    setLeasePropertyId('');
    setLeaseTenantId('');
    setLeaseStartDate('');
    setLeaseEndDate('');
    setLeaseMonthlyRent(1000);
    setLeaseSalePrice(145000);
    setLeaseStatus('actif');
    setIsLeaseModalOpen(true);
  };

  const openEditLease = (lease: Lease) => {
    setTouched({});
    setAttemptedSubmit(false);
    setEditingLease(lease);
    setLeaseType(lease.type || 'bail');
    setLeasePropertyId(lease.bien_id || '');
    setLeaseTenantId(lease.locataire_id || '');
    setLeaseStartDate(lease.date_debut || '');
    setLeaseEndDate(lease.date_fin || '');
    setLeaseMonthlyRent(lease.loyer_mensuel || 1000);
    setLeaseSalePrice(lease.prix_vente || 50000);
    setLeaseStatus(lease.statut || 'actif');
    setIsLeaseModalOpen(true);
  };

  const handleSaveLease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setAttemptedSubmit(true);
    const errors = getLeaseErrors();
    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      type: leaseType,
      bien_id: Number(leasePropertyId),
      locataire_id: leaseTenantId ? Number(leaseTenantId) : null,
      date_debut: leaseStartDate,
      date_fin: leaseEndDate || null,
      loyer_mensuel: leaseType !== 'vente' ? Number(leaseMonthlyRent) : null,
      prix_vente: leaseType === 'vente' ? Number(leaseSalePrice) : null,
      statut: leaseStatus
    };

    try {
      const url = editingLease ? `/api/v1/contrats/${editingLease.id}` : '/api/v1/contrats';
      const method = editingLease ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        addActionLog(
          editingLease ? 'edition' : 'creation',
          'contrat',
          editingLease ? 'Contract updated' : 'Contract signed',
          editingLease ? `Modifications saved for contract ID #${editingLease.id}.` : `New contract successfully registered.`
        );
        setIsLeaseModalOpen(false);
        fetchLeases();
      } else {
        alert(json.error?.message || "An error occurred.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const handleDeleteLease = (id: number) => {
    if (!token) return;
    const targetLease = leases.find(c => c.id === id);
    if (!targetLease) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete lease contract",
      message: `Are you sure you want to delete the contract for "${targetLease.bien_titre}"? This action is irreversible.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/v1/contrats/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (json.success) {
            addActionLog('suppression', 'contrat', 'Contract deleted', `We deleted contract #${id} for property "${targetLease.bien_titre}".`);
            setToastMsg(`Contract for "${targetLease.bien_titre}" deleted successfully!`);
            fetchLeases();
          } else {
            setToastMsg(json.error?.message || "An error occurred.");
          }
        } catch (err) {
          console.error(err);
          setToastMsg("Connection error.");
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const generateLeasePrintHtml = (c: Lease) => {
    const startObj = c.date_debut ? new Date(c.date_debut) : null;
    const endObj = c.date_fin ? new Date(c.date_fin) : null;
    const formatD = (d: Date | null) => d ? d.toLocaleDateString('fr-FR') : 'Non renseignée';
    const clientName = tenants.find(t => t.id === c.locataire_id)?.last_name || '';
    const clientFirstName = tenants.find(t => t.id === c.locataire_id)?.first_name || '';
    const clientLabel = clientName ? `${clientFirstName} ${clientName}` : c.locataire_email;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Bail de Location Officiel - ${c.bien_titre}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background: #faf9f6; line-height: 1.6; }
    .page { max-width: 800px; margin: 0 auto; background: #fff; padding: 60px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 30px; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: 800; color: #4f46e5; margin-bottom: 10px; }
    .title { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 35px; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .block { font-size: 13px; color: #334155; }
    .block p { margin: 4px 0; }
    .specs-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    .specs-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #475569; text-align: left; }
    .specs-table td { border-bottom: 1px solid #f1f5f9; padding: 12px; font-size: 13px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">IMMOMANAGE SERVICES</div>
      <div class="title">Bail de Location d'Habitation Professionnel</div>
      <div class="meta">Enregistré électroniquement sous la référence #ACTE-2026-${c.id}</div>
    </div>

    <div class="grid">
      <div>
        <div class="section-title">ADMINISTRATEUR DU BIEN</div>
        <div class="block">
          <p><strong>ImmoManage Solutions</strong></p>
          <p>Mandataire agréé d'administration</p>
          <p>Paris, France</p>
          <p>contact@immomanage.io</p>
        </div>
      </div>
      <div>
        <div class="section-title">PRENEUR (LOCATAIRE)</div>
        <div class="block">
          <p><strong>Client : ${clientLabel}</strong></p>
          <p>Email: ${c.locataire_email || 'Non spécifié'}</p>
          <p>Activité: Cadre professionnel certifié</p>
        </div>
      </div>
    </div>

    <div class="section-title">DÉTAILS ET DISPOSITIONS CONTRACTUELLES</div>
    <table class="specs-table">
      <thead>
        <tr>
          <th>Désignation de la clause</th>
          <th>Valeur et conditions de l'acte</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Bien désignataire</strong></td>
          <td style="color: #4f46e5; font-weight: 600;">${c.bien_titre}</td>
        </tr>
        <tr>
          <td><strong>Nature de l'acte</strong></td>
          <td>${c.type === 'bail' ? "Contrat de Location (Bail standard d'habitation)" : c.type}</td>
        </tr>
        <tr>
          <td><strong>Date de prise d'effet</strong></td>
          <td>${formatD(startObj)}</td>
        </tr>
        <tr>
          <td><strong>Échéance contractuelle</strong></td>
          <td>${c.date_fin ? formatD(endObj) : "Contrat à durée indéterminée"}</td>
        </tr>
        <tr>
          <td><strong>Loyer mensuel HC</strong></td>
          <td style="font-family: monospace; font-weight: 600; font-size: 14px;">${c.loyer_mensuel ? formatPrice(c.loyer_mensuel) : formatPrice(0)} / mois</td>
        </tr>
        <tr>
          <td><strong>Prix d'acquisition (si applicable)</strong></td>
          <td style="font-family: monospace;">${c.prix_vente ? formatPrice(c.prix_vente) : '-'}</td>
        </tr>
        <tr>
          <td><strong>Statut juridique</strong></td>
          <td><span style="font-size: 11px; font-weight: bold; background: #def7ec; color: #03543f; padding: 2px 8px; border-radius: 4px;">Actif - En cours d me gérance</span></td>
        </tr>
      </tbody>
    </table>

    <div style="font-size: 12px; color: #475569; margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 6px; border-left: 4px solid #4f46e5;">
      <strong>Mentions légales d'usage :</strong> Le présent contrat engage solidairement les parties conformément aux dispositions de la législation en vigueur sur les baux commerciaux et d'habitation. Les loyers sont payables terme à échoir le premier de chaque mois.
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px; color: #475569; margin-top: 40px;">
      <div>
        <strong>Signature de l'Administrateur / Mandataire</strong>
        <p style="color: #94a3b8; font-size: 10px; margin: 2px 0 0 0;">ImmoManage Solution</p>
        <div style="height: 60px; border-bottom: 1px dashed #cbd5e1; margin-top: 10px;"></div>
        <p style="margin-top: 5px; color: #94a3b8;">Visa électronique enregistré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      <div>
        <strong>Signature du Mandant / Preneur</strong>
        <p style="color: #94a3b8; font-size: 10px; margin: 2px 0 0 0;">Lu et approuvé - Mention manuscrite</p>
        <div style="height: 60px; border-bottom: 1px dashed #cbd5e1; margin-top: 10px;"></div>
        <p style="margin-top: 5px; color: #94a3b8;">Pour acceptation des termes et conditions du mandat</p>
      </div>
    </div>

    <div class="footer" style="margin-top: 60px;">
      Ce document est un récapitulatif officiel de l'acte contractuel enregistré dans les bases d'accès de l'application.<br/>
      ImmoManage Software Services © 2026. Tous droits réservés.
    </div>
  </div>
</body>
</html>
`;
  };

  const handlePrintLease = (c: Lease) => {
    const html = generateLeasePrintHtml(c);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
      setToastMsg(`Print/PDF export layout launched for lease "${c.bien_titre}"`);
    } else {
      alert("The print popup was blocked by the browser. Please approve popups to print.");
    }
  };

  const leaseErrors = getLeaseErrors();

  return {
    leases, setLeases,
    loadingLeases, setLoadingLeases,
    isLeaseModalOpen, setIsLeaseModalOpen,
    editingLease, setEditingLease,
    
    // Form fields
    leaseType, setLeaseType,
    leasePropertyId, setLeasePropertyId,
    leaseTenantId, setLeaseTenantId,
    leaseStartDate, setLeaseStartDate,
    leaseEndDate, setLeaseEndDate,
    leaseMonthlyRent, setLeaseMonthlyRent,
    leaseSalePrice, setLeaseSalePrice,
    leaseStatus, setLeaseStatus,
    
    // Validation
    leaseErrors,
    leaseTouched: touched,
    leaseAttemptedSubmit: attemptedSubmit,
    markLeaseTouched: markTouched,
    
    // Methods
    fetchLeases,
    openNewLease,
    openEditLease,
    handleSaveLease,
    handleDeleteLease,
    handlePrintLease
  };
}
