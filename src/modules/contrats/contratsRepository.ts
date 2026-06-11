import db from '../../config/db';

export const findAll = async () => {
  return db('contrats')
    .join('biens', 'contrats.bien_id', 'biens.id')
    .leftJoin('users as locataires', 'contrats.locataire_id', 'locataires.id')
    .select('contrats.*', 'biens.titre as bien_titre', 'locataires.email as locataire_email');
};

export const findById = async (id: number) => {
  return db('contrats').where('contrats.id', id).first();
};

export const create = async (contratData: any) => {
  const [id] = await db('contrats').insert(contratData);
  return id;
};

export const update = async (id: number, contratData: any) => {
  return db('contrats').where({ id }).update(contratData);
};

export const remove = async (id: number) => {
  return db('contrats').where({ id }).del();
};

export const getDocumentsByContratId = async (contratId: number) => {
  return db('documents').where({ contrat_id: contratId }).orderBy('id', 'desc');
};

export const addDocument = async (docData: any) => {
  const [id] = await db('documents').insert(docData);
  return id;
};

export const deleteDocument = async (docId: number) => {
  return db('documents').where({ id: docId }).del();
};

export const findDocumentById = async (docId: number) => {
  return db('documents').where({ id: docId }).first();
};

export const getAllPayments = async () => {
  return db('payments').orderBy('id', 'asc');
};

export const getPaymentsByContratId = async (contratId: number) => {
  return db('payments').where({ contrat_id: contratId }).orderBy('month_index', 'asc');
};

export const upsertPayment = async (paymentData: any) => {
  const { contrat_id, month_index, year } = paymentData;
  const existing = await db('payments').where({ contrat_id, month_index, year }).first();
  if (existing) {
    await db('payments').where({ id: existing.id }).update({
      amount: paymentData.amount,
      status: paymentData.status,
      date_paiement: paymentData.date_paiement,
      mode_paiement: paymentData.mode_paiement || 'virement',
      confirmed_by: paymentData.confirmed_by
    });
    return existing.id;
  } else {
    const [id] = await db('payments').insert(paymentData);
    return id;
  }
};

export const deletePayment = async (paymentId: number) => {
  return db('payments').where({ id: paymentId }).del();
};
