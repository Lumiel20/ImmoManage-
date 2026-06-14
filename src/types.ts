export interface User {
  id: number;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export interface Property {
  id: number;
  titre: string;
  description: string;
  type: string;
  prix: number;
  ville: string;
  statut: string;
  surface?: number;
  nb_pieces?: number;
}

export interface Lease {
  id: number;
  type: string;
  bien_id?: number;
  locataire_id?: number;
  bien_titre: string;
  locataire_email: string;
  date_debut: string;
  date_fin: string;
  loyer_mensuel?: number;
  prix_vente?: number;
  statut: string;
}

export interface ContractDocument {
  id: number;
  contrat_id: number;
  titre: string;
  type: string; // bail, quittance, autre
  url: string;
  storage_path: string;
  created_at: string;
}

export interface ActionLog {
  id: string;
  type: 'creation' | 'edition' | 'suppression';
  target: 'contrat' | 'bien' | 'locataire';
  title: string;
  description: string;
  timestamp: string;
  date: string;
}
