import db from '../../config/db';

export const findAll = async (filters: any) => {
  let query = db('biens');
  if (filters.type) query = query.where({ type: filters.type });
  if (filters.ville) query = query.where({ ville: filters.ville });
  if (filters.minPrix) query = query.where('prix', '>=', filters.minPrix);
  if (filters.maxPrix) query = query.where('prix', '<=', filters.maxPrix);
  return query.select('*');
};

export const findById = async (id: number) => {
  return db('biens').where({ id }).first();
};

export const create = async (bienData: any) => {
  const [id] = await db('biens').insert(bienData);
  return id;
};

export const update = async (id: number, bienData: any) => {
  return db('biens').where({ id }).update(bienData);
};

export const remove = async (id: number) => {
  return db('biens').where({ id }).del();
};
