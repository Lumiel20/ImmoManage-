import { useState, useEffect } from 'react';
import { ActionLog } from '../types';

export function useActionLogs() {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>(() => {
    const local = localStorage.getItem('immo_action_logs');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'log-1',
        type: 'creation',
        target: 'contrat',
        title: 'Bail de location créé',
        description: "Nouveau bail de location actif pour l'Appartement Haussmannien.",
        timestamp: 'Il y a 10 min',
        date: '04/06/2026 11:24'
      },
      {
        id: 'log-2',
        type: 'creation',
        target: 'bien',
        title: 'Bien immobilier ajouté',
        description: "L'Appartement Haussmannien à Paris a été enregistré dans le catalogue.",
        timestamp: 'Il y a 1 h',
        date: '04/06/2026 10:15'
      },
      {
        id: 'log-3',
        type: 'edition',
        target: 'contrat',
        title: 'Contrat de bail mis à jour',
        description: "La date d'expiration et la périodicité du bail pour le Studio Lyon ont été mis à jour.",
        timestamp: 'Il y a 2 h',
        date: '04/06/2026 09:30'
      },
      {
        id: 'log-4',
        type: 'creation',
        target: 'locataire',
        title: 'Profil locataire enregistré',
        description: 'Le client Jean Dupont (Ingénieur) a été ajouté à la base de données.',
        timestamp: 'Hier',
        date: '03/06/2026 14:12'
      },
      {
        id: 'log-5',
        type: 'suppression',
        target: 'contrat',
        title: 'Contrat archivé / supprimé',
        description: 'Un ancien mandat expiré pour le Bureau Bordeaux a été archivé.',
        timestamp: 'Il y a 3j',
        date: '01/06/2026 11:58'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('immo_action_logs', JSON.stringify(actionLogs));
  }, [actionLogs]);

  const addActionLog = (
    type: 'creation' | 'edition' | 'suppression',
    target: 'contrat' | 'bien' | 'locataire',
    title: string,
    description: string
  ) => {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: ActionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      target,
      title,
      description,
      timestamp: "À l'instant",
      date: formattedDate
    };
    setActionLogs((prev) => [newLog, ...prev]);
  };

  return {
    actionLogs,
    setActionLogs,
    addActionLog
  };
}
