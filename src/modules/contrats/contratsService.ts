import * as contratsRepository from './contratsRepository';

export const getAllContrats = async () => {
  return contratsRepository.findAll();
};

export const getContratById = async (id: number) => {
  return contratsRepository.findById(id);
};

export const createContrat = async (contratData: any) => {
  return contratsRepository.create(contratData);
};

export const updateContrat = async (id: number, contratData: any) => {
  return contratsRepository.update(id, contratData);
};

export const deleteContrat = async (id: number) => {
  return contratsRepository.remove(id);
};

export const getDocuments = async (contratId: number) => {
  return contratsRepository.getDocumentsByContratId(contratId);
};

export const addDocument = async (contratId: number, documentData: any) => {
  return contratsRepository.addDocument({
    contrat_id: contratId,
    titre: documentData.titre,
    type: documentData.type,
    url: documentData.url,
    storage_path: documentData.storage_path
  });
};

export const deleteDocument = async (docId: number) => {
  return contratsRepository.deleteDocument(docId);
};

export const getDocumentById = async (docId: number) => {
  return contratsRepository.findDocumentById(docId);
};

export const getAllPayments = async () => {
  return contratsRepository.getAllPayments();
};

export const getPayments = async (contratId: number) => {
  return contratsRepository.getPaymentsByContratId(contratId);
};

export const confirmPayment = async (contratId: number, paymentData: any) => {
  return contratsRepository.upsertPayment({
    contrat_id: contratId,
    month_index: paymentData.month_index,
    year: paymentData.year,
    amount: paymentData.amount,
    status: paymentData.status,
    date_paiement: paymentData.date_paiement,
    mode_paiement: paymentData.mode_paiement || 'virement',
    confirmed_by: paymentData.confirmed_by
  });
};

export const deletePayment = async (paymentId: number) => {
  return contratsRepository.deletePayment(paymentId);
};
