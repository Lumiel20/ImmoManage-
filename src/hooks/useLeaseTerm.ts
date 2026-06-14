import { useState, useMemo, useEffect } from 'react';
import { Lease } from '../types';

interface UseLeaseTermParams {
  leases: Lease[];
  addActionLog: (
    type: 'creation' | 'edition' | 'suppression',
    target: 'contrat' | 'bien' | 'locataire',
    title: string,
    description: string
  ) => void;
  setToastMsg: (msg: string | null) => void;
}

export function useLeaseTerm({ leases, addActionLog, setToastMsg }: UseLeaseTermParams) {
  const [notifiedLeases, setNotifiedLeases] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('property_notified_leases');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      localStorage.removeItem('property_notified_leases');
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('property_notified_leases', JSON.stringify(notifiedLeases));
  }, [notifiedLeases]);

  const expiringLeases = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leases.filter(lease => {
      if (lease.type !== 'bail' || lease.statut !== 'actif' || !lease.date_fin) return false;
      
      const endDate = new Date(lease.date_fin);
      if (isNaN(endDate.getTime())) return false;
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= -15 && diffDays <= 7;
    }).map(lease => {
      const endDate = new Date(lease.date_fin!);
      endDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...lease,
        daysRemaining: diffDays
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [leases]);

  const sendExpiryNotification = (lease: Lease, daysRemaining: number) => {
    if (notifiedLeases.includes(lease.id)) return;
    
    setNotifiedLeases((prev) => [...prev, lease.id]);
    setToastMsg(`Notification sent to ${lease.locataire_email || 'no email'} for property "${lease.bien_titre}"!`);
    
    addActionLog(
      'edition',
      'contrat',
      "Lease expiration warning notification sent",
      `Alert successfully sent to ${lease.locataire_email || 'registered address'} at J-${daysRemaining} of lease term for property [${lease.bien_titre}]. End date on ${lease.date_fin ? new Date(lease.date_fin).toLocaleDateString('fr-FR') : 'not specified'}.`
    );
  };

  return {
    notifiedLeases,
    setNotifiedLeases,
    expiringLeases,
    sendExpiryNotification
  };
}
